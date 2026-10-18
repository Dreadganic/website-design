/* POST /.netlify/functions/create-checkout  { lines: [{pid, grind, freq, qty}], lang }  ->  { url }
   Creates a Stripe Checkout page for the cart and returns its address. */
const { stripe } = require("../lib/stripe");
const { checkCart, sessionParams } = require("../lib/order");

const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

/* Beju Farm: a free 100 g sample earned in the game rides along with an order of SAMPLE_RULES.minOrder or more.
   Off until GAME_SAMPLES=on is set in Netlify. Anything wrong with the sample never blocks the purchase: the order goes ahead without it. */
async function farmSample(event, deps, farm, cart, params, lang) {
  if (process.env.GAME_SAMPLES !== "on" || !farm || typeof farm.auth !== "string" || typeof farm.sample !== "string") return null;
  try {
    const G = require("../lib/game");
    const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
    const me = await G.authed({ headers: { authorization: "Bearer " + farm.auth } }, store);
    if (!me) return null;
    const s = (me.samples || []).find((x) => x.id === farm.sample && x.status === "earned" && x.expires > now);
    if (!s || cart.subtotalOnce + cart.subtotalPerDelivery < G.SAMPLE_RULES.minOrder) return null;
    const label = (lang === "ja" ? "Beju Farmの無料サンプル100g: " : "Free 100 g Beju Farm sample: ") + s.coffee;
    params.metadata = Object.assign({}, params.metadata, { farm_player: me.id, farm_sample: s.id, farm_coffee: s.coffee, order: (params.metadata.order + " + " + label).slice(0, 490) });
    params.custom_text = { submit: { message: lang === "ja" ? "Beju Farmで獲得した無料サンプル(" + s.coffee + " 100g)を同梱します。" : "Your free 100 g " + s.coffee + " sample from Beju Farm comes with this order." } };
    return { reserve: async (session) => { s.status = "reserved"; s.session = session; s.reservedAt = now; await G.savePlayer(store, me); } };
  } catch (e) {
    console.error("farm sample", e.message);
    return null;
  }
}

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });
  let body;
  try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "{}"); }
  catch (e) { return json(400, { error: "bad_json" }); }
  const cart = checkCart(body.lines);
  if (cart.error) return json(400, cart);
  const site = process.env.SITE_URL || process.env.URL || "https://www.bejucoffee.com";
  const lang = body.lang === "ja" ? "ja" : "en", params = sessionParams(cart, { lang, site });
  const sample = await farmSample(event, deps, body.farm, cart, params, lang);   /* null unless the game launch switch is on */
  try {
    const session = await stripe("POST", "checkout/sessions", params, deps && deps.fetch);
    if (sample) await sample.reserve(session.id);
    return json(200, { url: session.url });
  } catch (e) {
    console.error("create-checkout", e.status, e.message, e.stripe && e.stripe.param);
    return json(502, { error: "stripe", message: "Checkout could not be started. Please try again, or order by message." });
  }
};
