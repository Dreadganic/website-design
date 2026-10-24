/* POST /.netlify/functions/game-grants  ->  { grants: [{ cranes, order, reason }] }
   Hands the game any rewards waiting on the server (cranes from paid subscription renewals and from gifts a friend opened) and clears them. */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps);
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const grants = me.pending || [];
  if (grants.length) { me.pending = []; await G.savePlayer(store, me); }
  return G.json(200, { grants });
};
