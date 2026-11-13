/* Made-to-order merchandise through Printful (prints in Japan, ships to the customer). Dormant until PRINTFUL_API_KEY is set in Netlify:
   without it nothing here calls Printful or touches storage. A catalogue product is merchandise when it has a "fulfil" block:
     "fulfil": { "by": "printful", "variants": { "M": 14030, "L": 14031 }, "files": [{ "type": "front", "url": "https://…/art.png" }] }
   variants maps the option the customer picks (a size, say) to a Printful catalogue variant id; a variant can also be
   { "variant_id": 14036, "files": [...] } when it needs artwork of its own (a dark shirt). A file can also be one already in the Printful
   file library, given by its id: { "type": "back", "id": 1109986784 }; files are passed to Printful as written. Optional: "options" (Printful item options) and
   "label": { "en": "Size", "ja": "サイズ" } for the option's name at checkout.
   Requests and answers follow Printful's API v1 documentation (developers.printful.com/docs: Orders API, Using Private Token, Errors). */
const crypto = require("crypto");
const API = "https://api.printful.com/";

/* Printful REST call. opts: { key, storeId, fetch, timeout }. An answer is { code, result }; an error is { code, result: "message", error: { reason, message } }. */
async function printful(method, path, body, opts) {
  if (!opts || !opts.key) throw Object.assign(new Error("PRINTFUL_API_KEY is not set in Netlify"), { status: 0 });
  const headers = { Authorization: "Bearer " + opts.key, "Content-Type": "application/json" };
  if (opts.storeId) headers["X-PF-Store-Id"] = String(opts.storeId);   /* only an account-level token needs it */
  const res = await (opts.fetch || fetch)(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(opts.timeout || 5000) });
  let data = null;
  try { data = await res.json(); } catch (e) { /* not JSON: an outage page */ }
  if (!res.ok) throw Object.assign(new Error((data && ((data.error && data.error.message) || (typeof data.result === "string" && data.result))) || "Printful error " + res.status), { status: res.status, reason: data && data.error && data.error.reason });
  return data && data.result;
}

/* POST /orders: a draft unless confirm is true (?confirm=true submits it for fulfilment, and Printful charges for it) */
const createOrder = (order, opts) => printful("POST", "orders" + (opts.confirm ? "?confirm=true" : ""), order, opts);
/* GET /orders/@{external_id} */
const getOrder = (externalId, opts) => printful("GET", "orders/@" + encodeURIComponent(externalId), undefined, opts);

/* Printful's external_id holds at most 32 letters, digits, dashes and underscores, and a Stripe Checkout session id is about twice that,
   so the order's id at Printful is the first 32 hex characters of the session id's SHA-256: the same session always gives the same id. */
const externalId = (sessionId) => crypto.createHash("sha256").update(String(sessionId)).digest("hex").slice(0, 32);

/* Printful's state codes for Japan are the prefecture numbers 01 to 47 (GET /countries). Stripe gives the prefecture as text. */
const PREF_EN = ["Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima", "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa", "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu", "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi", "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa"];
const PREF_JA = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
function jpStateCode(state) {
  const raw = String(state || "").trim();
  if (!raw) return null;
  const num = /^(?:JP-)?(\d{1,2})$/i.exec(raw);
  if (num && +num[1] >= 1 && +num[1] <= 47) return ("0" + +num[1]).slice(-2);
  let i = PREF_JA.findIndex((p) => p === raw || (p !== "北海道" && p.slice(0, -1) === raw));
  if (i < 0) {
    const en = raw.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s-]+(prefecture|to|fu|ken)$/, "").replace(/[^a-z]/g, "");
    i = PREF_EN.findIndex((p) => p.toLowerCase() === en);
  }
  return i < 0 ? null : ("0" + (i + 1)).slice(-2);
}

/* The merchandise among a paid order's Stripe line items (each expanded with data.price.product, whose metadata holds pid and option).
   Returns { items, problems }: items in Printful's shape, problems for lines that can't be matched to a variant. */
function merchItems(lineItems, catalog) {
  const items = [], problems = [];
  for (const li of lineItems || []) {
    const md = (li.price && li.price.product && li.price.product.metadata) || {}, p = md.pid && catalog.products[md.pid];
    const f = p && p.fulfil;
    if (!f || f.by !== "printful") continue;   /* coffee, the delivery line, anything else */
    const keys = Object.keys(f.variants || {}), option = md.option || (keys.length === 1 ? keys[0] : "");
    const v = f.variants && Object.prototype.hasOwnProperty.call(f.variants, option) ? f.variants[option] : null;
    const variant_id = v && typeof v === "object" ? v.variant_id : v, files = (v && typeof v === "object" && v.files) || f.files;
    if (!Number.isInteger(variant_id) || !Array.isArray(files) || !files.length) { problems.push(md.pid + (option ? " (" + option + ")" : "") + ": no Printful variant or print file in the catalogue"); continue; }
    const item = { variant_id, quantity: li.quantity || 1, name: p.name + (option && keys.length > 1 ? " (" + option + ")" : ""), files };
    if (f.options) item.options = f.options;
    items.push(item);
  }
  return { items, problems };
}

/* The Printful order for a paid Stripe Checkout session: where to send it, and what to print. */
function buildOrder(session, items) {
  const ship = session.shipping_details || (session.collected_information && session.collected_information.shipping_details) || {};
  const a = ship.address || {}, c = session.customer_details || {};
  const country = a.country || "JP", code = country === "JP" ? jpStateCode(a.state) : null;
  const recipient = { name: ship.name || c.name, address1: a.line1, address2: a.line2, city: a.city, state_code: code, state_name: code ? undefined : a.state, country_code: country, zip: a.postal_code, phone: c.phone, email: c.email };
  for (const k of Object.keys(recipient)) if (!recipient[k]) delete recipient[k];
  return { external_id: externalId(session.id), recipient, items };
}

/* Sends a paid order's merchandise to Printful, once. Never throws: a failure comes back as { ok: false, note } for the owner's order notice.
   Returns null when there is nothing to do (no API key, or no merchandise in the order).
   opts: { env, fetch, catalog, store: () => store, now }. The record under printful/orders/<external id> holds ids and status only, no address. */
async function sendMerch(session, lineItems, opts) {
  const env = opts.env || {}, key = env.PRINTFUL_API_KEY;
  if (!key) return null;
  let ext = "", store = null;
  const save = async (rec) => { try { if (store) await store.set("printful/orders/" + ext, Object.assign({ session: session.id, at: opts.now || Date.now() }, rec)); } catch (e) { console.error("printful record", e.message); } };
  try {
    const { items, problems } = merchItems(lineItems, opts.catalog);
    if (!items.length && !problems.length) return null;
    ext = externalId(session.id);
    try { store = opts.store(); } catch (e) { console.error("printful store", e.message); }
    let prev = null;
    try { prev = store && await store.get("printful/orders/" + ext); } catch (e) { console.error("printful record", e.message); }
    const done = (o, again) => ({ ok: true, again: !!again, id: o.id, status: o.status, note: "Printful order " + o.id + " (" + o.status + ")" + (o.status === "draft" ? ": a draft, not yet sent to print. Confirm it in Printful." : "") });
    if (prev && prev.status === "created") return done({ id: prev.printful, status: prev.state }, true);   /* a retried webhook: already ordered */
    if (problems.length) throw new Error(problems.join("; "));
    const call = { key, storeId: env.PRINTFUL_STORE_ID, fetch: opts.fetch, confirm: env.PRINTFUL_CONFIRM === "on" };
    let o;
    try { o = await createOrder(buildOrder(session, items), call); }
    catch (e) {
      /* Printful refuses an external_id it already holds (OR-13 EXTERNAL_ID_IN_USE): if this order is there, an earlier attempt got through */
      if (!(e.status >= 400 && e.status < 500) || [401, 403, 429].indexOf(e.status) > -1) throw e;
      try { o = await getOrder(ext, Object.assign({}, call, { timeout: 3000 })); } catch (e2) { throw e; }
      if (!o || !o.id) throw e;
    }
    await save({ status: "created", printful: o.id, state: o.status, confirm: call.confirm });
    return done(o, false);
  } catch (e) {
    const why = String((e && e.message) || e).slice(0, 300), timedOut = e && (e.name === "TimeoutError" || e.name === "AbortError");
    console.error("printful", e && e.status, why);
    await save({ status: "failed", error: why });
    return { ok: false, error: why, note: "NOT SENT TO PRINTFUL: " + why + (timedOut ? " (no answer in time: check Printful for this order before trying again)" : "") + ". To try again, resend this event from Stripe (Developers > Webhooks); it cannot order twice. Or place the order by hand in Printful." };
  }
}

module.exports = { printful, createOrder, getOrder, externalId, jpStateCode, merchItems, buildOrder, sendMerch };
