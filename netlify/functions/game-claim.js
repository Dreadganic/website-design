/* POST /.netlify/functions/game-claim  { session_id }  ->  { cranes, bonus, coffees: [pid…], order, gift, sub }
   Turns a paid bejucoffee.com order into game rewards, once. The order is checked with Stripe on the server;
   the game is never trusted to say what was bought. 1 crane per ¥100, plus MONTH_BONUS for the first order of the month (Japan time);
   each coffee bought can stamp the passport. Every order also brings one gift code for a friend (game-gift), and a subscription
   unlocks the subscribers' fireworks on the farm. */
const G = require("../lib/game");
const { stripe } = require("../lib/stripe");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[require("crypto").randomInt(CODE_CHARS.length)]).join("");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const b = G.parse(event) || {}, id = String(b.session_id || "");
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id)) return G.json(400, { error: "bad_session" });
  const claimKey = "claims/" + id, done = await store.get(claimKey);
  if (done) return done.player === me.id ? G.json(200, Object.assign({ again: true }, done.grant)) : G.json(409, { error: "claimed_by_another_player" });
  let s, items;
  try {
    s = await stripe("GET", "checkout/sessions/" + id, null, deps && deps.fetch);
    if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") return G.json(402, { error: "not_paid" });
    items = await stripe("GET", "checkout/sessions/" + id + "/line_items", { limit: 50, expand: ["data.price.product"] }, deps && deps.fetch);
  } catch (e) {
    return G.json(e.status === 404 ? 404 : 502, { error: e.status === 404 ? "no_such_order" : "stripe_unavailable" });
  }
  const coffees = [];
  (items.data || []).forEach((li) => { const pid = li.price && li.price.product && li.price.product.metadata && li.price.product.metadata.pid; if (G.STAMPS[pid]) for (let k = 0; k < Math.min(li.quantity || 1, 5); k++) coffees.push(pid); });
  const bonus = G.firstThisMonth(me, now) ? G.MONTH_BONUS : 0, sub = s.mode === "subscription";
  let gift; do { gift = newCode(); } while (await store.get("gifts/" + gift));
  const grant = { cranes: Math.floor((s.amount_total || 0) / 100) + bonus, bonus, coffees, order: id.slice(-8), gift, sub };
  if (!(await store.create(claimKey, { player: me.id, at: now, grant }))) {   /* another request for this order got there first: pay it once */
    const won = await store.get(claimKey);
    return won && won.player === me.id ? G.json(200, Object.assign({ again: true }, won.grant)) : G.json(409, { error: "claimed_by_another_player" });
  }
  await store.set("gifts/" + gift, { from: me.id, order: id.slice(-8), at: now });
  if (sub && s.subscription) await store.set("subs/" + s.subscription, { player: me.id, at: now });   /* renewals of this subscription earn cranes too */
  if (sub) me.sub = true;
  G.addStamps(me, coffees);   /* the origin sacks farm visitors see come from the server's own record */
  me.gifts = (me.gifts || []).concat([gift]);
  me.grants = (me.grants || []).concat([{ order: id, at: now, cranes: grant.cranes }]);
  await G.savePlayer(store, me);
  return G.json(200, grant);
};
