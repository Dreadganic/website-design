/* GET  /.netlify/functions/game-gift            ->  { gifts: [{ code, order, opened }], from }   (your gift codes, and who sent the gift you opened)
   POST /.netlify/functions/game-gift  { code }  ->  { ok, from }   (open a friend's gift: a furoshiki decoration for your farm, and 10 cranes for them)
   Every order linked to Beju Farm brings one gift for a friend (made in game-claim). Each player opens one gift ever, and never their own. */
const G = require("../lib/game");

const GIFT_CRANES = 10;   /* for the friend who sent it, when it's opened */

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  if (event.httpMethod === "GET") {
    const gifts = await Promise.all((me.gifts || []).slice(-10).map(async (code) => { const g = (await store.get("gifts/" + code)) || {}; return { code, order: g.order || "", opened: !!g.by }; }));
    const from = me.giftFrom ? ((await store.get("scores/" + me.giftFrom)) || {}).name || "a friend" : null;
    return G.json(200, { gifts, from });
  }
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const b = G.parse(event) || {}, code = String(b.code || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
  if (!/^[A-Z2-9]{6}$/.test(code)) return G.json(400, { error: "bad_code" });
  const key = "gifts/" + code, g = await store.get(key);
  if (!g) return G.json(404, { error: "no_gift" });
  if (g.from === me.id) return G.json(422, { error: "own_gift" });
  if (g.by) return G.json(409, { error: "already_opened" });
  if (me.giftFrom) return G.json(422, { error: "one_gift_each" });
  g.by = me.id; g.openedAt = now; await store.set(key, g);
  me.giftFrom = g.from; await G.savePlayer(store, me);
  const giver = await store.get("players/" + g.from);
  if (giver) { giver.pending = (giver.pending || []).concat([{ cranes: GIFT_CRANES, order: code, reason: "gift", at: now }]); await store.set("players/" + g.from, giver); }   /* handed over by game-grants */
  return G.json(200, { ok: true, from: ((await store.get("scores/" + g.from)) || {}).name || "a friend" });
};
