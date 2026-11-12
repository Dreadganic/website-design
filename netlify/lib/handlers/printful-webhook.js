/* POST /.netlify/functions/printful-webhook?key=<PRINTFUL_WEBHOOK_SECRET>
   Printful calls this when a parcel of merchandise ships (event package_shipped). It records the tracking details against the order and passes
   them to the owner by the same route as order notices (ORDER_NOTIFY_URL). The site cannot email a customer itself, so the owner forwards them.
   Printful's v1 webhooks carry no signature, so the secret travels in the address given to Printful. Off (403) until both PRINTFUL_API_KEY and
   PRINTFUL_WEBHOOK_SECRET are set. Payload: { type, created, retries, store, data: { shipment, order } } (Printful docs: Webhook API, Package shipped). */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (!process.env.PRINTFUL_API_KEY || !secret) return { statusCode: 403, body: "off" };
  if (!G.sameSecret((event.queryStringParameters || {}).key || "", secret)) return { statusCode: 403, body: "forbidden" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "method not allowed" };
  const evt = G.parse(event);
  if (!evt || typeof evt !== "object") return { statusCode: 400, body: "bad json" };
  if (evt.type !== "package_shipped") return { statusCode: 200, body: "ignored" };
  const d = evt.data || {}, sh = d.shipment || {}, o = d.order || {};
  if (sh.id === undefined || sh.id === null) return { statusCode: 400, body: "no shipment" };
  const shipment = { id: sh.id, carrier: sh.carrier || "", service: sh.service || "", tracking_number: sh.tracking_number === undefined ? "" : String(sh.tracking_number), tracking_url: sh.tracking_url || "", ship_date: sh.ship_date || "", reshipment: !!sh.reshipment, at: (deps && deps.now) || Date.now() };
  /* the order record sendMerch wrote; an order placed by hand in Printful has none, and still gets a record and a notice */
  const key = "printful/orders/" + (/^[A-Za-z0-9_-]{1,32}$/.test(String(o.external_id || "")) ? o.external_id : "pf-" + Number(o.id));
  let store = null, rec = null;
  try { store = G.stores(event, deps); rec = await store.get(key); } catch (e) { console.error("printful-webhook record", e.message); }
  if (rec && (rec.shipments || []).some((x) => x.id === shipment.id)) return { statusCode: 200, body: "seen" };   /* Printful retrying one we have */
  const r = o.recipient || {};
  const notice = {
    _subject: "Beju merchandise shipped" + (rec && rec.session ? " " + String(rec.session).slice(-8) : ""),
    order: (rec && rec.session) || "", printful_order: o.id === undefined ? "" : String(o.id),
    carrier: [shipment.carrier, shipment.service].filter(Boolean).join(" "), tracking_number: shipment.tracking_number, tracking_url: shipment.tracking_url,
    ship_date: shipment.ship_date, reshipment: shipment.reshipment ? "This is a reshipment" : "",
    customer: r.name || "", email: r.email || "",
    note: "Printful has shipped this parcel. The website does not email the customer: forward the tracking link if Printful's own shipping email is off."
  };
  console.log("merchandise shipped", notice.order, notice.printful_order, shipment.id);
  try {
    if (process.env.ORDER_NOTIFY_URL) await ((deps && deps.fetch) || fetch)(process.env.ORDER_NOTIFY_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(notice) });
  } catch (e) {
    console.error("printful-webhook notify", e.message);
    return { statusCode: 500, body: "retry" };   /* Printful tries again later */
  }
  try {
    if (store) await store.set(key, Object.assign({}, rec || { printful: o.id, by: "hand" }, { shipments: ((rec && rec.shipments) || []).concat([shipment]) }));
  } catch (e) { console.error("printful-webhook record", e.message); }
  return { statusCode: 200, body: "ok" };
};
