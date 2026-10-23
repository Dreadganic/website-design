/* POST /.netlify/functions/game-account  { name? }  ->  { player, token }
   Creates an anonymous Beju Farm player. The token is shown once; the server keeps only its hash. */
const G = require("../lib/game");

const PER_HOUR = 20;   /* new farms from one connection in an hour: plenty for a family or an office, not for a script */

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const body = G.parse(event) || {};
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const h = event.headers || {}, ip = h["x-nf-client-connection-ip"] || String(h["x-forwarded-for"] || "").split(",")[0].trim();
  if (ip) {   /* counted by a hash of the address, never the address itself */
    const rk = "rl/acct/" + G.hash(ip).slice(0, 16) + "/" + Math.floor(now / 3600e3), n = ((await store.get(rk)) || { n: 0 }).n;
    if (n >= PER_HOUR) return G.json(429, { error: "too_many_new_farms" });
    await store.set(rk, { n: n + 1 });
  }
  const id = G.newId(), token = G.newToken();
  await store.set("players/" + id, { tokenHash: G.hash(token), name: G.cleanName(body.name) || "Farmer", created: now, grants: [] });
  return G.json(201, { player: id, token });
};
