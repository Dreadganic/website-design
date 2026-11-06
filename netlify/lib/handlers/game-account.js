/* POST /.netlify/functions/game-account  { name? }  ->  { player, token, name }
   Creates an anonymous Beju Farm player. The token is shown once; the server keeps only its hash.
   A name that's free becomes theirs (name in the answer); otherwise name is null and the game asks for one (game-name).
   DELETE /.netlify/functions/game-account (signed in)  ->  { deleted: true }
   Deletes the player's online farm: account, cloud save and its history, leaderboard row, visit snapshot and code, name, and co-op place.
   Order claims (claims/) stay, as records of a real purchase, but no longer point at anyone who can sign in. */
const G = require("../game");

const PER_HOUR = 20;
async function removeFarm(event, store) {
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  await removePlayer(store, me);
  return G.json(200, { deleted: true });
}
async function removePlayer(store, me) {   /* also used by game-admin */
  const id = me.id, gone = ["players/" + id, "saves/" + id, "scores/" + id, "farms/" + id];
  for (const k of await store.list("savehist/" + id + "/")) gone.push(k);
  if (me.farmCode && (await store.get("codes/" + me.farmCode)) === id) gone.push("codes/" + me.farmCode);
  if (me.nameKey) { const n = await store.get("names/" + me.nameKey); if (n && n.id === id) gone.push("names/" + me.nameKey); }
  if (me.coop) { const c = await store.get("coops/" + me.coop); if (c && c.members) { c.members = c.members.filter((m) => m !== id); await store.set("coops/" + c.id, c); } }
  for (const k of gone) await store.del(k);
}
exports.removePlayer = removePlayer;   /* new farms from one connection in an hour: plenty for a family or an office, not for a script */

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  if (event.httpMethod === "DELETE") return removeFarm(event, store);
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const body = G.parse(event) || {};
  const h = event.headers || {}, ip = h["x-nf-client-connection-ip"] || String(h["x-forwarded-for"] || "").split(",")[0].trim();
  if (ip) {   /* counted by a hash of the address, never the address itself */
    const rk = "rl/acct/" + G.hash(ip).slice(0, 16) + "/" + Math.floor(now / 3600e3), n = ((await store.get(rk)) || { n: 0 }).n;
    if (n >= PER_HOUR) return G.json(429, { error: "too_many_new_farms" });
    await store.set(rk, { n: n + 1 });
  }
  const id = G.newId(), token = G.newToken();
  await store.set("players/" + id, { tokenHash: G.hash(token), created: now, grants: [] });
  const named = body.name ? await G.claimName(store, { id }, body.name, now) : {};
  return G.json(201, { player: id, token, name: named.name || null });
};
