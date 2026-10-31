/* Blue Mountain's beacon events and what the stats make of them: how often players come back, and whether waiting for a
   clearing stays a real choice. Run: npm test */
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

test("Blue Mountain events are accepted and summed: visits, the share of clean picks, trays and barrels", async () => {
  store = G.memoryStore(); clock = Date.parse("2026-11-05T03:00:00Z");
  process.env.STATS_KEY = "k";
  const ev = (e, f) => Object.assign({ e, ts: clock, fid: "0123456789abcdef", sid: "abcd1234" }, f);
  const r = await call(beacon, "POST", { batch: [
    ev("bm_open", { p: 5, lvl: 3 }), ev("bm_visit", { min: 0 }), ev("bm_visit", { min: 600 }), ev("bm_visit", { min: 840 }),
    ev("bm_pick", { m: 12, out: 1 }), ev("bm_pick", { m: 6, out: 3 }), ev("bm_grade", { m: 6, served: 6, out: 0 }),
    ev("bm_ship", { key: "n1" }), ev("bm_ship", { key: "n1" }), ev("bm_ship", { key: "sel" })
  ] });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.n, 10);
  const s = await call(stats, "GET", undefined, { key: "k", days: 7 });
  assert.strictEqual(s.status, 200);
  assert.deepStrictEqual(s.body.bm, { opened: 1, visits: 3, medianGapMin: 840, cleanShare: 81.8, trays: 1, ships: { n1: 2, sel: 1 } });
  delete process.env.STATS_KEY;
});
