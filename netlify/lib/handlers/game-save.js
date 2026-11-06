/* GET  /.netlify/functions/game-save                      ->  { version, at, data }, or { none: true } before the first save
   PUT  /.netlify/functions/game-save  { base, data }       ->  { version, at }   (409 with the server copy if it is newer)
   Cloud save for one player. "base" is the version the client last saw, so an old phone can't overwrite newer progress.
   The save it replaces is kept in savehist/<id>/ (the last three hours and the last three days), so a bad upload can be undone by hand. */
const G = require("../game");
const HOUR = 3600e3, DAY = 24 * HOUR, KEEP = 3;
/* a save the game could never have written: numbers that aren't numbers. Fields a save leaves out are fine (old and test saves are partial) */
const num = (x) => x === undefined || (typeof x === "number" && Number.isFinite(x));
const badShape = (d) => !num(d.coins) || !num(d.points) || !num(d.xp) || !num(d.cranes) || (d.prestige !== undefined && !Number.isInteger(d.prestige)) || (d.farms !== undefined && (typeof d.farms !== "object" || d.farms === null || Array.isArray(d.farms)));

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const key = "saves/" + me.id, cur = await store.get(key);
  if (event.httpMethod === "GET") return G.json(200, cur || { none: true, version: 0 });
  if (event.httpMethod !== "PUT") return G.json(405, { error: "method_not_allowed" });
  if ((event.body || "").length > G.RULES.maxSaveBytes) return G.json(413, { error: "too_big" });
  const body = G.parse(event);
  if (!body || typeof body.data !== "object" || body.data === null) return G.json(400, { error: "bad_save" });
  if (cur && now - cur.at < G.RULES.minSaveGapSec * 1000) return G.json(429, { error: "too_soon", version: cur.version });
  if (cur && Number(body.base) !== cur.version) return G.json(409, { error: "newer_on_server", version: cur.version, at: cur.at, data: cur.data });
  if (badShape(body.data)) return G.json(400, { error: "bad_save" });
  const next = { version: (cur ? cur.version : 0) + 1, at: now, data: body.data, histH: cur ? cur.histH || 0 : now, histD: cur ? cur.histD || 0 : now };
  if (cur) {   /* the copy being replaced goes into history first: three hourly and three daily slots, at most two extra writes an hour */
    if (now - next.histH >= HOUR) { await store.set("savehist/" + me.id + "/h" + (Math.floor(now / HOUR) % KEEP), cur); next.histH = now; }
    if (now - next.histD >= DAY) { await store.set("savehist/" + me.id + "/d" + (Math.floor(now / DAY) % KEEP), cur); next.histD = now; }
  }
  await store.set(key, next);
  return G.json(200, { version: next.version, at: now });
};
