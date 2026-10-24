/* Tests for Beju Farm rewards: free samples, check-ins, order redemption and subscription cranes. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const G = require("../lib/game");
const account = require("../lib/handlers/game-account");
const score = require("../lib/handlers/game-score");
const samples = require("../lib/handlers/game-samples");
const checkin = require("../lib/handlers/game-checkin");
const grants = require("../lib/handlers/game-grants");
const claim = require("../lib/handlers/game-claim");
const checkout = require("../functions/create-checkout");
const webhook = require("../functions/stripe-webhook");

let store, clock, sent;
const fakeStripe = async (url, opts) => {   /* records what checkout sends; answers like Stripe */
  if (opts && opts.method === "POST") { sent = opts.body; return { ok: true, json: async () => ({ id: "cs_test_sample000001", url: "https://checkout.stripe.test/x" }) }; }
  if (url.includes("/line_items")) return { ok: true, json: async () => ({ data: [{ quantity: 2, description: "Casablanca", price: { product: { metadata: { pid: "casablanca" } } } }] }) };
  return { ok: true, json: async () => ({ id: "cs_test_subscribe0001", payment_status: "paid", amount_total: 6000, mode: "subscription", subscription: "sub_123" }) };
};
const deps = () => ({ store, now: clock, fetch: fakeStripe });
for (const f of [account, score, samples, checkin, grants, claim, checkout, webhook]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth, extra) => {
  const r = await fn.handler(Object.assign({ httpMethod: method, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: {} }, extra || {}));
  return { status: r.statusCode, body: (() => { try { return JSON.parse(r.body); } catch (e) { return r.body; } })() };
};
const newPlayer = async () => { const r = await call(account, "POST", { name: "Tester" }); return r.body.player + "." + r.body.token; };
const setScore = async (auth, prestige, level) => store.set("scores/" + auth.split(".")[0], { prestige, level, seasonP: 0, points: G.XP_AT(level), at: clock, season: G.seasonKey(clock) });
const signed = (evt) => { const raw = JSON.stringify(evt), t = Math.floor(Date.now() / 1000); return { body: raw, headers: { "stripe-signature": "t=" + t + ",v1=" + crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(t + "." + raw).digest("hex") } }; };
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-17T03:00:00Z"); sent = null; process.env.STRIPE_SECRET_KEY = "sk_test_x"; process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"; delete process.env.GAME_SAMPLES; delete process.env.ORDER_NOTIFY_URL; });

test("samples: earned from the server's own records, once each", async () => {
  const a = await newPlayer();
  assert.deepEqual((await call(samples, "POST", {}, a)).body.samples, [], "no leaderboard record yet, nothing earned");
  await setScore(a, 0, 3);
  assert.deepEqual((await call(samples, "POST", {}, a)).body.fresh, ["welcome"]);
  await setScore(a, 3, 5);
  assert.deepEqual((await call(samples, "POST", {}, a)).body.fresh, ["huila", "gedeo"]);
  const again = await call(samples, "POST", {}, a);
  assert.deepEqual(again.body.fresh, [], "no duplicates");
  assert.equal(again.body.samples.length, 3);
  clock += 61 * 864e5;
  assert.equal((await call(samples, "GET", undefined, a)).body.samples[0].status, "expired", "samples last 60 days");
});

test("check-ins: once a day, twenty in a month earn the monthly sample", async () => {
  const a = await newPlayer(); await setScore(a, 0, 1);
  assert.equal((await call(checkin, "POST", {}, a)).body.days, 1);
  assert.equal((await call(checkin, "POST", {}, a)).body.days, 1, "same day counts once");
  clock = Date.parse("2026-11-01T03:00:00Z");
  for (let d = 0; d < 20; d++) { await call(checkin, "POST", {}, a); clock += 864e5; }
  const r = await call(samples, "POST", {}, a);
  assert.ok(r.body.fresh.includes("month-2026-11"), JSON.stringify(r.body.fresh));
});

test("checkout: the sample switch is off by default and orders go ahead untouched", async () => {
  const a = await newPlayer(); await setScore(a, 0, 3); await call(samples, "POST", {}, a);
  const r = await call(checkout, "POST", { lang: "en", lines: [{ pid: "casablanca", grind: "Whole bean", freq: "once", qty: 1 }], farm: { auth: a, sample: "welcome" } });
  assert.equal(r.status, 200); assert.ok(!/farm_sample/.test(decodeURIComponent(sent)), "nothing added while GAME_SAMPLES is off");
});

test("checkout + webhook: a sample rides with a ¥3,000+ order, is reserved, then redeemed or released", async () => {
  process.env.GAME_SAMPLES = "on";
  const a = await newPlayer(), pid = a.split(".")[0]; await setScore(a, 0, 3); await call(samples, "POST", {}, a);
  const lines = (qty) => [{ pid: "casablanca", grind: "Whole bean", freq: "once", qty }];
  const price = G.SAMPLE_RULES.minOrder, cat = require("../lib/catalog.json").products.casablanca.price;
  const small = Math.max(1, Math.floor((price - 1) / cat));
  if (small * cat < price) { await call(checkout, "POST", { lang: "en", lines: lines(small), farm: { auth: a, sample: "welcome" } }); assert.ok(!/farm_sample/.test(decodeURIComponent(sent)), "below the minimum order, no sample"); }
  await call(checkout, "POST", { lang: "en", lines: lines(2), farm: { auth: a, sample: "welcome" } });
  const body = decodeURIComponent(sent);
  assert.ok(body.includes("metadata[farm_sample]=welcome") && body.includes("custom_text[submit][message]"), "sample noted on the order and shown at checkout");
  let p = await store.get("players/" + pid); assert.equal(p.samples[0].status, "reserved");
  const session = { id: "cs_test_sample000001", payment_status: "paid", amount_total: 2 * cat, metadata: { farm_player: pid, farm_sample: "welcome", farm_coffee: "Casablanca Blend", order: "x" } };
  assert.equal((await call(webhook, "POST", undefined, null, signed({ type: "checkout.session.expired", data: { object: session } }))).status, 200);
  p = await store.get("players/" + pid); assert.equal(p.samples[0].status, "earned", "abandoned checkout releases it");
  await call(checkout, "POST", { lang: "en", lines: lines(2), farm: { auth: a, sample: "welcome" } });
  assert.equal((await call(webhook, "POST", undefined, null, signed({ type: "checkout.session.completed", data: { object: session } }))).status, 200);
  p = await store.get("players/" + pid); assert.equal(p.samples[0].status, "redeemed");
  await call(checkout, "POST", { lang: "en", lines: lines(2), farm: { auth: a, sample: "welcome" } });
  assert.ok(!/farm_sample/.test(decodeURIComponent(sent)), "a redeemed sample can't ride again");
  assert.equal((await call(checkout, "POST", { lang: "en", lines: lines(1), farm: { auth: "p_nobody00.notarealtokenatall12345", sample: "welcome" } })).status, 200, "a bad farm token never blocks a purchase");
});

test("subscriptions: renewals of a claimed subscription pay cranes once each", async () => {
  const a = await newPlayer();
  assert.equal((await call(claim, "POST", { session_id: "cs_test_subscribe0001" }, a)).status, 200);
  const inv = { id: "in_001", billing_reason: "subscription_cycle", subscription: "sub_123", amount_paid: 3300 };
  await call(webhook, "POST", undefined, null, signed({ type: "invoice.paid", data: { object: inv } }));
  await call(webhook, "POST", undefined, null, signed({ type: "invoice.paid", data: { object: inv } }));
  const g = await call(grants, "POST", {}, a);
  assert.deepEqual(g.body.grants.map((x) => x.cranes), [43], "one grant per invoice: 33, plus 10 for subscribers (the claimed order was this month's first)");
  assert.deepEqual((await call(grants, "POST", {}, a)).body.grants, [], "handed over once");
  await call(webhook, "POST", undefined, null, signed({ type: "invoice.paid", data: { object: { id: "in_002", billing_reason: "subscription_create", subscription: "sub_123", amount_paid: 3300 } } }));
  assert.deepEqual((await call(grants, "POST", {}, a)).body.grants, [], "the first payment is the claimed order, not a renewal");
});

test("subscriptions: renewals still pay when Stripe puts the subscription under invoice.parent (newer API versions)", async () => {
  const a = await newPlayer();
  assert.equal((await call(claim, "POST", { session_id: "cs_test_subscribe0001" }, a)).status, 200);
  const inv = { id: "in_101", billing_reason: "subscription_cycle", parent: { type: "subscription_details", subscription_details: { subscription: "sub_123" } }, amount_paid: 3300 };
  await call(webhook, "POST", undefined, null, signed({ type: "invoice.paid", data: { object: inv } }));
  assert.deepEqual((await call(grants, "POST", {}, a)).body.grants.map((x) => x.cranes), [43]);
});

test("claims: two requests for one order at once pay it once", async () => {
  const a = await newPlayer();
  const [r1, r2] = await Promise.all([call(claim, "POST", { session_id: "cs_test_subscribe0001" }, a), call(claim, "POST", { session_id: "cs_test_subscribe0001" }, a)]);
  assert.equal([r1, r2].filter((r) => r.status === 200 && !r.body.again).length, 1, "only one of them is the real claim");
  const p = await store.get("players/" + a.split(".")[0]);
  assert.equal(p.grants.length, 1, "the order is on the player once"); assert.equal(p.gifts.length, 1, "and brings one gift");
});
