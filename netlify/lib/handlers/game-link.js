/* POST /.netlify/functions/game-link  { act: "make" }         ->  { code, expires }   (signed in: a code to play this farm on another device)
   POST /.netlify/functions/game-link  { act: "use", code }    ->  { player, token }   (on the new device: a token of its own for that farm)
   Moving a farm to another device. A code is 8 letters and numbers, works once and lasts LINK_MIN minutes. The new device gets its own token,
   so the old one keeps working; a player keeps at most MAX_TOKENS of them, and the oldest goes first. */
const G = require("../game");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   /* no 0/O, 1/I/L, so codes read aloud cleanly */
const newCode = () => Array.from({ length: 8 }, () => CODE_CHARS[require("crypto").randomInt(CODE_CHARS.length)]).join("");
const LINK_MIN = 15, MAKE_GAP_SEC = 10, MAX_TOKENS = 5;

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), b = G.parse(event) || {};
  if (b.act === "make") {
    const me = await G.authed(event, store);
    if (!me) return G.json(401, { error: "sign_in" });
    if (me.linkAt && now - me.linkAt < MAKE_GAP_SEC * 1000) return G.json(429, { error: "too_soon" });
    let code; do { code = newCode(); } while (!(await store.create("links/" + code, { player: me.id, at: now, expires: now + LINK_MIN * 60e3 })));
    me.linkAt = now; await G.savePlayer(store, me);
    return G.json(200, { code, expires: now + LINK_MIN * 60e3 });
  }
  if (b.act === "use") {
    const code = String(b.code || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
    if (!/^[A-Z2-9]{8}$/.test(code)) return G.json(400, { error: "bad_code" });
    const link = await store.get("links/" + code);
    if (!link || link.expires <= now) return G.json(404, { error: "no_code" });
    if (!(await store.create("linksused/" + code, { at: now }))) return G.json(409, { error: "used" });   /* one device per code, even if two try at once */
    const p = await store.get("players/" + link.player);
    if (!p) return G.json(404, { error: "no_code" });
    const token = G.newToken();
    p.tokens = (p.tokens || []).concat([G.hash(token)]).slice(-MAX_TOKENS);
    await store.set("players/" + link.player, p);
    return G.json(200, { player: link.player, token });
  }
  return G.json(400, { error: "bad_act" });
};
