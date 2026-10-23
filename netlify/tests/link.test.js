/* Moving a farm to another device with a one-time code. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const account = require("../functions/game-account");
const save = require("../functions/game-save");
const link = require("../functions/game-link");

let store, clock;
const deps = () => ({ store, now: clock });
for (const f of [account, save, link]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
const newPlayer = async () => { const r = await call(account, "POST", { name: "Tester" }); return r.body.player + "." + r.body.token; };
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-17T03:00:00Z"); });

test("link: a code moves the farm to a new device, which gets a token of its own", async () => {
  const a = await newPlayer();
  assert.equal((await call(save, "PUT", { base: 0, data: { coins: 4321 } }, a)).status, 200);
  const made = await call(link, "POST", { act: "make" }, a);
  assert.equal(made.status, 200); assert.match(made.body.code, /^[A-Z2-9]{8}$/);
  const used = await call(link, "POST", { act: "use", code: made.body.code.toLowerCase().replace(/(....)/, "$1-") });
  assert.equal(used.status, 200, "codes are read without case or dashes"); assert.equal(used.body.player, a.split(".")[0]);
  const b = used.body.player + "." + used.body.token;
  assert.notEqual(b, a, "the new device has its own token");
  assert.equal((await call(save, "GET", undefined, b)).body.data.coins, 4321, "the new device loads the farm");
  assert.equal((await call(save, "GET", undefined, a)).status, 200, "the old device still works");
  assert.equal((await call(link, "POST", { act: "use", code: made.body.code })).body.error, "used", "a code works once");
  const rec = await store.get("players/" + a.split(".")[0]);
  assert.ok(!JSON.stringify(rec).includes(used.body.token), "only hashes are stored");
});

test("link: codes run out, need a sign-in to make, and come no faster than one in 10 s", async () => {
  const a = await newPlayer();
  assert.equal((await call(link, "POST", { act: "make" })).status, 401);
  const made = await call(link, "POST", { act: "make" }, a);
  assert.equal((await call(link, "POST", { act: "make" }, a)).status, 429);
  clock += 16 * 60e3;
  assert.equal((await call(link, "POST", { act: "use", code: made.body.code })).body.error, "no_code", "15 minutes and it's gone");
  assert.equal((await call(link, "POST", { act: "use", code: "ABC" })).status, 400);
  assert.equal((await call(link, "POST", { act: "use", code: "ABCDEFGH" })).status, 404);
});

test("link: a player keeps at most five extra devices, the oldest going first", async () => {
  const a = await newPlayer(), tokens = [];
  for (let i = 0; i < 6; i++) { clock += 11e3; const m = await call(link, "POST", { act: "make" }, a); const u = await call(link, "POST", { act: "use", code: m.body.code }); tokens.push(u.body.player + "." + u.body.token); }
  assert.equal((await call(save, "GET", undefined, tokens[0])).status, 401, "the oldest extra device is signed out");
  assert.equal((await call(save, "GET", undefined, tokens[5])).status, 200);
  assert.equal((await call(save, "GET", undefined, a)).status, 200, "the first device always keeps working");
});

test("accounts: one connection can start 20 farms an hour", async () => {
  const mk = () => account.handler({ httpMethod: "POST", body: "{}", headers: { "x-nf-client-connection-ip": "203.0.113.9" } });
  for (let i = 0; i < 20; i++) assert.equal((await mk()).statusCode, 201);
  assert.equal((await mk()).statusCode, 429);
  clock += 3600e3; assert.equal((await mk()).statusCode, 201, "a new hour, a new allowance");
  assert.ok(![...store._m.keys()].some((k) => k.includes("203.0.113.9")), "the address itself is never stored");
});
