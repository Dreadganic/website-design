/* Tests for the Beju Farm backend. Run: npm test
   Uses an in-memory store and a fake Stripe, so no accounts or network are needed. */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const account = require("../lib/handlers/game-account");
const save = require("../lib/handlers/game-save");
const score = require("../lib/handlers/game-score");
const claim = require("../lib/handlers/game-claim");
const events = require("../lib/handlers/game-events");
const visit = require("../lib/handlers/game-visit");
const nameFn = require("../lib/handlers/game-name");

let store, clock;
const deps = () => ({ store, now: clock });
for (const f of [account, save, score, claim, events, visit, nameFn]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth, query) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: query || {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
let seq = 0;   /* every farmer needs a name of their own */
const newPlayer = async (name) => { const r = await call(account, "POST", { name: name || "Tester " + (++seq) }); return r.body.player + "." + r.body.token; };
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-17T03:00:00Z"); process.env.GAME_WELCOME_UNTIL = "2026-01-01"; });   /* the welcome window is closed unless a test opens it */
test.after(() => { delete process.env.GAME_WELCOME_UNTIL; });

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
  assert.deepEqual(board.body.top[0].look, { crest: 0, skin: 0, bg: "huila", char: "kitsune", hat: "", charm: "", roaster: "", pin: "", title: "" }, "crest is capped at the prestige tier");
  assert.deepEqual(G.cleanLook({ plate: 3, border: 3, skin: 2, bg: "<script>" }), { crest: 3, skin: 2, bg: "none", char: "none", hat: "", charm: "", roaster: "", pin: "", title: "" }, "old looks still read");
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
  assert.equal((await call(score, "POST", s(1, 1, 0), a)).body.error, "prestige_too_fast");
  clock += 16 * 60e3; assert.equal((await call(score, "POST", s(0, 0, 1500), a)).status, 200);
  clock += 30000; assert.equal((await call(score, "POST", s(1, 1, 0), a)).body.error, "prestige_without_level", "level 2 thirty seconds ago, prestige now: no");
  assert.equal((await call(nameFn, "POST", { name: "www.spam.com" }, a)).body.error, "bad_name");
});

test("scores: a row that missed a prestige or two catches up once enough time has passed, instead of being stuck", async () => {
  const a = await newPlayer();
  const s = (p, sp, pts) => ({ name: "Catcher", prestige: p, seasonP: sp, level: G.levelFor(pts), points: pts });
  assert.equal((await call(score, "POST", s(0, 0, 1000), a)).status, 200);
  clock += 20 * 60e3;
  assert.equal((await call(score, "POST", s(2, 2, 500), a)).body.error, "prestige_jump", "two prestiges in 20 minutes: no");
  clock += 15 * 60e3;
  const r = await call(score, "POST", s(2, 2, 500), a);
  assert.equal(r.status, 200, "two prestiges in 35 minutes, the level never seen: accepted, so the board catches up");
  clock += 60e3;
  assert.equal((await call(score, "POST", s(3, 3, 0), a)).body.error, "prestige_too_fast");
});

test("scores: a real prestige is accepted, but not twice in a few minutes", async () => {
  const a = await newPlayer();
  const s = (p, sp, pts) => ({ name: "Farmer", prestige: p, seasonP: sp, level: G.levelFor(pts), points: pts });
  await call(score, "POST", s(0, 0, 900), a);
  for (let i = 0; i < 12; i++) { clock += 300000; await call(score, "POST", s(0, 0, 900 + (i + 1) * 10000), a); }   /* past level 10, which takes 5x the know-how it used to */
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
  assert.equal(r.status, 200); assert.equal(r.body.cranes, 135, "1 per ¥100 plus 30 for the month's first order"); assert.equal(r.body.bonus, 30); assert.deepEqual(r.body.coffees, ["casablanca", "casablanca", "pinkwhiskey"]);
  assert.equal((await call(claim, "POST", { session_id: "cs_test_abcdefghijkl" }, a)).body.again, true, "same player gets the same answer");
  assert.equal((await call(claim, "POST", { session_id: "cs_test_abcdefghijkl" }, b)).status, 409, "another player can't claim it");
  const unpaid = async (url) => ({ ok: true, json: async () => ({ payment_status: "unpaid", amount_total: 3000 }) });
  Object.defineProperty(claim, "__deps", { get: () => ({ store, now: clock, fetch: unpaid }), configurable: true });
  assert.equal((await call(claim, "POST", { session_id: "cs_test_zzzzzzzzzzzz" }, a)).status, 402);
  assert.equal((await call(claim, "POST", { session_id: "nope" }, a)).status, 400);
});

test("scores: prestige needs 8 more levels each time, and the season board ranks season stars, then who got there first", async () => {
  assert.deepEqual([0, 1, 2, 3].map(G.prestigeNeed), [10, 18, 26, 34]);
  assert.ok(G.XP_AT(11) > G.XP_AT(10) && Math.abs(G.XP_AT(28) / G.XP_AT(27) - 1.22) < 0.01, "once the early easing ends, levels grow 1.22x");
  const a = await newPlayer(), b = await newPlayer();
  const s = (kh, pts, st) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: kh, seasonStars: st || 0, level: G.levelFor(pts), points: pts });
  await call(score, "POST", s(5000, 5000), a); clock += 1000; await call(score, "POST", s(9000, 2000), b);
  const board = await call(score, "GET", undefined, a, { mode: "season" });
  assert.equal(board.body.top[0].seasonKh, 5000, "with equal stars, whoever reached the total first leads, however much know-how the other has");
  const c = await newPlayer(); await call(score, "POST", { name: "Farmer", prestige: 1, seasonP: 1, seasonKh: 100, seasonStars: 12, level: 1, points: 0 }, c);
  const top = (await call(score, "GET", undefined, a, { mode: "season" })).body.top[0];
  assert.equal(top.seasonStars, 12, "season stars beat any amount of know-how"); assert.equal(top.seasonP, 1);
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

test("seasons: stars can only grow as fast as the daily caps allow", async () => {
  const a = await newPlayer();
  const s = (st) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: 0, seasonStars: st, level: 1, points: 0 });
  assert.equal((await call(score, "POST", s(500), a)).body.error, "too_far_for_a_new_player");
  assert.equal((await call(score, "POST", s(30), a)).status, 200);
  clock += 60000;
  assert.equal((await call(score, "POST", s(200), a)).body.error, "too_many_stars", "a minute later");
  clock += 5 * 86400e3;
  assert.equal((await call(score, "POST", s(150), a)).status, 200, "five days of capped play");
});

test("scores: small steps every 15 seconds can't add up past what the time allows", async () => {
  const a = await newPlayer();
  const s = (st) => ({ name: "Stepper", prestige: 0, seasonP: 0, seasonKh: 0, seasonStars: st, level: 1, points: 0 });
  assert.equal((await call(score, "POST", s(10), a)).status, 200);
  let st = 10, refused = "";
  for (let i = 0; i < 40 && !refused; i++) { clock += 16000; st += 45; const r = await call(score, "POST", s(st), a); if (r.status !== 200) refused = r.body.error; }
  assert.equal(refused, "too_many_stars", "45 stars every 16 seconds is stopped within minutes");
  assert.ok(st < 200, "before it gets far: " + st);
});

test("seasons: the first request of a new season saves the final board, and final ranks come from it", async () => {
  clock = Date.parse("2026-11-29T03:00:00Z");
  const a = await newPlayer(), b = await newPlayer();
  const s = (st, kh) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: kh, seasonStars: st, level: 1, points: 0 });
  await call(score, "POST", s(40, 10), a); await call(score, "POST", s(20, 99), b);
  assert.equal((await call(score, "GET", undefined, a, { mode: "final", season: "2026-11" })).body.error, "season_not_over");
  clock = Date.parse("2026-11-30T16:00:00Z");   /* 1 December in Japan */
  assert.equal(G.seasonKey(clock), "2026-12");
  await call(score, "POST", s(2, 0), a);   /* a moves on to December straight away */
  const fin = await call(score, "GET", undefined, b, { mode: "final", season: "2026-11" });
  assert.equal(fin.status, 200); assert.equal(fin.body.top[0].seasonStars, 40, "a's November stars were kept"); assert.equal(fin.body.me.rank, 2);
  const live = await call(score, "GET", undefined, b, { mode: "season" });
  assert.equal(live.body.players, 1, "December has only the player who played in it");
});

test("seasons: season cosmetics pass, made-up ones do not", () => {
  const l = G.cleanLook({ crest: 0, hat: "s_momiji", charm: "lights", title: "2026-10", bg: "s_sakura" }, 0);
  assert.deepEqual([l.hat, l.charm, l.title, l.bg], ["s_momiji", "lights", "2026-10", "s_sakura"]);
  const bad = G.cleanLook({ hat: "s_<b>", charm: "gold", title: "2099-01", bg: "s_nope" }, 0);
  assert.deepEqual([bad.hat, bad.charm, bad.title, bad.bg], ["", "", "", "none"], "unknown themes and future titles are dropped");
  assert.equal(G.prevSeason("2027-01"), "2026-12");
  const nb = G.cleanLook({ title: "nb:geisha", charm: "qgrader" }, 0);
  assert.deepEqual([nb.title, nb.charm], ["nb:geisha", "qgrader"], "cupping notebook titles and the Q grader charm pass");
  assert.equal(G.cleanLook({ title: "nbt:emperor" }, 0).title, "", "made-up notebook titles do not");
});

test("roastery cosmetics: finishes, the crack master charm and title pass; made-up ones do not", () => {
  const r = G.cleanLook({ roaster: "sakura", charm: "crack", title: "rr:crack" }, 0);
  assert.deepEqual([r.roaster, r.charm, r.title], ["sakura", "crack", "rr:crack"]);
  const bad = G.cleanLook({ roaster: "<img>", title: "rr:king" }, 0);
  assert.deepEqual([bad.roaster, bad.title], ["", ""]);
});


test("seasons: the rookie board lists only players in their first season, and final ranks include a rookie rank", async () => {
  const a = await newPlayer("Rookie");
  await call(score, "POST", { name: "Rookie", prestige: 0, seasonP: 0, seasonKh: 100, seasonStars: 5, level: G.levelFor(100), points: 100 }, a);
  await store.set("scores/veteran", { id: "veteran", name: "Old hand", prestige: 6, seasonP: 0, seasonKh: 9e6, seasonStars: 50, level: 40, points: 1e7, look: {}, season: G.seasonKey(clock), at: clock });
  clock += 3600e3 + 1;   /* a row written outside a score post (here, straight into the store) shows at the shared snapshot's hourly rebuild */
  const rook = await call(score, "GET", undefined, a, { mode: "rookie" }), all = await call(score, "GET", undefined, a, { mode: "season" });
  assert.deepEqual(rook.body.top.map((r) => r.name), ["Rookie"]); assert.equal(rook.body.top[0].rookie, true);
  assert.deepEqual(all.body.top.map((r) => r.name), ["Old hand", "Rookie"]);
  clock = Date.parse("2026-11-02T03:00:00Z"); await call(score, "GET", undefined, a, { mode: "season" });
  const fin = await call(score, "GET", undefined, a, { mode: "final", season: "2026-10" });
  assert.deepEqual([fin.body.me.rank, fin.body.me.rookieRank], [2, 1]);
});
test("visits: a farm snapshot gets a code, anyone can look, and Cheers come once a day per visitor", async () => {
  const a = await newPlayer("Ana"), b = await newPlayer();
  const farm = { loc: "huila", store: 6, decor: ["bench", "s_momiji", "<script>"], spiece: "momiji", farms: { mogiana: { u: 1, b: [5, 5, 5, 5, 5, 5], f: true, s: "fazenda", e: 3, h: 2, beds: ["caturra", "geisha", "../x"] }, huila: { u: 1, b: [3, 99], e: 9 }, toba: { u: 0 } } };
  const put = await call(visit, "PUT", { farm }, a);
  assert.equal(put.status, 200); assert.match(put.body.code, /^[A-Z2-9]{6}$/);
  const code = put.body.code;
  await call(score, "POST", { name: "Ana", prestige: 0, seasonP: 0, level: 1, points: 0 }, a);
  const seen = await call(visit, "GET", undefined, undefined, { code });
  assert.equal(seen.body.name, "Ana"); assert.equal(seen.body.farm.loc, "huila");
  assert.deepEqual(seen.body.farm.decor, ["bench", "s_momiji"], "unknown shapes are dropped");
  assert.deepEqual(seen.body.farm.farms.mogiana.beds, ["caturra", "geisha"]); assert.equal(seen.body.farm.farms.huila.e, 3); assert.equal(seen.body.farm.farms.huila.b[1], 12);
  assert.ok(!seen.body.farm.farms.toba, "locked farms aren't shown");
  const board = await call(score, "GET", undefined, b, { mode: "season" });
  assert.equal(board.body.top.find((r) => r.name === "Ana").code, code, "the leaderboard links to the farm");
  assert.equal((await call(visit, "POST", undefined, a, { code })).body.error, "own_farm");
  assert.equal((await call(visit, "POST", undefined, b, { code })).body.cheers, 1);
  assert.equal((await call(visit, "POST", undefined, b, { code })).body.error, "already_today");
  clock += 86400e3;
  assert.equal((await call(visit, "POST", undefined, b, { code })).body.cheers, 2, "again the next day");
  assert.equal((await call(visit, "PUT", { farm }, a)).body.code, code, "the code stays the same");
  assert.equal((await call(visit, "GET", undefined, undefined, { code: "ZZZZZZ" })).status, 404);
});

test("visits: a postcard rides a Cheers, unknown cards are dropped, and the host's keepsake shelf keeps the last five", async () => {
  const a = await newPlayer("Ana"), b = await newPlayer("Ben");
  const farm = { loc: "huila", store: 6, decor: ["bench"], spiece: "momiji", farms: { mogiana: { u: 1, b: [5, 5, 5, 5, 5, 5], f: true, s: "fazenda", e: 3, h: 2, beds: ["caturra", "geisha"] }, huila: { u: 1, b: [3, 99], e: 9 }, toba: { u: 0 } } };
  const code = (await call(visit, "PUT", { farm }, a)).body.code;
  await call(score, "POST", { name: "Ana", prestige: 0, seasonP: 0, level: 1, points: 0 }, a);
  await call(score, "POST", { name: "Ben", prestige: 0, seasonP: 0, level: 1, points: 0 }, b);
  assert.equal((await call(visit, "POST", { pc: "<script>" }, b, { code })).body.pc, null, "unknown cards are dropped");
  clock += 86400e3;
  assert.equal((await call(visit, "POST", { pc: "lovely" }, b, { code })).body.pc, "lovely");
  for (let i = 0; i < 5; i++) { clock += 86400e3; assert.equal((await call(visit, "POST", { pc: "wow" }, b, { code })).status, 200); }
  const seen = await call(visit, "GET", undefined, undefined, { code });
  assert.equal(seen.body.cards.length, 5, "the keepsake shelf keeps the last five");
  assert.deepEqual(seen.body.cards.map((c) => c.pc), ["wow", "wow", "wow", "wow", "wow"], "the oldest card falls off at five");
  assert.equal(seen.body.cards[0].name, "Ben");
  clock += 86400e3;
  assert.equal((await call(visit, "POST", { pc: "g_owl" }, b, { code })).body.pc, "g_owl", "a Galápagos photo rides a Cheers as a postcard");
  clock += 86400e3;
  assert.equal((await call(visit, "POST", { pc: "g_dodo" }, b, { code })).body.pc, null, "but not a photo that isn't in the field guide");
});

test("scores: a farm started again may start its row again, and nobody else can lower it", async () => {
  const a = await newPlayer();
  const s = (p, pts, extra) => Object.assign({ name: "Farmer", prestige: p, seasonP: 0, seasonKh: pts, level: G.levelFor(pts), points: pts }, extra || {});
  assert.equal((await call(score, "POST", s(0, 5000), a)).status, 200);
  await store.set("scores/" + a.split(".")[0], Object.assign(await store.get("scores/" + a.split(".")[0]), { prestige: 3, prestigeAt: clock - 864e5 }));   /* a farm at prestige 3 */
  clock += 60e3;
  assert.equal((await call(score, "POST", s(0, 100), a)).body.error, "prestige_went_down", "an old device can't lower the row by accident");
  clock += 60e3;
  const r = await call(score, "POST", s(0, 100, { reset: true }), a);
  assert.equal(r.status, 200, "a reset farm starts its row again");
  assert.equal((await store.get("scores/" + a.split(".")[0])).prestige, 0);
  clock += 60e3;
  assert.equal((await call(score, "POST", s(0, 9e6, { reset: true }), a)).body.error, "too_far_for_a_new_player", "a reset is checked like a new farm");
});

test("scores: the board reads every row once per 15 s, and your own post shows straight away", async () => {
  const a = await newPlayer(), b = await newPlayer();
  const s = (pts) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: pts, seasonStars: 1, level: G.levelFor(pts), points: pts });
  assert.equal((await call(score, "POST", s(100), a)).status, 200);
  let reads = 0; const get = store.get; store.get = async (k) => { if (k.startsWith("scores/")) reads++; return get(k); };
  await call(score, "GET", undefined, a, { mode: "season" }); await call(score, "GET", undefined, a, { mode: "season" });
  assert.ok(reads <= 1, "rows come from the cache: " + reads + " row reads");
  assert.equal((await call(score, "POST", s(200), b)).status, 200);
  assert.equal((await call(score, "GET", undefined, b, { mode: "season" })).body.players, 2, "b's own new row is on the board at once");
  store.get = get;
});

const coldScore = () => {   /* a second function instance: the same store, its own empty row cache */
  delete require.cache[require.resolve("../lib/handlers/game-score")];
  const h = require("../lib/handlers/game-score"); Object.defineProperty(h, "__deps", { get: deps, configurable: true }); return h;
};
test("scores: an instance that just started trusts the shared snapshot, but your own newest row is always in your rank and on your board", async () => {
  const a = await newPlayer(), b = await newPlayer();
  const s = (pts) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: pts, seasonStars: 1, level: G.levelFor(pts), points: pts });
  assert.equal((await call(score, "POST", s(100), a)).body.rank, 1);   /* the first request built the snapshot, before a's row */
  const cold = coldScore();
  const r = await call(cold, "POST", s(200), b);
  assert.ok(r.body.rank >= 1, "b's first post on a new instance comes back ranked, not 0: " + r.body.rank);
  const v = await call(coldScore(), "GET", undefined, b, { mode: "season" });
  assert.ok(v.body.me && v.body.me.rank >= 1, "and b's own board shows b, though the snapshot predates b's row");
  clock += 61e3;
  assert.equal((await call(cold, "GET", undefined, a, { mode: "season" })).body.players, 2, "a minute on, the snapshot is rebuilt and has everyone");
});

test("seasons: the final board reads every row fresh, not a snapshot or cache from before the last posts", async () => {
  clock = Date.parse("2026-11-30T14:59:00Z");   /* a minute before December in Japan */
  const a = await newPlayer(), b = await newPlayer();
  const s = (st) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: 10, seasonStars: st, level: 1, points: 0 });
  await call(score, "POST", s(5), a);   /* the snapshot is taken before a's row lands */
  const cold = coldScore();
  clock += 50e3; await call(cold, "POST", s(9), b);   /* this instance caches the snapshot, which has no a, plus b */
  clock = Date.parse("2026-11-30T15:00:10Z");   /* December: the first request comes to that instance, its cache 20 s old */
  await call(cold, "GET", undefined, a, { mode: "season" });
  const fin = await call(cold, "GET", undefined, a, { mode: "final", season: "2026-11" });
  assert.deepEqual(fin.body.top.map((x) => x.seasonStars), [9, 5], "both November rows are on the final board");
  assert.equal(fin.body.me.rank, 2);
});

test("scores: in the welcome window a farm that grew offline joins with its progress, once", async () => {
  process.env.GAME_WELCOME_UNTIL = "2026-11-30T23:59:59+09:00";
  const s = (p, sp, pts, extra) => Object.assign({ name: "Farmer", prestige: p, seasonP: sp, seasonKh: pts, level: G.levelFor(pts), points: pts }, extra || {});
  const a = await newPlayer();
  const r = await call(score, "POST", s(3, 2, 250000), a);
  assert.equal(r.status, 200, "a first score at prestige 3 is taken in the window");
  assert.equal((await store.get("scores/" + a.split(".")[0])).prestige, 3);
  clock += 60e3;
  assert.equal((await call(score, "POST", s(3, 2, 9e9), a)).body.error, "too_fast", "after the first score the usual rules apply");
  clock += 60e3;
  assert.equal((await call(score, "POST", s(4, 3, 9e9, { reset: true }), a)).body.error, "too_far_for_a_new_player", "a reset row doesn't get the welcome");
  const b = await newPlayer();
  assert.equal((await call(score, "POST", s(31, 0, 0), b)).body.error, "too_far_for_a_new_player", "nothing absurd");
  process.env.GAME_WELCOME_UNTIL = "2026-01-01";
  const c = await newPlayer();
  assert.equal((await call(score, "POST", s(3, 2, 250000), c)).body.error, "too_far_for_a_new_player", "after the window a new farm starts small again");
});

test("names: one farmer per name, ignoring case and spaces; stand-in names are nobody's; a new name frees the old one", async () => {
  const made = await call(account, "POST", { name: "Ana Paula" }), a = made.body.player + "." + made.body.token;
  assert.equal(made.status, 201); assert.equal(made.body.name, "Ana Paula", "a free name is theirs from the start");
  const b = await call(account, "POST", { name: "ana.paula" });
  assert.equal(b.status, 201); assert.equal(b.body.name, null, "a taken name still makes the farm, without a name");
  const bt = b.body.player + "." + b.body.token;
  assert.equal((await call(nameFn, "POST", { name: "ANA PAULA" }, bt)).status, 409);
  for (const n of ["You", "farmer", "Player 2", "Guest", "Farmer AB12"]) assert.equal((await call(nameFn, "POST", { name: n }, bt)).body.error, "generic_name", n);
  assert.equal((await call(nameFn, "POST", { name: "<>" }, bt)).body.error, "bad_name");
  assert.equal((await call(nameFn, "POST", { name: "Mika" })).status, 401);
  assert.equal((await call(nameFn, "POST", { name: "Mika" }, bt)).body.name, "Mika");
  assert.equal((await call(score, "POST", { name: "Ana Paula", prestige: 0, seasonP: 0, level: 1, points: 0 }, bt)).body.name, "Mika", "the board shows the name you hold, not one you send");
  assert.equal((await store.get("scores/" + b.body.player)).name, "Mika");
  assert.equal((await call(nameFn, "POST", { name: "ana paula" }, a)).body.name, "ana paula", "your own name in other letters is still yours");
  assert.equal((await call(nameFn, "POST", { name: "Bea" }, a)).body.name, "Bea");
  assert.equal((await call(nameFn, "POST", { name: "Ana Paula" }, bt)).body.name, "Ana Paula", "the old name is free again");
  assert.equal((await call(nameFn, "POST", { name: "Mika" }, a)).body.name, "Mika", "and so is Mika");
  assert.equal((await call(nameFn, "POST", { name: "Cai" }, a)).body.name, "Cai");
  assert.equal((await call(nameFn, "POST", { name: "Dee" }, a)).body.error, "too_many_renames", "three new names a day");
  clock += 864e5; assert.equal((await call(nameFn, "POST", { name: "Dee" }, a)).body.name, "Dee");
});

test("names: farms already on the board keep their names; unnamed rows wait off the board until they pick one", async () => {
  const a = await newPlayer(), b = await newPlayer(), c = await newPlayer(), id = (t) => t.split(".")[0];
  for (const t of [a, b, c]) { const p = await store.get("players/" + id(t)); delete p.nameKey; delete p.name; await store.set("players/" + id(t), p); }
  for (const k of await store.list("names/")) await store.del(k);   /* as the store was before names were kept */
  const row = (t, name, prestige) => store.set("scores/" + id(t), { id: id(t), name, prestige, seasonP: 0, seasonKh: 0, seasonStars: 0, level: 1, points: 0, look: {}, season: G.seasonKey(clock), at: clock, firstSeason: G.seasonKey(clock) });
  await row(a, "Beju", 1); await row(b, "beju", 0); await row(c, "You", 0);
  const d = await newPlayer(); clock += 60e3;
  assert.equal((await call(nameFn, "POST", { name: "BEJU" }, d)).status, 409, "the name the bigger farm had on the board is still theirs");
  assert.equal((await call(score, "POST", { name: "Beju", prestige: 1, seasonP: 0, level: 1, points: 0 }, a)).status, 200);
  assert.equal((await call(score, "POST", { name: "beju", prestige: 0, seasonP: 0, level: 1, points: 0 }, b)).body.error, "name_taken", "the other one is asked to pick a name");
  assert.equal((await call(score, "POST", { name: "You", prestige: 0, seasonP: 0, level: 1, points: 0 }, c)).body.error, "generic_name");
  clock += 61e3;
  const top = (await call(score, "GET", undefined, d, { mode: "all" })).body.top.map((r) => r.name);
  assert.ok(top.includes("Beju") && !top.includes("You"), "the farm still called You is off the board for now");
  await call(nameFn, "POST", { name: "Kenji" }, c); clock += 61e3;
  assert.ok((await call(score, "GET", undefined, d, { mode: "all" })).body.top.some((r) => r.name === "Kenji"), "picking a name puts the row back, renamed");
});

test("scores: the counter's rating and customers ride along, kept to what play allows, with a board of their own", async () => {
  const a = await newPlayer(), b = await newPlayer();
  const s = (pts, counter) => Object.assign({ name: "Farmer", prestige: 1, seasonP: 1, seasonKh: pts, level: G.levelFor(pts), points: pts, look: { crest: 0 } }, counter ? { counter } : {});
  process.env.GAME_WELCOME_UNTIL = "2099-01-01";   /* a new row may arrive at prestige 1 */
  assert.equal((await call(score, "POST", s(500, { rating: 3.2, served: 12 }), a)).status, 200);
  assert.equal((await call(score, "POST", s(500, { rating: 9, served: 9999 }), b)).status, 200, "impossible numbers are trimmed, never refused");
  let row = await store.get("scores/" + b.split(".")[0]);
  assert.equal(row.crate, 5); assert.equal(row.cserved, G.COUNTER_RULES.servedBurst);
  clock += 60000;
  assert.equal((await call(score, "POST", s(900, { rating: 1, served: 15 }), a)).status, 200);
  row = await store.get("scores/" + a.split(".")[0]);
  assert.equal(row.crate, 2.5, "the rating moves at most 0.75 a session (3.2 − 0.75, to one decimal)"); assert.equal(row.cserved, 15);
  assert.equal(row.look.crest, 0, "a crest below the prestige reached is kept: players pick any crest they've earned");
  assert.deepEqual([G.cleanLook({ crest: 9 }, 7).crest, G.cleanLook({}, 7).crest, G.cleanLook({ crest: 3 }, 7).crest], [7, 7, 3], "never above the prestige; the highest when none is sent");
  clock += 60000;
  assert.equal((await call(score, "POST", s(1200), a)).status, 200, "an older client without the counter");
  row = await store.get("scores/" + a.split(".")[0]);
  assert.equal(row.crate, 2.5); assert.equal(row.cserved, 15, "keeps what the row had");
  const board = await call(score, "GET", undefined, a, { mode: "counter" });
  assert.deepEqual(board.body.top.map((r) => r.cserved), [30, 15], "ranked by customers served this season");
  assert.equal(board.body.top[1].crate, 2.5); assert.equal(board.body.me.rank, 2);
  const season = await call(score, "GET", undefined, a, { mode: "season" });
  assert.ok(season.body.top.every((r) => typeof r.crate === "number"), "every board's rows carry the rating");
  assert.equal(G.cleanLook({ title: "ct:nbr" }, 0).title, "ct:nbr", "the Neighbourhood roaster title");
  assert.equal(G.cleanLook({ title: "kona:master" }, 0).title, "kona:master", "the Fermentation master title from Kona Ridge");
  assert.equal(G.cleanLook({ title: "kona:boss" }, 0).title, "", "no made-up Kona titles");
  assert.equal(G.cleanLook({ title: "ev:steady" }, 0).title, "ev:steady", "and the event titles");
});

test("scores: the welcome window is only for accounts made before the online game worked", async () => {
  process.env.GAME_WELCOME_UNTIL = "2026-11-30T23:59:59+09:00";
  const s = (p, sp, pts) => ({ name: "Farmer", prestige: p, seasonP: sp, seasonKh: pts, level: G.levelFor(pts), points: pts });
  const old = await newPlayer();   /* made on 17 October, before the online game worked */
  assert.equal((await call(score, "POST", s(5, 2, 2e6), old)).status, 200, "an old offline farm still joins with its progress");
  clock = Date.parse("2026-11-06T03:00:00Z");
  const fresh = await newPlayer();
  assert.equal((await call(score, "POST", s(30, 0, 9e9), fresh)).body.error, "too_far_for_a_new_player", "an account made in November can't post prestige 30 as its first score");
  assert.equal((await call(score, "POST", s(0, 0, 500), fresh)).status, 200, "it starts small like any new farm");
});

test("saves: malformed numbers are refused, and the copy replaced is kept hourly and daily", async () => {
  const a = await newPlayer(), id = a.split(".")[0];
  assert.equal((await call(save, "PUT", { base: 0, data: { coins: "lots" } }, a)).status, 400, "a number that isn't a number");
  assert.equal((await call(save, "PUT", { base: 0, data: { prestige: 1.5 } }, a)).status, 400, "a prestige that isn't whole");
  assert.equal((await call(save, "PUT", { base: 0, data: { farms: [] } }, a)).status, 400, "farms that aren't a map");
  assert.equal((await call(save, "PUT", { base: 0, data: { coins: 100, xp: 50, prestige: 1, farms: {} } }, a)).body.version, 1);
  clock += 10e3;
  assert.equal((await call(save, "PUT", { base: 1, data: { coins: 200 } }, a)).body.version, 2);
  assert.equal((await store.list("savehist/" + id + "/")).length, 0, "nothing kept within the first hour");
  clock += 3600e3;
  await call(save, "PUT", { base: 2, data: { coins: 300 } }, a);
  const hist = await store.list("savehist/" + id + "/");
  assert.equal(hist.length, 1, "an hour on, the copy being replaced is kept");
  assert.equal((await store.get(hist[0])).data.coins, 200);
  clock += 86400e3;
  await call(save, "PUT", { base: 3, data: { coins: 400 } }, a);
  const all = await store.list("savehist/" + id + "/");
  assert.ok(all.some((k) => /\/d\d$/.test(k)) && all.some((k) => /\/h\d$/.test(k)), "a day on, a daily copy too: " + all.join(", "));
  for (let i = 0; i < 6; i++) { clock += 3600e3; await call(save, "PUT", { base: 4 + i, data: { coins: 500 + i } }, a); }
  assert.ok((await store.list("savehist/" + id + "/")).filter((k) => /\/h\d$/.test(k)).length <= 3, "three hourly slots at most");
});

test("accounts: a player can delete their online farm, and every trace of it goes", async () => {
  const a = await newPlayer("Leaving Soon"), id = a.split(".")[0];
  await call(save, "PUT", { base: 0, data: { coins: 5 } }, a);
  await call(score, "POST", { name: "Leaving Soon", prestige: 0, seasonP: 0, level: 1, points: 0 }, a);
  const r = await account.handler({ httpMethod: "DELETE", headers: { authorization: "Bearer " + a } });
  assert.equal(r.statusCode, 200);
  for (const k of ["players/", "saves/", "scores/"]) assert.equal(await store.get(k + id), null, k + " is gone");
  assert.equal(await store.get("names/leavingsoon"), null, "the name is free again");
  assert.equal((await call(save, "GET", undefined, a)).status, 401, "the old token signs in to nothing");
  assert.equal((await account.handler({ httpMethod: "DELETE", headers: {} })).statusCode, 401, "deleting needs a sign-in");
});

test("admin: off without its key; find, flag, clamp, restore and delete with it", async () => {
  const admin = require("../lib/handlers/game-admin");
  Object.defineProperty(admin, "__deps", { get: deps, configurable: true });
  const ask = (body, key) => admin.handler({ httpMethod: "POST", headers: key ? { authorization: "Bearer " + key } : {}, body: JSON.stringify(body) }).then((r) => ({ status: r.statusCode, body: JSON.parse(r.body) }));
  delete process.env.ADMIN_KEY;
  assert.equal((await ask({ act: "flagged" }, "anything")).status, 403, "no ADMIN_KEY, no admin");
  process.env.ADMIN_KEY = "a-long-admin-key-for-tests";
  assert.equal((await ask({ act: "flagged" }, "wrong")).status, 403);
  const K = process.env.ADMIN_KEY, a = await newPlayer("Runaway Farm"), id = a.split(".")[0];
  assert.equal((await ask({ act: "find", name: "runaway farm" }, K)).body.id, id, "find by name");
  await call(score, "POST", { name: "Runaway Farm", prestige: 0, seasonP: 0, level: 1, points: 0, seasonKh: 0 }, a);
  const row = await store.get("scores/" + id); row.points = 9e9; row.seasonKh = 9e9; row.level = G.levelFor(9e9); await store.set("scores/" + id, row);
  const fl = (await ask({ act: "flagged" }, K)).body.rows;
  assert.ok(fl.some((x) => x.id === id), "a row that grew faster than play allows is flagged");
  const cl = (await ask({ act: "clamp", id, points: 5000, seasonKh: 5000 }, K)).body.row;
  assert.ok(cl.points === 5000 && cl.level === G.levelFor(5000), "clamping lowers the points and the level follows");
  assert.equal((await ask({ act: "clamp", id, points: 9e12 }, K)).body.row.points, 5000, "clamp never raises");
  await call(save, "PUT", { base: 0, data: { coins: 1 } }, a); clock += 3600e3 + 1;
  await call(save, "PUT", { base: 1, data: { coins: 2 } }, a);
  const got = (await ask({ act: "get", id }, K)).body;
  assert.ok(got.player && !got.player.tokenHash && got.copies.length === 1, "get shows the account without secrets, and its saved copies");
  const slot = got.copies[0].split("/").pop();
  assert.equal((await ask({ act: "restore", id, slot }, K)).body.version, 3, "restore puts the copy back as a new version");
  assert.equal((await call(save, "GET", undefined, a)).body.data.coins, 1);
  assert.equal((await ask({ act: "delete", id }, K)).body.deleted, true);
  assert.equal(await store.get("players/" + id), null);
  delete process.env.ADMIN_KEY;
});

test("stats: the key works from an Authorization header", async () => {
  const stats = require("../lib/handlers/game-stats");
  Object.defineProperty(stats, "__deps", { get: deps, configurable: true });
  process.env.STATS_KEY = "stats-key-for-tests";
  const go = (headers, q) => stats.handler({ httpMethod: "GET", headers, queryStringParameters: q || {} });
  assert.equal((await go({ authorization: "Bearer stats-key-for-tests" })).statusCode, 200);
  assert.equal((await go({}, { key: "stats-key-for-tests" })).statusCode, 200, "the query string still works");
  assert.equal((await go({ authorization: "Bearer nope" })).statusCode, 403);
  delete process.env.STATS_KEY;
});

test("scores: an accepted score updates the shared board in place, so other instances see it without a rebuild", async () => {
  const a = await newPlayer("Fresh Row"), b = await newPlayer("Second Row");
  await call(score, "POST", { name: "Fresh Row", prestige: 0, seasonP: 0, seasonKh: 100, seasonStars: 3, level: G.levelFor(100), points: 100 }, a);
  const built = (await store.get("board/rows")).built;
  clock += 20e3;
  await call(score, "POST", { name: "Second Row", prestige: 0, seasonP: 0, seasonKh: 50, seasonStars: 1, level: G.levelFor(50), points: 50 }, b);
  const snap = await store.get("board/rows");
  assert.equal(snap.built, built, "no rebuild between the two posts");
  assert.ok(snap.rows.some((r) => r.name === "Second Row"), "the second row went into the shared snapshot in place");
});

test("prestiges 8 to 10: crests, outfits and hats up to 10, each only once reached; the Field surveyor title passes", () => {
  const top = G.cleanLook({ crest: 10, skin: 10, hat: "p10", title: "ga:survey" }, 10);
  assert.deepEqual([top.crest, top.skin, top.hat, top.title], [10, 10, "p10", "ga:survey"]);
  assert.equal(G.cleanLook({ title: "sp:trade" }, 3).title, "sp:trade");   /* specialty titles */
  assert.equal(G.cleanLook({ title: "sp:hacker" }, 3).title, "");
  const early = G.cleanLook({ skin: 9, hat: "p9" }, 8);
  assert.deepEqual([early.crest, early.hat], [8, ""], "a hat from a prestige not yet reached is dropped");
  assert.equal(G.cleanLook({ hat: "p7" }, 7).hat, "p7");
  assert.equal(G.cleanLook({ hat: "p11" }, 10).hat, "", "no hat past 10");
  assert.deepEqual([G.cleanLook({ skin: 10 }, 3).skin, G.cleanLook({ skin: 8 }, 8).skin, G.cleanLook({ skin: 5 }, 1).skin], [0, 8, 5], "outfits 7 to 10 only from their prestige; the rest in any order");
});
