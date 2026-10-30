/* Tests for the analytics beacon and its stats: whitelisted events, and real-bag cards read per coffee. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const beacon = require("../lib/handlers/game-beacon");
const stats = require("../lib/handlers/game-stats");

let store, clock;
for (const f of [beacon, stats]) Object.defineProperty(f, "__deps", { get: () => ({ store, now: clock }), configurable: true });
const call = async (fn, method, body, query) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: {}, queryStringParameters: query || {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
const fid = "0123456789abcdef", sid = "abcd1234";

test("real-bag cards and their clicks are counted per coffee; unknown events are dropped", async () => {
  store = G.memoryStore(); clock = Date.parse("2026-11-02T03:00:00Z");
  process.env.STATS_KEY = "k";
  const ev = (e, f) => Object.assign({ e, ts: clock, fid, sid }, f);
  const r = await call(beacon, "POST", { batch: [
    ev("bag_card", { key: "pinkwhiskey", p: 2 }), ev("bag_card", { key: "yirgacheffe", p: 3 }),
    ev("order_click", { t: "See the real bag", key: "pinkwhiskey" }), ev("order_click", { t: "Shop at bejucoffee.com" }),
    ev("not_an_event", { key: "x" })
  ] });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.n, 4);
  const s = await call(stats, "GET", undefined, { key: "k", days: 7 });
  assert.strictEqual(s.status, 200);
  assert.deepStrictEqual(s.body.bags, { pinkwhiskey: { cards: 1, clicks: 1 }, yirgacheffe: { cards: 1, clicks: 0 } });
  assert.strictEqual(s.body.funnel.order_click, 2);   /* the plain shop link still counts as an order click, just not against a bag */
  delete process.env.STATS_KEY;
});
