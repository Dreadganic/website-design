/* POST /.netlify/functions/game-score  { name, prestige, seasonP, level, points, look }  ->  { ok, rank } or 422 { error }
   GET  /.netlify/functions/game-score?mode=season|all      ->  { season, top: [...], me? }
   The leaderboard. Ranks by prestige, then level, then points. Each submission must be possible since the last one. */
const G = require("../lib/game");

const rankSort = (key) => (a, b) => b[key] - a[key] || b.level - a.level || b.points - a.points;
async function boardFor(store, mode, season) {
  const keys = await store.list("scores/");
  const rows = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
  const live = mode === "all" ? rows : rows.filter((r) => r.season === season);
  return live.sort(rankSort(mode === "all" ? "prestige" : "seasonP"));
}
const publicRow = (r, i) => ({ rank: i + 1, name: r.name, prestige: r.prestige, seasonP: r.seasonP, level: r.level, points: r.points, look: r.look });

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), season = G.seasonKey(now);
  if (event.httpMethod === "GET") {
    const mode = (event.queryStringParameters || {}).mode === "all" ? "all" : "season";
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
  const nextSeasonP = prev && prev.season !== season ? Math.min(b.seasonP | 0, 1) : b.seasonP | 0;   /* a new month starts the season count again */
  const next = { prestige: b.prestige | 0, seasonP: nextSeasonP, level: b.level | 0, points: Math.floor(Number(b.points) || 0) };
  const problem = G.checkScore(prev && Object.assign({}, prev, { seasonP: prev.season === season ? prev.seasonP : 0 }), next, now);
  if (problem) return G.json(422, { error: problem });
  const row = Object.assign(next, { id: me.id, name, look: G.cleanLook(b.look), season, at: now, prestigeAt: !prev || next.prestige > prev.prestige ? now : prev.prestigeAt });
  await store.set(key, row);
  const list = await boardFor(store, "season", season);
  return G.json(200, { ok: true, rank: list.findIndex((r) => r.id === me.id) + 1, players: list.length });
};
