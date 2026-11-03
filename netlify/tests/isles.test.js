/* The newer islands' beacon events and what the stats make of them: how many players open each island, how many runs they
   play (a Réunion shift, a Bali storm) and the median score of a run. Run: npm test */
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

test("island events are accepted and summed per island: opened, runs and the median run score", async () => {
  store = G.memoryStore(); clock = Date.parse("2026-11-05T03:00:00Z");
  process.env.STATS_KEY = "k";
  const ev = (e, f) => Object.assign({ e, ts: clock, fid: "0123456789abcdef", sid: "abcd1234" }, f);
  const r = await call(beacon, "POST", { batch: [
    ev("isle_open", { key: "re", p: 6 }), ev("isle_run", { key: "re", m: 40, p: 6 }), ev("isle_run", { key: "re", m: 65, p: 6 }), ev("isle_run", { key: "re", m: 100, p: 6 }),
    ev("isle_open", { key: "ba", p: 6 }), ev("isle_run", { key: "ba", m: 131, p: 6 }), ev("isle_run", { key: "ba", m: 18, p: 6 })
  ] });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.n, 7);
  const s = await call(stats, "GET", undefined, { key: "k", days: 7 });
  assert.strictEqual(s.status, 200);
  assert.deepStrictEqual(s.body.isles, { re: { opened: 1, runs: 3, medianScore: 65 }, ba: { opened: 1, runs: 2, medianScore: 131 } });
  delete process.env.STATS_KEY;
});
