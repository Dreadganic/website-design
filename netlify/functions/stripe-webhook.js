/* Stripe calls this when an order is paid. It checks the call really came from Stripe, then (optionally)
   emails the order with each coffee's grind to ORDER_NOTIFY_URL (for example a Formspree form). */
const { stripe, verifySignature } = require("../lib/stripe");

exports.handler = async (event) => {
  const deps = exports.__deps;
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
        language: (s.metadata && s.metadata.lang) || "",
        farm_sample: (s.metadata && s.metadata.farm_coffee) ? "Include a free 100 g " + s.metadata.farm_coffee + " sample (Beju Farm)" : ""
      };
      if (s.metadata && s.metadata.farm_sample) await farmSampleStatus(event, deps, s, "redeemed");
      console.log("order paid", order.order, order.total);
      if (process.env.ORDER_NOTIFY_URL) await f(process.env.ORDER_NOTIFY_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(order) });
    } catch (e) {
      console.error("webhook", e.message);
      return { statusCode: 500, body: "retry" };   /* Stripe retries later */
    }
  }
  if (evt.type === "checkout.session.expired" || evt.type === "checkout.session.async_payment_failed") {   /* an abandoned or unpaid checkout gives the farm sample back */
    const s = evt.data.object;
    if (s.metadata && s.metadata.farm_sample) await farmSampleStatus(event, deps, s, "earned");
  }
  if (evt.type === "invoice.paid") {   /* a paid subscription renewal earns Beju Farm cranes like any order, plus a subscriber's bonus */
    const inv = evt.data.object;
    if (inv.billing_reason === "subscription_cycle" && inv.subscription) {
      try {
        const G = require("../lib/game"), store = G.stores(event, deps);
        const link = await store.get("subs/" + inv.subscription);
        const p = link && await store.get("players/" + link.player);
        if (p && !(p.pending || []).some((g) => g.invoice === inv.id) && !(p.grants || []).some((g) => g.invoice === inv.id)) {
          const now = (deps && deps.now) || Date.now(), bonus = G.SUB_BONUS + (G.firstThisMonth(p, now) ? G.MONTH_BONUS : 0);
          const grant = { invoice: inv.id, cranes: Math.floor((inv.amount_paid || 0) / 100) + bonus, bonus, order: inv.id.slice(-8), reason: "subscription", at: now };
          p.pending = (p.pending || []).concat([grant]); p.grants = (p.grants || []).concat([grant]);
          await store.set("players/" + link.player, p);
        }
      } catch (e) { console.error("farm renewal", e.message); }
    }
  }
  return { statusCode: 200, body: "ok" };
};

/* move a Beju Farm sample between reserved, redeemed and earned (released) as its checkout completes or expires */
async function farmSampleStatus(event, deps, s, status) {
  try {
    const G = require("../lib/game"), store = G.stores(event, deps);
    const p = await store.get("players/" + s.metadata.farm_player);
    const smp = p && (p.samples || []).find((x) => x.id === s.metadata.farm_sample && x.session === s.id);
    if (!smp || smp.status === "redeemed") return;
    smp.status = status; if (status === "redeemed") smp.redeemedAt = Date.now(); else delete smp.session;
    await store.set("players/" + s.metadata.farm_player, p);
  } catch (e) { console.error("farm sample status", e.message); }
}
