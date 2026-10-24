/* POST /.netlify/functions/game-name  { name }  ->  { name } or 409 { error: "name_taken" } or 422 { error: "bad_name" | "generic_name" } or 429 { error: "too_many_renames" }
   Gives the player a name of their own: no two farmers share one (see claimName in netlify/lib/game.js). The game asks for it the first time it opens. */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const b = G.parse(event);
  if (!b) return G.json(400, { error: "bad_json" });
  const r = await G.claimName(store, me, b.name, now);
  if (r.error) return G.json(r.error === "name_taken" ? 409 : r.error === "too_many_renames" ? 429 : 422, { error: r.error });
  return G.json(200, { name: r.name });
};
