/* POST /.netlify/functions/game-account  { name? }  ->  { player, token }
   Creates an anonymous Beju Farm player. The token is shown once; the server keeps only its hash. */
const G = require("../lib/game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const body = G.parse(event) || {};
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const id = G.newId(), token = G.newToken();
  await store.set("players/" + id, { tokenHash: G.hash(token), name: G.cleanName(body.name) || "Farmer", created: now, grants: [] });
  return G.json(201, { player: id, token });
};
