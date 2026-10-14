/* Turns a shopping cart into Stripe Checkout settings. Prices always come from the catalog here,
   never from the browser, so a customer can't change what they pay. */
const CATALOG = require("./catalog.json");

const GRINDS = ["Whole bean", "Espresso", "Moka pot", "Filter (V60, drip)", "French press"];
const GRINDS_JA = { "Whole bean": "豆のまま", "Espresso": "エスプレッソ", "Moka pot": "モカポット", "Filter (V60, drip)": "フィルター(V60・ドリップ)", "French press": "フレンチプレス" };
const RHYTHM = { "2w": { interval: "week", interval_count: 2, en: "every 2 weeks", ja: "2週間ごと" }, "1m": { interval: "month", interval_count: 1, en: "every month", ja: "毎月" } };

function unitPrice(p, freq) { return freq === "once" ? p.price : Math.round(p.price * (1 - CATALOG.subscriptionDiscount)); }

/* Validates the cart; returns { error } or { lines, interval, subtotalOnce, subtotalPerDelivery }. */
function checkCart(raw) {
  if (!Array.isArray(raw) || !raw.length) return { error: "empty", message: "Your cart is empty." };
  if (raw.length > 20) return { error: "too_many", message: "Too many items in one order." };
  const lines = [];
  for (const l of raw) {
    const p = CATALOG.products[l && l.pid];
    if (!p) return { error: "unknown_product", message: "A coffee in your cart is no longer available." };
    const qty = Math.floor(Number(l.qty));
    if (!(qty >= 1 && qty <= 20)) return { error: "bad_qty", message: "Please choose between 1 and 20 bags." };
    if (GRINDS.indexOf(l.grind) < 0) return { error: "bad_grind", message: "Please choose a grind." };
    if (["once", "2w", "1m"].indexOf(l.freq) < 0) return { error: "bad_freq", message: "Please choose a delivery option." };
    lines.push({ pid: l.pid, p, qty, grind: l.grind, freq: l.freq, unit: unitPrice(p, l.freq) });
  }
  const rhythms = [...new Set(lines.filter(l => l.freq !== "once").map(l => l.freq))];
  if (rhythms.length > 1) return { error: "mixed_rhythms", message: "Subscriptions every 2 weeks and every month need separate checkouts. Please make them match, or check out one at a time." };
  const subtotalOnce = lines.filter(l => l.freq === "once").reduce((s, l) => s + l.unit * l.qty, 0);
  const subtotalPerDelivery = lines.filter(l => l.freq !== "once").reduce((s, l) => s + l.unit * l.qty, 0);
  return { lines, rhythm: rhythms[0] || null, subtotalOnce, subtotalPerDelivery };
}

function shippingFor(amount) {
  const s = CATALOG.shipping;
  return amount >= s.freeFrom ? 0 : s.fee;
}

/* Stripe Checkout Session parameters for a checked cart. */
function sessionParams(cart, opts) {
  const ja = opts.lang === "ja";
  const site = opts.site.replace(/\/$/, "");
  const base = site + (ja ? "/ja" : "");
  const sub = cart.rhythm ? RHYTHM[cart.rhythm] : null;
  const line_items = cart.lines.map(l => {
    const name = ja ? l.p.jp : l.p.name;
    const grind = ja ? GRINDS_JA[l.grind] : l.grind;
    const desc = (ja ? "挽き方: " : "Grind: ") + grind + " · " + l.p.weight + (l.freq !== "once" ? (ja ? " · 定期便 " + RHYTHM[l.freq].ja + "(" : " · Subscription " + RHYTHM[l.freq].en + " (") + Math.round(CATALOG.subscriptionDiscount * 100) + (ja ? "%オフ)" : "% off)") : "");
    const price_data = { currency: "jpy", unit_amount: l.unit, product_data: { name, description: desc, metadata: { pid: l.pid, grind: l.grind } } };
    if (l.freq !== "once") price_data.recurring = { interval: RHYTHM[l.freq].interval, interval_count: RHYTHM[l.freq].interval_count };
    return { price_data, quantity: l.qty };
  });
  const summary = cart.lines.map(l => l.pid + "×" + l.qty + " [" + l.grind + ", " + l.freq + "]").join("; ").slice(0, 490);
  const params = {
    line_items,
    locale: ja ? "ja" : "en",
    shipping_address_collection: { allowed_countries: ["JP"] },
    phone_number_collection: { enabled: "true" },
    billing_address_collection: "auto",
    allow_promotion_codes: "true",
    success_url: base + "/thanks/?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: base + "/shop/?checkout=cancelled",
    metadata: { order: summary, lang: opts.lang || "en" }
  };
  if (sub) {
    /* subscription: delivery is charged with every box (free above the threshold per delivery) */
    params.mode = "subscription";
    const fee = shippingFor(cart.subtotalPerDelivery);
    if (fee > 0) line_items.push({ price_data: { currency: "jpy", unit_amount: fee, product_data: { name: ja ? "送料(定期便)" : "Delivery (each box)" }, recurring: { interval: sub.interval, interval_count: sub.interval_count } }, quantity: 1 });
    /* any one-off bags in the same order ride along in the first box */
    params.subscription_data = { metadata: { order: summary, lang: opts.lang || "en" } };
  } else {
    params.mode = "payment";
    params.customer_creation = "always";
    const fee = shippingFor(cart.subtotalOnce);
    params.shipping_options = [{ shipping_rate_data: { type: "fixed_amount", display_name: fee ? (ja ? "宅配便(全国)" : "Delivery in Japan") : (ja ? "送料無料" : "Free delivery"),
      fixed_amount: { amount: fee, currency: "jpy" }, delivery_estimate: { minimum: { unit: "business_day", value: 2 }, maximum: { unit: "business_day", value: 5 } } } }];
    params.payment_intent_data = { metadata: { order: summary } };
  }
  return params;
}

module.exports = { CATALOG, checkCart, sessionParams, shippingFor, unitPrice };
