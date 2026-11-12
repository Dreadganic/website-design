/* Tests for made-to-order merchandise through Printful: checkout carries the option, the paid-order webhook sends one Printful order,
   and the shipment webhook passes tracking on. No network: Stripe, Printful and the notice address are all stand-ins. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const G = require("../lib/game");
const P = require("../lib/printful");
const { checkCart, sessionParams, CATALOG } = require("../lib/order");
const checkout = require("../lib/handlers/create-checkout");
const webhook = require("../lib/handlers/stripe-webhook");
const shipped = require("../lib/handlers/printful-webhook");

/* a catalogue with merchandise in it; the live catalog.json has none yet */
const catalog = JSON.parse(JSON.stringify(CATALOG));
catalog.products.tee = { name: "Beju Tee", jp: "ベージュ Tシャツ", price: 4200, fulfil: { by: "printful", variants: { M: 14036, L: { variant_id: 14037, files: [{ type: "front", url: "https://example.test/art-large.png" }] } }, files: [{ type: "front", url: "https://example.test/art.png" }] } };
catalog.products.mug = { name: "Beju Mug", jp: "ベージュ マグ", price: 2400, fulfil: { by: "printful", variants: { "11 oz": 1320 }, files: [{ url: "https://example.test/mug.png" }] } };

const NOTIFY = "https://notify.test/form";
const SESSION = "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0";
let store, calls, lineItems, pf, sentCheckout;
const li = (pid, quantity, extra) => ({ quantity, description: pid, price: { product: { description: "", metadata: Object.assign({ pid }, extra || {}) } } });
const answer = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const fakeFetch = async (url, opts) => {
  calls.push({ url, method: (opts && opts.method) || "GET", headers: (opts && opts.headers) || {}, body: opts && opts.body });
  if (url.startsWith("https://api.stripe.com/")) {
    if (opts.method === "POST") { sentCheckout = decodeURIComponent(opts.body); return answer(200, { id: SESSION, url: "https://checkout.stripe.test/x" }); }
    return answer(200, { data: lineItems });
  }
  if (url.startsWith("https://api.printful.com/")) return pf(url, opts);
  if (url === NOTIFY) return answer(200, {});
  throw new Error("unexpected request to " + url);
};
const deps = () => ({ store, fetch: fakeFetch, catalog, now: Date.parse("2026-11-12T03:00:00Z") });
for (const f of [checkout, webhook, shipped]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });

const toPrintful = () => calls.filter((c) => c.url.startsWith("https://api.printful.com/"));
const notices = () => calls.filter((c) => c.url === NOTIFY).map((c) => JSON.parse(c.body));
const session = (over) => Object.assign({
  id: SESSION, mode: "payment", payment_status: "paid", amount_total: 7800, metadata: { lang: "ja" },
  customer_details: { name: "Hanako Yamada", email: "hanako@example.test", phone: "+819012345678" },
  shipping_details: { name: "山田 花子", address: { line1: "1-2-3 Umeda", line2: "Room 405", city: "Osaka-shi Kita-ku", state: "大阪府", postal_code: "530-0001", country: "JP" } }
}, over || {});
const paid = async (s) => {
  const raw = JSON.stringify({ type: "checkout.session.completed", data: { object: s || session() } }), t = Math.floor(Date.now() / 1000);
  const r = await webhook.handler({ httpMethod: "POST", body: raw, headers: { "stripe-signature": "t=" + t + ",v1=" + crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(t + "." + raw).digest("hex") } });
  return r.statusCode;
};
const shipEvent = (over) => Object.assign({ type: "package_shipped", created: 1794000000, retries: 0, store: 12, data: {
  shipment: { id: 9001, carrier: "YAMATO", service: "Yamato Takkyubin", tracking_number: 123456789012, tracking_url: "https://track.example.test/123456789012", created: 1794000000, ship_date: "2026-11-15", shipped_at: 1794000000, reshipment: false, items: [{ item_id: 1, quantity: 1, picked: 1, printed: 1 }] },
  order: { id: 555, external_id: P.externalId(SESSION), status: "fulfilled", recipient: { name: "山田 花子", email: "hanako@example.test" } } } }, over || {});
const ship = async (key, evt, method) => {
  const r = await shipped.handler({ httpMethod: method || "POST", headers: {}, queryStringParameters: key === undefined ? {} : { key }, body: JSON.stringify(evt || shipEvent()) });
  return r.statusCode;
};
const quiet = async (fn) => { const was = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = was; } };

test.beforeEach(() => {
  store = G.memoryStore(); calls = []; sentCheckout = null;
  lineItems = [li("tee", 2, { option: "M" })];
  pf = async (url, opts) => answer(200, { code: 200, result: { id: 555, external_id: JSON.parse(opts.body).external_id, status: /confirm=true/.test(url) ? "pending" : "draft" } });
  process.env.STRIPE_SECRET_KEY = "sk_test_x"; process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"; process.env.ORDER_NOTIFY_URL = NOTIFY;
  process.env.PRINTFUL_API_KEY = "pf_test_key"; process.env.PRINTFUL_WEBHOOK_SECRET = "hook-secret-1234567890";
  delete process.env.PRINTFUL_CONFIRM; delete process.env.PRINTFUL_STORE_ID;
});
test.after(() => { for (const k of ["PRINTFUL_API_KEY", "PRINTFUL_WEBHOOK_SECRET", "PRINTFUL_CONFIRM", "PRINTFUL_STORE_ID", "ORDER_NOTIFY_URL"]) delete process.env[k]; });

test("the live catalogue has no merchandise yet", () => {
  assert.deepEqual(Object.keys(CATALOG.products).filter((k) => CATALOG.products[k].fulfil), []);
});

test("dormant: with no PRINTFUL_API_KEY a paid merchandise order calls nothing new and the notice is unchanged", async () => {
  delete process.env.PRINTFUL_API_KEY;
  assert.equal(await paid(), 200);
  assert.equal(toPrintful().length, 0, "no call to Printful");
  assert.deepEqual(await store.list("printful/"), [], "nothing recorded");
  const n = notices(); assert.equal(n.length, 1); assert.ok(!("merchandise" in n[0])); assert.equal(n[0]._subject, "New Beju order " + SESSION.slice(-8));
  assert.equal(await P.sendMerch(session(), lineItems, { env: {}, fetch: fakeFetch, catalog, store: () => store }), null);
  assert.equal(await ship("hook-secret-1234567890"), 403, "the shipment webhook is off too");
  assert.equal(notices().length, 1);
});

test("a coffee-only order makes no call to Printful", async () => {
  lineItems = [li("casablanca", 2, { grind: "Whole bean" }), { quantity: 1, description: "Delivery", price: { product: { metadata: {} } } }];
  assert.equal(await paid(), 200);
  assert.equal(toPrintful().length, 0);
  assert.deepEqual(await store.list("printful/"), []);
  const n = notices(); assert.equal(n.length, 1); assert.ok(!("merchandise" in n[0]));
});

test("a merchandise order builds one draft Printful order: variant, quantity, recipient, external_id", async () => {
  assert.equal(await paid(), 200);
  const sent = toPrintful(); assert.equal(sent.length, 1);
  assert.equal(sent[0].method, "POST"); assert.equal(sent[0].url, "https://api.printful.com/orders", "no confirm parameter: a draft");
  assert.equal(sent[0].headers.Authorization, "Bearer pf_test_key"); assert.ok(!("X-PF-Store-Id" in sent[0].headers));
  const body = JSON.parse(sent[0].body), ext = P.externalId(SESSION);
  assert.match(ext, /^[a-f0-9]{32}$/, "fits Printful's 32-character limit"); assert.equal(body.external_id, ext);
  assert.deepEqual(body.items, [{ variant_id: 14036, quantity: 2, name: "Beju Tee (M)", files: [{ type: "front", url: "https://example.test/art.png" }] }]);
  assert.deepEqual(body.recipient, { name: "山田 花子", address1: "1-2-3 Umeda", address2: "Room 405", city: "Osaka-shi Kita-ku", state_code: "27", country_code: "JP", zip: "530-0001", phone: "+819012345678", email: "hanako@example.test" });
  const rec = await store.get("printful/orders/" + ext);
  assert.equal(rec.status, "created"); assert.equal(rec.printful, 555); assert.equal(rec.session, SESSION); assert.ok(!JSON.stringify(rec).includes("Umeda"), "the record keeps no address");
  const n = notices(); assert.equal(n.length, 1); assert.match(n[0].merchandise, /Printful order 555 \(draft\).*Confirm it in Printful/); assert.equal(n[0]._subject, "New Beju order " + SESSION.slice(-8));
});

test("PRINTFUL_CONFIRM=on submits the order, and a store id is passed when set; any other value stays a draft", async () => {
  process.env.PRINTFUL_CONFIRM = "on"; process.env.PRINTFUL_STORE_ID = "4242";
  assert.equal(await paid(), 200);
  assert.equal(toPrintful()[0].url, "https://api.printful.com/orders?confirm=true"); assert.equal(toPrintful()[0].headers["X-PF-Store-Id"], "4242");
  assert.match(notices()[0].merchandise, /Printful order 555 \(pending\)$/);
  store = G.memoryStore(); calls = []; process.env.PRINTFUL_CONFIRM = "true";
  assert.equal(await paid(), 200);
  assert.equal(toPrintful()[0].url, "https://api.printful.com/orders");
});

test("coffee and merchandise together: only the merchandise goes to Printful, and the coffee notice is whole", async () => {
  lineItems = [li("casablanca", 1, { grind: "Espresso" }), li("tee", 1, { option: "L" }), li("mug", 3)];
  assert.equal(await paid(), 200);
  const sent = toPrintful(); assert.equal(sent.length, 1);
  assert.deepEqual(JSON.parse(sent[0].body).items, [
    { variant_id: 14037, quantity: 1, name: "Beju Tee (L)", files: [{ type: "front", url: "https://example.test/art-large.png" }] },
    { variant_id: 1320, quantity: 3, name: "Beju Mug", files: [{ url: "https://example.test/mug.png" }] }]);
  const n = notices(); assert.equal(n.length, 1); assert.equal(n[0].items.split("\n").length, 3, "all three lines are on the owner's notice"); assert.match(n[0].ship_to, /Umeda/);
});

test("a retried webhook orders once: the record stops a second call", async () => {
  assert.equal(await paid(), 200); assert.equal(await paid(), 200);
  assert.equal(toPrintful().length, 1);
  assert.match(notices()[1].merchandise, /Printful order 555/);
});

test("a retry Printful has already seen (external_id in use) counts as done, not as a failure", async () => {
  pf = async (url, opts) => opts.method === "POST"
    ? answer(400, { code: 400, result: "external_id already exists", error: { reason: "BadRequest", message: "external_id already exists" } })
    : answer(200, { code: 200, result: { id: 777, external_id: P.externalId(SESSION), status: "draft" } });
  assert.equal(await paid(), 200);
  const sent = toPrintful(); assert.deepEqual(sent.map((c) => c.method), ["POST", "GET"]); assert.equal(sent[1].url, "https://api.printful.com/orders/@" + P.externalId(SESSION));
  assert.match(notices()[0].merchandise, /Printful order 777/); assert.ok(!/NOT SENT/.test(notices()[0]._subject));
  assert.equal((await store.get("printful/orders/" + P.externalId(SESSION))).status, "created");
});

test("a Printful failure never fails the Stripe webhook: it is recorded, the owner is told, and a resend tries again", async () => {
  pf = async (url, opts) => opts.method === "POST" ? answer(400, { code: 400, result: "Invalid address", error: { reason: "BadRequest", message: "Invalid address" } }) : answer(404, { code: 404, result: "Not Found", error: { reason: "NotFound", message: "Not Found" } });
  lineItems = [li("casablanca", 1, { grind: "Espresso" }), li("tee", 1, { option: "M" })];
  assert.equal(await quiet(() => paid()), 200, "Stripe still gets a 200");
  let n = notices(); assert.equal(n.length, 1);
  assert.match(n[0]._subject, /MERCHANDISE NOT SENT TO PRINTFUL$/); assert.match(n[0].merchandise, /NOT SENT TO PRINTFUL: Invalid address/); assert.match(n[0].items, /casablanca/, "the coffee order is still on the notice");
  const rec = await store.get("printful/orders/" + P.externalId(SESSION)); assert.equal(rec.status, "failed"); assert.equal(rec.error, "Invalid address");
  /* Printful down altogether, or no answer in time */
  for (const boom of [async () => answer(503, null), async () => { throw Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }); }]) {
    pf = boom; calls = [];
    assert.equal(await quiet(() => paid()), 200);
    assert.equal(toPrintful().length, 1, "no lookup after an outage or a timeout");
    assert.match(notices()[0]._subject, /NOT SENT/);
  }
  /* the owner resends the event from Stripe once Printful is back */
  pf = async (url, opts) => answer(200, { code: 200, result: { id: 556, status: "draft" } }); calls = [];
  assert.equal(await paid(), 200);
  assert.equal((await store.get("printful/orders/" + P.externalId(SESSION))).status, "created"); assert.ok(!/NOT SENT/.test(notices()[0]._subject));
});

test("a line the catalogue can't match to a variant sends nothing and says so; broken storage doesn't stop an order", async () => {
  lineItems = [li("tee", 1, { option: "XXS" })];
  assert.equal(await quiet(() => paid()), 200);
  assert.equal(toPrintful().length, 0); assert.match(notices()[0].merchandise, /NOT SENT TO PRINTFUL: tee \(XXS\)/);
  lineItems = [li("tee", 1, { option: "M" })]; calls = [];
  const broken = { get: async () => { throw new Error("blobs down"); }, set: async () => { throw new Error("blobs down"); } };
  const r = await quiet(() => P.sendMerch(session(), lineItems, { env: process.env, fetch: fakeFetch, catalog, store: () => broken }));
  assert.equal(r.ok, true); assert.equal(toPrintful().length, 1);
});

test("prefectures become Printful's state codes, however Stripe writes them", () => {
  for (const [given, code] of [["大阪府", "27"], ["大阪", "27"], ["Osaka", "27"], ["Ōsaka", "27"], ["Osaka-fu", "27"], ["Kyoto", "26"], ["京都", "26"], ["京都府", "26"], ["東京都", "13"], ["Tokyo-to", "13"], ["Hokkaido", "01"], ["北海道", "01"], ["JP-47", "47"], ["13", "13"], ["Hyōgo Prefecture", "28"]]) assert.equal(P.jpStateCode(given), code, given);
  assert.equal(P.jpStateCode("Atlantis"), null); assert.equal(P.jpStateCode(""), null);
  const o = P.buildOrder(session({ shipping_details: { name: "A", address: { line1: "x", state: "Atlantis", postal_code: "1", country: "JP" } } }), []);
  assert.equal(o.recipient.state_name, "Atlantis"); assert.ok(!("state_code" in o.recipient), "an unknown prefecture is passed as written, without a code");
});

test("checkout: a merchandise line carries its option into the Stripe line metadata, and coffee lines are as before", async () => {
  const coffee = { pid: "casablanca", grind: "Whole bean", freq: "once", qty: 1 };
  assert.deepEqual(sessionParams(checkCart([coffee], catalog), { lang: "en", site: "https://x.test" }), sessionParams(checkCart([coffee]), { lang: "en", site: "https://x.test" }), "coffee is untouched by the merchandise catalogue");
  assert.equal(checkCart([{ pid: "tee", grind: "Whole bean", freq: "once", qty: 1 }]).error, "unknown_product", "not for sale from the live catalogue");
  assert.equal(checkCart([{ pid: "tee", freq: "once", qty: 1 }], catalog).error, "bad_option", "a size is needed");
  assert.equal(checkCart([{ pid: "tee", option: "XXS", freq: "once", qty: 1 }], catalog).error, "bad_option");
  assert.equal(checkCart([{ pid: "tee", option: "M", freq: "1m", qty: 1 }], catalog).error, "bad_freq", "no merchandise subscriptions");
  const cart = checkCart([coffee, { pid: "tee", option: "M", freq: "once", qty: 2 }, { pid: "mug", freq: "once", qty: 1 }], catalog);
  assert.equal(cart.subtotalOnce, 3000 + 2 * 4200 + 2400);
  const p = sessionParams(cart, { lang: "ja", site: "https://x.test" });
  assert.deepEqual(p.line_items[1], { price_data: { currency: "jpy", unit_amount: 4200, product_data: { name: "ベージュ Tシャツ", description: "サイズ: M", metadata: { pid: "tee", option: "M" } } }, quantity: 2 });
  assert.deepEqual(p.line_items[2].price_data.product_data.metadata, { pid: "mug", option: "11 oz" }, "a single-variant product needs no choice");
  const r = await checkout.handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({ lang: "en", lines: [{ pid: "tee", option: "L", freq: "once", qty: 1 }] }) });
  assert.equal(r.statusCode, 200); assert.ok(sentCheckout.includes("[metadata][option]=L") && sentCheckout.includes("[metadata][pid]=tee"), sentCheckout);
});

test("shipment webhook: a missing or wrong secret is refused and nothing is passed on", async () => {
  assert.equal(await ship(undefined), 403); assert.equal(await ship(""), 403); assert.equal(await ship("wrong"), 403);
  delete process.env.PRINTFUL_WEBHOOK_SECRET;
  assert.equal(await ship(""), 403, "no secret configured: refused, never open"); assert.equal(await ship("undefined"), 403);
  assert.equal(calls.length, 0); assert.deepEqual(await store.list("printful/"), []);
});

test("shipment webhook: the right secret records the tracking details and tells the owner, once", async () => {
  await paid(); calls = [];
  const key = "hook-secret-1234567890";
  assert.equal(await ship(key), 200);
  const n = notices(); assert.equal(n.length, 1);
  assert.equal(n[0]._subject, "Beju merchandise shipped " + SESSION.slice(-8)); assert.equal(n[0].order, SESSION); assert.equal(n[0].printful_order, "555");
  assert.equal(n[0].tracking_number, "123456789012"); assert.equal(n[0].tracking_url, "https://track.example.test/123456789012"); assert.equal(n[0].carrier, "YAMATO Yamato Takkyubin"); assert.equal(n[0].email, "hanako@example.test");
  const rec = await store.get("printful/orders/" + P.externalId(SESSION));
  assert.equal(rec.status, "created"); assert.equal(rec.shipments.length, 1); assert.equal(rec.shipments[0].tracking_number, "123456789012");
  assert.equal(await ship(key), 200); assert.equal(notices().length, 1, "Printful retrying the same shipment is not passed on twice");
  const second = shipEvent(); second.data.shipment.id = 9002;
  assert.equal(await ship(key, second), 200); assert.equal(notices().length, 2, "a second parcel is"); assert.equal((await store.get("printful/orders/" + P.externalId(SESSION))).shipments.length, 2);
  assert.equal(await ship(key, { type: "order_updated", data: {} }), 200); assert.equal(notices().length, 2, "other events are ignored");
  assert.equal(await ship(key, undefined, "GET"), 405);
  calls = []; assert.equal(toPrintful().length, 0, "the shipment webhook never calls Printful");
});

test("shipment webhook: if the notice can't be sent Printful is asked to try again, and the retry gets through", async () => {
  const key = "hook-secret-1234567890", was = process.env.ORDER_NOTIFY_URL;
  process.env.ORDER_NOTIFY_URL = "https://down.test/form";
  assert.equal(await quiet(() => ship(key)), 500);
  process.env.ORDER_NOTIFY_URL = was;
  assert.equal(await ship(key), 200); assert.equal(notices().length, 1);
});
