/* Tests for showing off and coffee rewards: trophies, pinned trophies, Founding farmer, farm visits, gifts and the monthly order bonus. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const account = require("../functions/game-account");
const score = require("../functions/game-score");
const claim = require("../functions/game-claim");
const visit = require("../functions/game-visit");
const gift = require("../functions/game-gift");
const grants = require("../functions/game-grants");

let store, clock, order;
const fakeStripe = async (url) => ({ ok: true, json: async () => (url.includes("/line_items")
  ? { data: [{ quantity: 1, price: { product: { metadata: { pid: "casablanca" } } } }, { quantity: 1, price: { product: { metadata: { pid: "yirgacheffe" } } } }] }
  : Object.assign({ id: "cs_test_x", payment_status: "paid", amount_total: 3000 }, order)) });
const deps = () => ({ store, now: clock, fetch: fakeStripe });
for (const f of [account, score, claim, visit, gift, grants]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth, query) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: query || {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
const newPlayer = async () => { const r = await call(account, "POST", { name: "Tester" }); return r.body.player + "." + r.body.token; };
const row = (look) => ({ name: "Farmer", prestige: 0, seasonP: 0, seasonKh: 500, level: G.levelFor(500), points: 500, look: look || {} });
const farm = { loc: "mogiana", farms: { mogiana: { u: 1, b: [1], f: false, s: "", e: 0, h: 0, beds: [] } }, store: 1, decor: ["shelf", "gift"], fx: ["hanabi", "fireflies"] };
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-17T03:00:00Z"); order = {}; process.env.STRIPE_SECRET_KEY = "sk_test_x"; });

test("founders: launch-season farmers get the trophy and may wear the charm; later farmers can't", async () => {
  const a = await newPlayer();
  assert.equal((await call(score, "POST", row({ charm: "founder", pin: "founder:2026-10" }), a)).status, 200);
  const me = (await call(score, "GET", undefined, a, { mode: "season" })).body.me;
  assert.equal(me.look.charm, "founder");
  assert.deepEqual(me.trophies.map((t) => t.id), ["founder:2026-10"]);
  assert.equal(me.pin.k, "founder", "the pinned trophy travels with the row");
  clock = Date.parse("2027-01-10T03:00:00Z");
  const b = await newPlayer();
  assert.equal((await call(score, "POST", row({ charm: "founder", pin: "founder:2027-01" }), b)).status, 200);
  const late = (await call(score, "GET", undefined, b, { mode: "season" })).body.me;
  assert.equal(late.look.charm, "", "no charm after the launch season");
  assert.equal(late.look.pin, "", "can't pin a trophy you don't hold");
  assert.deepEqual(late.trophies, []);
});

test("trophies: a top 10 season finish is recorded once and shown on the row", async () => {
  const a = await newPlayer();
  assert.equal((await call(score, "POST", row(), a)).status, 200);
  clock = Date.parse("2026-11-02T03:00:00Z");
  assert.equal((await call(score, "GET", undefined, a, { mode: "final", season: "2026-10" })).body.me.rank, 1);
  await call(score, "GET", undefined, a, { mode: "final", season: "2026-10" });
  const rec = await store.get("players/" + a.split(".")[0]);
  assert.deepEqual(rec.trophies.map((t) => t.id).sort(), ["founder:2026-10", "rookie:2026-10", "season:2026-10"], "once each, rookies too");
  assert.equal((await store.get("scores/" + a.split(".")[0])).trophies[0].k, "season", "the grandest trophy comes first");
  assert.ok(G.trophyRank({ k: "coe", r: 1 }) < G.trophyRank({ k: "season", r: 1 }) && G.trophyRank({ k: "harvest" }) < G.trophyRank({ k: "founder" }));
});

test("visits: trophies and origin sacks come from the server; subscriber and gift pieces are checked", async () => {
  const a = await newPlayer();
  await call(score, "POST", row(), a);
  const put = await call(visit, "PUT", { farm }, a);
  let seen = (await call(visit, "GET", undefined, undefined, { code: put.body.code })).body;
  assert.deepEqual(seen.trophies.map((t) => t.k), ["founder"]);
  assert.deepEqual(seen.sacks, [], "no orders, no sacks");
  assert.deepEqual(seen.farm.fx, ["fireflies"], "fireworks need a subscription");
  assert.deepEqual(seen.farm.decor, ["shelf"], "the furoshiki needs an opened gift");
  order = { mode: "subscription", subscription: "sub_9" };
  assert.equal((await call(claim, "POST", { session_id: "cs_test_subscription1" }, a)).body.sub, true);
  clock += 60e3;
  await call(visit, "PUT", { farm }, a);
  seen = (await call(visit, "GET", undefined, undefined, { code: put.body.code })).body;
  assert.deepEqual(seen.sacks, ["mogiana", "gedeo"], "each coffee stamps its first new origin");
  assert.deepEqual(seen.farm.fx, ["hanabi", "fireflies"]);
});

test("orders: the first of each month pays 30 more", async () => {
  const a = await newPlayer();
  assert.equal((await call(claim, "POST", { session_id: "cs_test_firstorder01" }, a)).body.cranes, 60);
  clock += 864e5;
  const second = (await call(claim, "POST", { session_id: "cs_test_secondorder1" }, a)).body;
  assert.equal(second.cranes, 30); assert.equal(second.bonus, 0);
  clock = Date.parse("2026-11-01T00:30:00Z");   /* 09:30 on 1 November in Japan */
  assert.equal((await call(claim, "POST", { session_id: "cs_test_novemberord1" }, a)).body.bonus, 30, "months follow Japan time");
});

test("gifts: one per order, opened once by a friend, who gets the furoshiki while the sender gets 10 cranes", async () => {
  const a = await newPlayer(), b = await newPlayer(), c = await newPlayer();
  await call(score, "POST", row(), a);
  const code = (await call(claim, "POST", { session_id: "cs_test_giftorder001" }, a)).body.gift;
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.equal((await call(gift, "POST", { code }, a)).status, 422, "not your own");
  assert.equal((await call(gift, "POST", { code: "ZZZZZZ" }, b)).status, 404);
  const open = await call(gift, "POST", { code: code.toLowerCase() }, b);
  assert.equal(open.status, 200); assert.equal(open.body.from, "Farmer");
  assert.equal((await call(gift, "POST", { code }, c)).status, 409, "opened already");
  assert.deepEqual((await call(grants, "POST", {}, a)).body.grants.map((g) => [g.reason, g.cranes]), [["gift", 10]]);
  assert.deepEqual((await call(gift, "GET", undefined, a)).body.gifts, [{ code, order: "order001", opened: true }]);
  assert.equal((await call(gift, "GET", undefined, b)).body.from, "Farmer");
  const code2 = (await call(claim, "POST", { session_id: "cs_test_giftorder002" }, a)).body.gift;
  assert.equal((await call(gift, "POST", { code: code2 }, b)).status, 422, "one gift each");
  const firstOrder = (await store.get("players/" + a.split(".")[0])).grants.length;
  assert.equal(firstOrder, 2, "an opened gift doesn't count as an order");
});
