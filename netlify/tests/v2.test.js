/* The functions run in Netlify's current format (netlify/functions/*.mjs around netlify/lib/handlers) because Netlify Blobs only does
   strong consistency there. These tests reproduce the live failure with a stand-in Blobs server and check every wrapper end to end. */
const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const G = require("../lib/game");

const blobsServer = async () => {   /* answers every read with "not found" and remembers which address was asked */
  const seen = []; const srv = http.createServer((req, res) => { seen.push(req.headers.host + req.url); res.writeHead(404); res.end(); });
  await new Promise((r) => srv.listen(0, r)); return { srv, seen, url: "http://127.0.0.1:" + srv.address().port };
};
const withContext = async (ctx, fn) => { const was = process.env.NETLIFY_BLOBS_CONTEXT; process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify(ctx)).toString("base64"); try { return await fn(); } finally { if (was === undefined) delete process.env.NETLIFY_BLOBS_CONTEXT; else process.env.NETLIFY_BLOBS_CONTEXT = was; } };

test("Lambda compatibility mode can't do strong reads (the live 502)", async () => {
  const b = await blobsServer();
  try {
    const event = { headers: { "x-nf-site-id": "site", "x-nf-deploy-id": "deploy" }, blobs: Buffer.from(JSON.stringify({ url: b.url, token: "t" })).toString("base64") };
    await assert.rejects(() => G.stores(event).get("players/p_x"), (e) => e.name === "BlobsConsistencyError");
  } finally { b.srv.close(); delete process.env.NETLIFY_BLOBS_CONTEXT; }
});

test("with the context Netlify gives the current format, strong reads go to the uncached address", async () => {
  const cached = await blobsServer(), uncached = await blobsServer();
  try {
    await withContext({ siteID: "site", deployID: "deploy", token: "t", edgeURL: cached.url, uncachedEdgeURL: uncached.url }, async () => {
      assert.strictEqual(await G.stores({ headers: {} }).get("players/p_x"), null);
    });
    assert.strictEqual(uncached.seen.length, 1, "the read went to the uncached address"); assert.strictEqual(cached.seen.length, 0);
  } finally { cached.srv.close(); uncached.srv.close(); }
});

test("every game function has a wrapper in the current format, and it passes requests and answers through", async () => {
  const dir = path.join(__dirname, "../functions"), names = fs.readdirSync(path.join(__dirname, "../lib/handlers")).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
  assert.ok(names.length >= 14);
  for (const n of names) {
    assert.ok(fs.existsSync(path.join(dir, n + ".mjs")), n + ".mjs is missing");
    assert.ok(!fs.existsSync(path.join(dir, n + ".js")), n + ".js would clash with " + n + ".mjs");
    const mod = await import(path.join(dir, n + ".mjs"));
    assert.strictEqual(typeof mod.default, "function", n + " has no default export");
  }
  const store = G.memoryStore(), handler = require("../lib/handlers/game-account"), score = require("../lib/handlers/game-score");
  const deps = { get: () => ({ store, now: 1792800000000 }), configurable: true };
  Object.defineProperty(handler, "__deps", deps); Object.defineProperty(score, "__deps", deps);
  const acct = (await import(path.join(dir, "game-account.mjs"))).default, board = (await import(path.join(dir, "game-score.mjs"))).default;
  const made = await acct(new Request("https://bejucoffee.com/.netlify/functions/game-account", { method: "POST", body: JSON.stringify({ name: "Mika" }), headers: { "content-type": "application/json" } }), { ip: "203.0.113.9" });
  assert.strictEqual(made.status, 201); assert.match(made.headers.get("content-type"), /json/);
  const a = await made.json(); assert.match(a.player, /^p_/); assert.ok(a.token);
  const keys = await store.list("rl/acct/"); assert.strictEqual(keys.length, 1, "the new-farm limit counts the connection from context.ip");
  const auth = { authorization: "Bearer " + a.player + "." + a.token };
  const posted = await board(new Request("https://bejucoffee.com/.netlify/functions/game-score", { method: "POST", headers: auth, body: JSON.stringify({ name: "Mika", prestige: 0, seasonP: 0, level: 1, points: 0, look: {} }) }), {});
  assert.strictEqual(posted.status, 200);
  const got = await board(new Request("https://bejucoffee.com/.netlify/functions/game-score?mode=season", { headers: auth }), {});
  assert.strictEqual(got.status, 200); const g = await got.json();
  assert.strictEqual(g.players, 1); assert.strictEqual(g.top[0].name, "Mika");
});
