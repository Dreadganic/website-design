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
  assert.equal((await call(score, "POST", s(1, 1, 0), a)).body.error, "prestige_without_level");
  assert.equal((await call(nameFn, "POST", { name: "www.spam.com" }, a)).body.error, "bad_name");
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
  clock += 16e3;   /* a row written by another function instance shows once this one's row cache is 15 s old */
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
  clock += 16e3;
  const top = (await call(score, "GET", undefined, d, { mode: "all" })).body.top.map((r) => r.name);
  assert.ok(top.includes("Beju") && !top.includes("You"), "the farm still called You is off the board for now");
  await call(nameFn, "POST", { name: "Kenji" }, c); clock += 16e3;
  assert.ok((await call(score, "GET", undefined, d, { mode: "all" })).body.top.some((r) => r.name === "Kenji"), "picking a name puts the row back, renamed");
});
