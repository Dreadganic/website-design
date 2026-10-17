/* Tests for the Beju Farm backend. Run: npm test
   Uses an in-memory store and a fake Stripe, so no accounts or network are needed. */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const account = require("../functions/game-account");
const save = require("../functions/game-save");
const score = require("../functions/game-score");
const claim = require("../functions/game-claim");
const events = require("../functions/game-events");

let store, clock;
const deps = () => ({ store, now: clock });
for (const f of [account, save, score, claim, events]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth, query) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: query || {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
const newPlayer = async () => { const r = await call(account, "POST", { name: "Tester" }); return r.body.player + "." + r.body.token; };
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-17T03:00:00Z"); });

test("accounts: token works, wrong token does not", async () => {
  const a = await newPlayer();
  assert.equal((await call(save, "GET", undefined, a)).body.none, true);
  assert.equal((await call(save, "GET", undefined, a.slice(0, -2) + "xx")).status, 401);
  assert.equal((await call(save, "GET")).status, 401);
  const rec = await store.get("players/" + a.split(".")[0]);
  assert.ok(rec.tokenHash && !JSON.stringify(rec).includes(a.split(".")[1]), "only the hash is stored");
});

test("saves: versions stop an old device overwriting newer progress", async () => {
  const a = await newPlayer();
  assert.deepEqual((await call(save, "PUT", { base: 0, data: { coins: 100 } }, a)).body.version, 1);
  clock += 6000;
  assert.equal((await call(save, "PUT", { base: 1, data: { coins: 200 } }, a)).body.version, 2);
  clock += 6000;
  const stale = await call(save, "PUT", { base: 1, data: { coins: 50 } }, a);
  assert.equal(stale.status, 409); assert.equal(stale.body.data.coins, 200);
  assert.equal((await call(save, "GET", undefined, a)).body.data.coins, 200);
  assert.equal((await call(save, "PUT", { base: 2, data: { coins: 300 } }, a)).body.version, 3);
  assert.equal((await call(save, "PUT", { base: 3, data: { coins: 1 } }, a)).status, 429, "too soon after the last save");
});

test("scores: honest progress is accepted and ranked", async () => {
  const a = await newPlayer(), b = await newPlayer();
  const s = (p, sp, pts) => ({ name: "Farmer", prestige: p, seasonP: sp, seasonKh: pts, level: G.levelFor(pts), points: pts, look: { crest: p + 3, skin: p, bg: "huila", char: "kitsune" } });
  assert.equal((await call(score, "POST", s(0, 0, 500), a)).status, 200);
  assert.equal((await call(score, "POST", s(0, 0, 100), b)).status, 200);
  clock += 60000;
  assert.equal((await call(score, "POST", s(0, 0, 2400), a)).status, 200);
  const board = await call(score, "GET", undefined, b, { mode: "season" });
  assert.equal(board.body.top[0].points, 2400); assert.equal(board.body.me.rank, 2);
  assert.deepEqual(board.body.top[0].look, { crest: 0, skin: 0, bg: "huila", char: "kitsune" }, "crest is capped at the prestige tier");
  assert.deepEqual(G.cleanLook({ plate: 3, border: 3, skin: 2, bg: "<script>" }), { crest: 3, skin: 2, bg: "none", char: "none" }, "old looks still read");
});

test("scores: impossible jumps are rejected", async () => {
  const a = await newPlayer();
  const s = (p, sp, pts, lv) => ({ name: "Farmer", prestige: p, seasonP: sp, level: lv || G.levelFor(pts), points: pts });
  assert.equal((await call(score, "POST", s(5, 5, 0), a)).body.error, "too_far_for_a_new_player");
  assert.equal((await call(score, "POST", s(0, 0, 1000, 9), a)).body.error, "level_mismatch");
  assert.equal((await call(score, "POST", s(0, 0, 1000), a)).status, 200);
  clock += 5000;
  assert.equal((await call(score, "POST", s(0, 0, 1200), a)).body.error, "too_soon");
  clock += 30000;
  assert.equal((await call(score, "POST", s(0, 0, 9e6), a)).body.error, "too_fast");
  assert.equal((await call(score, "POST", s(1, 1, 0), a)).body.error, "prestige_without_level");
  assert.equal((await call(score, "POST", { name: "www.spam.com", prestige: 0, seasonP: 0, level: 1, points: 0 }, a)).body.error, "bad_name");
});

test("scores: a real prestige is accepted, but not twice in a few minutes", async () => {
  const a = await newPlayer();
  const s = (p, sp, pts) => ({ name: "Farmer", prestige: p, seasonP: sp, level: G.levelFor(pts), points: pts });
  await call(score, "POST", s(0, 0, 900), a);
  for (let i = 0; i < 12; i++) { clock += 300000; await call(score, "POST", s(0, 0, 900 + (i + 1) * 1800), a); }
  clock += 60000;
  assert.equal((await call(score, "POST", s(1, 1, 0), a)).status, 200);
  for (const pts of [40000, G.XP_AT(18)]) { clock += 60000; assert.equal((await call(score, "POST", s(1, 1, pts), a)).status, 200); }   /* bursts can reach level 18 quickly... */
  clock += 60000;
  assert.equal((await call(score, "POST", s(2, 2, 0), a)).body.error, "prestige_too_fast");   /* ...but a second prestige this soon is refused */
  clock += 15 * 60000;
  assert.equal((await call(score, "POST", s(2, 2, 0), a)).status, 200);
});

test("claims: a paid order grants cranes and coffees once", async () => {
  const a = await newPlayer(), b = await newPlayer();
  const fakeStripe = async (url) => ({ ok: true, json: async () => (url.includes("/line_items")
    ? { data: [{ quantity: 2, price: { product: { metadata: { pid: "casablanca" } } } }, { quantity: 1, price: { product: { metadata: { pid: "pinkwhiskey" } } } }] }
    : { id: "cs_test_abcdefghijkl", payment_status: "paid", amount_total: 10500 }) });
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  Object.defineProperty(claim, "__deps", { get: () => ({ store, now: clock, fetch: fakeStripe }), configurable: true });
  const r = await call(claim, "POST", { session_id: "cs_test_abcdefghijkl" }, a);
  assert.equal(r.status, 200); assert.equal(r.body.cranes, 105); assert.deepEqual(r.body.coffees, ["casablanca", "casablanca", "pinkwhiskey"]);
  assert.equal((await call(claim, "POST", { session_id: "cs_test_abcdefghijkl" }, a)).body.again, true, "same player gets the same answer");
  assert.equal((await call(claim, "POST", { session_id: "cs_test_abcdefghijkl" }, b)).status, 409, "another player can't claim it");
  const unpaid = async (url) => ({ ok: true, json: async () => ({ payment_status: "unpaid", amount_total: 3000 }) });
  Object.defineProperty(claim, "__deps", { get: () => ({ store, now: clock, fetch: unpaid }), configurable: true });
  assert.equal((await call(claim, "POST", { session_id: "cs_test_zzzzzzzzzzzz" }, a)).status, 402);
  assert.equal((await call(claim, "POST", { session_id: "nope" }, a)).status, 400);
});

test("scores: prestige needs 8 more levels each time, and the season board ranks know-how", async () => {
  assert.deepEqual([0, 1, 2, 3].map(G.prestigeNeed), [10, 18, 26, 34]);
  assert.ok(G.XP_AT(11) > G.XP_AT(10) && Math.abs(G.XP_AT(20) / G.XP_AT(19) - 1.2) < 0.01, "levels past 10 grow 1.2x");
  const a = await newPlayer(), b = await newPlayer();
  const s = (kh, pts) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: kh, level: G.levelFor(pts), points: pts });
  await call(score, "POST", s(5000, 5000), a); await call(score, "POST", s(9000, 2000), b);
  const board = await call(score, "GET", undefined, a, { mode: "season" });
  assert.equal(board.body.top[0].seasonKh, 9000, "most know-how this month leads the season board");
  clock += 20000;
  assert.equal((await call(score, "POST", s(5000 + 1e7, 5000), a)).body.error, "too_fast");
});

test("events: only current and upcoming drops are served", async () => {
  Object.defineProperty(events, "__deps", { get: () => ({ now: Date.parse("2026-11-03T00:00:00Z"), events: { events: [
    { id: "old", starts: "2026-10-01T00:00:00Z", ends: "2026-10-08T00:00:00Z" },
    { id: "now", starts: "2026-11-01T00:00:00Z", ends: "2026-11-08T00:00:00Z" },
    { id: "soon", starts: "2026-12-01T00:00:00Z", ends: "2026-12-08T00:00:00Z" }] } }), configurable: true });
  const r = await call(events, "GET");
  assert.deepEqual(r.body.events.map((e) => e.id + ":" + e.live), ["now:true", "soon:false"]);
});
