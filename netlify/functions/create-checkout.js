/* POST /.netlify/functions/create-checkout  { lines: [{pid, grind, freq, qty}], lang }  ->  { url }
   Creates a Stripe Checkout page for the cart and returns its address. */
const { stripe } = require("../lib/stripe");
const { checkCart, sessionParams } = require("../lib/order");

const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });
  let body;
  try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "{}"); }
  catch (e) { return json(400, { error: "bad_json" }); }
  const cart = checkCart(body.lines);
  if (cart.error) return json(400, cart);
  const site = process.env.SITE_URL || process.env.URL || "https://www.bejucoffee.com";
  try {
    const session = await stripe("POST", "checkout/sessions", sessionParams(cart, { lang: body.lang === "ja" ? "ja" : "en", site }), deps && deps.fetch);
    return json(200, { url: session.url });
  } catch (e) {
    console.error("create-checkout", e.status, e.message, e.stripe && e.stripe.param);
    return json(502, { error: "stripe", message: "Checkout could not be started. Please try again, or order by message." });
  }
};
