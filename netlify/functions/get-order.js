/* GET /.netlify/functions/get-order?session_id=cs_...  ->  a short summary for the thank-you page.
   Session ids are long random strings, and only non-sensitive details are returned. */
const { stripe } = require("../lib/stripe");

const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const deps = exports.__deps;
  const id = (event.queryStringParameters || {}).session_id || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id)) return json(400, { error: "bad_session" });
  try {
    const s = await stripe("GET", "checkout/sessions/" + id, { expand: ["line_items"] }, deps && deps.fetch);
    const email = (s.customer_details && s.customer_details.email) || "";
    return json(200, {
      status: s.status, paid: s.payment_status === "paid" || s.payment_status === "no_payment_required", mode: s.mode,
      total: s.amount_total, currency: s.currency,
      email: email.replace(/^(.).*(@.*)$/, "$1•••$2"),
      name: (s.shipping_details && s.shipping_details.name) || (s.customer_details && s.customer_details.name) || "",
      items: ((s.line_items && s.line_items.data) || []).map(li => ({ name: li.description, qty: li.quantity, amount: li.amount_total }))
    });
  } catch (e) {
    return json(e.status === 404 ? 404 : 502, { error: "not_found" });
  }
};
