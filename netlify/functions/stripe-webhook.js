/* Stripe calls this when an order is paid. It checks the call really came from Stripe, then (optionally)
   emails the order with each coffee's grind to ORDER_NOTIFY_URL (for example a Formspree form). */
const { stripe, verifySignature } = require("../lib/stripe");

exports.handler = async (event, context, deps) => {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "";
  const sig = event.headers && (event.headers["stripe-signature"] || event.headers["Stripe-Signature"]);
  if (!verifySignature(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)) return { statusCode: 400, body: "bad signature" };
  const evt = JSON.parse(raw);
  const f = (deps && deps.fetch) || fetch;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].indexOf(evt.type) > -1) {
    const s = evt.data.object;
    if (evt.type === "checkout.session.completed" && s.payment_status === "unpaid") return { statusCode: 200, body: "awaiting payment" };   /* konbini: wait until paid */
    try {
      const items = await stripe("GET", "checkout/sessions/" + s.id + "/line_items", { limit: 50, expand: ["data.price.product"] }, deps && deps.fetch);
      const ship = s.shipping_details || (s.collected_information && s.collected_information.shipping_details) || {};
      const a = ship.address || {};
      const order = {
        _subject: "New Beju order " + s.id.slice(-8),
        order: s.id, mode: s.mode, total: "¥" + Number(s.amount_total || 0).toLocaleString("en-US"),
        customer: (s.customer_details && s.customer_details.name) || ship.name || "", email: (s.customer_details && s.customer_details.email) || "", phone: (s.customer_details && s.customer_details.phone) || "",
        ship_to: [ship.name, a.postal_code, a.state, a.city, a.line1, a.line2].filter(Boolean).join(" "),
        items: items.data.map(li => li.quantity + " × " + li.description + (li.price && li.price.product && li.price.product.description ? " (" + li.price.product.description + ")" : "")).join("\n"),
        language: (s.metadata && s.metadata.lang) || ""
      };
      console.log("order paid", order.order, order.total);
      if (process.env.ORDER_NOTIFY_URL) await f(process.env.ORDER_NOTIFY_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(order) });
    } catch (e) {
      console.error("webhook", e.message);
      return { statusCode: 500, body: "retry" };   /* Stripe retries later */
    }
  }
  return { statusCode: 200, body: "ok" };
};
