/* POST /.netlify/functions/game-score  { name, prestige, seasonP, seasonKh, seasonStars, level, points, look }  ->  { ok, rank } or 422 { error }
   GET  /.netlify/functions/game-score?mode=season|all      ->  { season, top: [...], me? }
   GET  /.netlify/functions/game-score?mode=final&season=YYYY-MM  ->  the closed board of a past season, with the caller's final rank
   The leaderboard. All time ranks by prestige, then level, then points; the season board ranks by season stars, then know-how earned this season.
   The first request of a new season saves the last season's final board as seasons/<key>, before any player's row moves on to the new season.
   Each submission must be possible since the last one. */
const G = require("../lib/game");

const rankSort = (key) => (a, b) => b[key] - a[key] || b.level - a.level || b.points - a.points;
const seasonSort = (a, b) => (b.seasonStars || 0) - (a.seasonStars || 0) || (b.seasonKh || 0) - (a.seasonKh || 0);
async function allRows(store) {
  const keys = await store.list("scores/");
  return (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
}
async function boardFor(store, mode, season) {
  const rows = await allRows(store);
  const live = mode === "all" ? rows : rows.filter((r) => r.season === season);
  return live.sort(mode === "all" ? rankSort("prestige") : seasonSort);
}
const publicRow = (r, i) => ({ rank: i + 1, name: r.name, prestige: r.prestige, seasonP: r.seasonP, seasonKh: r.seasonKh || 0, seasonStars: r.seasonStars || 0, level: r.level, points: r.points, look: r.look });

async function closeSeason(store, season, now) {   /* save last season's final standings once, while every row still holds them */
  const prev = G.prevSeason(season), key = "seasons/" + prev;
  if (await store.get(key)) return;
  const rows = (await boardFor(store, "season", prev)).map((r) => ({ id: r.id, name: r.name, prestige: r.prestige, seasonP: r.seasonP, seasonKh: r.seasonKh || 0, seasonStars: r.seasonStars || 0, level: r.level, points: r.points, look: r.look }));
  await store.set(key, { season: prev, closedAt: now, rows });
}

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), season = G.seasonKey(now);
  await closeSeason(store, season, now);
  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    if (q.mode === "final") {
      if (!/^\d{4}-\d{2}$/.test(q.season || "")) return G.json(400, { error: "bad_season" });
      const done = await store.get("seasons/" + q.season);
      if (!done) return G.json(404, { error: q.season >= season ? "season_not_over" : "no_record" });
      const me = await G.authed(event, store), mine = me ? done.rows.findIndex((r) => r.id === me.id) : -1;
      return G.json(200, { season: q.season, mode: "final", players: done.rows.length, top: done.rows.slice(0, 50).map(publicRow), me: mine > -1 ? publicRow(done.rows[mine], mine) : null }, { "Cache-Control": "public, max-age=300" });
    }
    const mode = q.mode === "all" ? "all" : "season";
    const list = await boardFor(store, mode, season), me = await G.authed(event, store);
    const mine = me ? list.findIndex((r) => r.id === me.id) : -1;
    return G.json(200, { season, mode, players: list.length, top: list.slice(0, 50).map(publicRow), me: mine > -1 ? publicRow(list[mine], mine) : null }, { "Cache-Control": "public, max-age=30" });
  }
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const b = G.parse(event);
  if (!b) return G.json(400, { error: "bad_json" });
  const name = G.cleanName(b.name);
  if (!name) return G.json(422, { error: "bad_name" });
  const key = "scores/" + me.id, prev = await store.get(key);
  const nextSeasonP = prev && prev.season !== season ? Math.min(b.seasonP | 0, 1) : b.seasonP | 0;   /* a new season starts the season count again */
  const next = { prestige: b.prestige | 0, seasonP: nextSeasonP, seasonKh: Math.floor(Number(b.seasonKh) || 0), seasonStars: Math.floor(Number(b.seasonStars) || 0), level: b.level | 0, points: Math.floor(Number(b.points) || 0) };
  const problem = G.checkScore(prev && Object.assign({}, prev, { seasonP: prev.season === season ? prev.seasonP : 0 }), next, now);
  if (problem) return G.json(422, { error: problem });
  const row = Object.assign(next, { id: me.id, name, look: G.cleanLook(b.look, next.prestige), season, at: now, prestigeAt: !prev || next.prestige > prev.prestige ? now : prev.prestigeAt });
  await store.set(key, row);
  const list = await boardFor(store, "season", season);
  return G.json(200, { ok: true, rank: list.findIndex((r) => r.id === me.id) + 1, players: list.length });
};
