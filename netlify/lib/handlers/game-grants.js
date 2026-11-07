/* POST /.netlify/functions/game-grants  { ack?: [ids] }  ->  { grants: [{ id, cranes, order, reason }] }
   Hands the game any rewards waiting on the server (cranes from paid subscription renewals and from gifts a friend opened). They stay
   until the game acknowledges them by id, after applying them, so a dropped answer on a weak connection loses nothing. */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps);
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const idOf = (g) => String(g.order || "") + "|" + (g.at || 0) + "|" + (g.reason || ""), b = G.parse(event) || {};
  let grants = me.pending || [];
  if (Array.isArray(b.ack) && b.ack.length && grants.length) {
    const ack = new Set(b.ack.map(String)), left = grants.filter((g) => !ack.has(idOf(g)));
    if (left.length !== grants.length) { me.pending = left; await G.savePlayer(store, me); grants = left; }
  }
  return G.json(200, { grants: grants.map((g) => Object.assign({ id: idOf(g) }, g)) });
};
