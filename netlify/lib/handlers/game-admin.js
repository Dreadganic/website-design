/* POST /.netlify/functions/game-admin   Authorization: Bearer <ADMIN_KEY>   { act, ... }
   The few things that otherwise need a local Blobs script. Off unless ADMIN_KEY is set in Netlify's environment.
     { act: "find", name }                      -> the player id that holds a name
     { act: "get", id }                         -> account (no secrets), leaderboard row, cloud save's version, time and size, saved copies
     { act: "flagged", rate? }                  -> leaderboard rows whose know-how this season grew faster than play allows (default 400 a second)
     { act: "clamp", id, points?, seasonKh?, prestige? }  -> lowers a row's numbers (never raises them); the level follows the points
     { act: "restore", id, slot }               -> puts a saved copy (h0..h2, d0..d2) back as the cloud save, as a new version
     { act: "delete", id }                      -> deletes the player's online farm, as their own Delete does */
const G = require("../game");
const { removePlayer } = require("./game-account");

const seasonStart = (season) => Date.parse(season + "-01T00:00:00+09:00");

exports.handler = async (event) => {
  const deps = exports.__deps;
  const h = event.headers || {}, m = /^Bearer (.+)$/.exec(h.authorization || h.Authorization || "");
  if (!process.env.ADMIN_KEY || !m || !G.sameSecret(m[1], process.env.ADMIN_KEY)) return G.json(403, { error: "forbidden" });
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), b = G.parse(event) || {};
  const id = /^p_[A-Za-z0-9_-]{8,20}$/.test(b.id || "") ? b.id : null;
  if (b.act === "find") { const n = await store.get("names/" + G.nameKey(b.name)); return G.json(n ? 200 : 404, n ? { id: n.id } : { error: "no_such_name" }); }
  if (b.act === "flagged") {
    const rate = +b.rate > 0 ? +b.rate : 400, out = [];
    for (const k of await store.list("scores/")) {
      const r = await store.get(k); if (!r || !r.season) continue;
      const secs = Math.max(60, ((r.at || now) - seasonStart(r.season)) / 1000), perSec = (r.seasonKh || 0) / secs;
      if (perSec > rate || r.points > G.XP_AT(r.level + 3)) out.push({ id: r.id, name: r.name, prestige: r.prestige, level: r.level, points: r.points, seasonKh: r.seasonKh, perSec: Math.round(perSec) });
    }
    return G.json(200, { rate, rows: out.sort((x, y) => y.perSec - x.perSec) });
  }
  if (!id) return G.json(400, { error: "bad_id" });
  const me = await store.get("players/" + id);
  if (!me) return G.json(404, { error: "no_such_player" });
  if (b.act === "get") {
    const save = await store.get("saves/" + id), row = await store.get("scores/" + id), hist = await store.list("savehist/" + id + "/");
    const { tokenHash, tokens, ...pub } = me;
    return G.json(200, { player: Object.assign(pub, { devices: 1 + (tokens || []).length }), row, save: save && { version: save.version, at: save.at, bytes: JSON.stringify(save.data).length }, copies: hist });
  }
  if (b.act === "clamp") {
    const row = await store.get("scores/" + id); if (!row) return G.json(404, { error: "no_row" });
    const low = (k) => { if (Number.isFinite(+b[k]) && +b[k] >= 0 && +b[k] < row[k]) row[k] = Math.floor(+b[k]); };
    low("points"); low("seasonKh"); low("prestige"); row.level = G.levelFor(row.points); row.seasonP = Math.min(row.seasonP || 0, row.prestige);
    await store.set("scores/" + id, row); await G.boardPut(store, row, now);
    return G.json(200, { row });
  }
  if (b.act === "restore") {
    if (!/^[hd][0-2]$/.test(b.slot || "")) return G.json(400, { error: "bad_slot" });
    const copy = await store.get("savehist/" + id + "/" + b.slot), cur = await store.get("saves/" + id);
    if (!copy) return G.json(404, { error: "no_copy" });
    const next = { version: (cur ? cur.version : 0) + 1, at: now, data: copy.data, histH: now, histD: now };   /* a new version, so every device sees it as newer */
    await store.set("saves/" + id, next);
    return G.json(200, { version: next.version, from: copy.at });
  }
  if (b.act === "delete") { await removePlayer(store, Object.assign(me, { id })); return G.json(200, { deleted: true }); }
  return G.json(400, { error: "bad_act" });
};
