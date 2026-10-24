/* POST /.netlify/functions/game-score  { name, prestige, seasonP, seasonKh, seasonStars, level, points, look }  ->  { ok, rank } or 422 { error }
   GET  /.netlify/functions/game-score?mode=season|rookie|all  ->  { season, top: [...], me? }   (rookie: players in their first season)
   GET  /.netlify/functions/game-score?mode=final&season=YYYY-MM  ->  the closed board of a past season, with the caller's final rank
   The leaderboard. All time ranks by prestige, then level, then points; the season board ranks by season stars, then by who reached that total first (so a bigger farm doesn't win ties).
   The first request of a new season saves the last season's final board as seasons/<key>, before any player's row moves on to the new season.
   Each submission must be possible since the last one, except that a player who started their farm again (reset: true) may start their row again too.
   Every row is read once per ROWS_MS by each function instance, not once per request, so a busy board stays cheap. */
const G = require("../game");

const rankSort = (key) => (a, b) => b[key] - a[key] || b.level - a.level || b.points - a.points;
const seasonSort = (a, b) => (b.seasonStars || 0) - (a.seasonStars || 0) || (a.starsAt || Infinity) - (b.starsAt || Infinity) || (b.seasonKh || 0) - (a.seasonKh || 0);
const ROWS_MS = 15e3, rowCache = new Map(), LIVE = {};   /* keyed by store, so tests with their own stores never share rows */
async function allRows(store, ck, now) {
  const c = rowCache.get(ck);
  if (c && now - c.at < ROWS_MS) return c.rows;
  const keys = await store.list("scores/");
  const rows = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
  rowCache.set(ck, { at: now, rows });
  return rows;
}
const keepRow = (ck, row) => { const c = rowCache.get(ck); if (!c) return; const i = c.rows.findIndex((r) => r.id === row.id); if (i > -1) c.rows[i] = row; else c.rows.push(row); };
async function boardFor(store, mode, season, ck, now) {
  const rows = await allRows(store, ck, now);
  const live = mode === "all" ? rows : rows.filter((r) => r.season === season && (mode !== "rookie" || r.firstSeason === season));
  return live.sort(mode === "all" ? rankSort("prestige") : seasonSort);
}
const pinOf = (r) => { const p = r.look && r.look.pin; return p ? (r.trophies || []).find((t) => t.id === p) || null : null; };   /* the one trophy a player shows beside their name */
const publicRow = (r, i) => ({ pin: pinOf(r), rank: i + 1, name: r.name, prestige: r.prestige, seasonP: r.seasonP, seasonKh: r.seasonKh || 0, seasonStars: r.seasonStars || 0, level: r.level, points: r.points, look: r.look, rookie: !!r.firstSeason && r.firstSeason === r.season, code: r.code || "" });   /* code: for visiting their farm */

async function closeSeason(store, season, now, ck) {   /* save last season's final standings once, while every row still holds them */
  const prev = G.prevSeason(season), key = "seasons/" + prev;
  if (await store.get(key)) return;
  const rows = (await boardFor(store, "season", prev, ck, now)).map((r) => ({ id: r.id, name: r.name, prestige: r.prestige, seasonP: r.seasonP, seasonKh: r.seasonKh || 0, seasonStars: r.seasonStars || 0, level: r.level, points: r.points, look: r.look, starsAt: r.starsAt || 0, firstSeason: r.firstSeason || "", season: r.season }));
  await store.set(key, { season: prev, closedAt: now, rows });
}

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), season = G.seasonKey(now), ck = (deps && deps.store) || LIVE;
  await closeSeason(store, season, now, ck);
  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    if (q.mode === "final") {
      if (!/^\d{4}-\d{2}$/.test(q.season || "")) return G.json(400, { error: "bad_season" });
      const done = await store.get("seasons/" + q.season);
      if (!done) return G.json(404, { error: q.season >= season ? "season_not_over" : "no_record" });
      const me = await G.authed(event, store), mine = me ? done.rows.findIndex((r) => r.id === me.id) : -1;
      const rookies = done.rows.filter((r) => r.firstSeason === q.season), rk = me ? rookies.findIndex((r) => r.id === me.id) : -1;   /* first-season players also get a rookie rank */
      if (mine > -1 && mine < 10) await G.addTrophy(store, me, { k: "season", s: q.season, r: mine + 1 }, now);   /* a top 10 finish goes on the trophy shelf */
      if (rk > -1 && rk < 10) await G.addTrophy(store, me, { k: "rookie", s: q.season, r: rk + 1 }, now);
      return G.json(200, { season: q.season, mode: "final", players: done.rows.length, top: done.rows.slice(0, 50).map(publicRow), me: mine > -1 ? Object.assign(publicRow(done.rows[mine], mine), { rookieRank: rk > -1 ? rk + 1 : null }) : null }, { "Cache-Control": me ? "private, no-store" : "public, max-age=300" });
    }
    const mode = q.mode === "all" ? "all" : q.mode === "rookie" ? "rookie" : "season";
    const list = await boardFor(store, mode, season, ck, now), me = await G.authed(event, store);
    const mine = me ? list.findIndex((r) => r.id === me.id) : -1;
    return G.json(200, { season, mode, players: list.length, top: list.slice(0, 50).map(publicRow), me: mine > -1 ? Object.assign(publicRow(list[mine], mine), { trophies: list[mine].trophies || [] }) : null }, { "Cache-Control": me ? "private, no-store" : "public, max-age=30" });
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
  const reset = b.reset === true && !!prev;   /* the farm started again: going back down is always allowed, then it's checked like a new farm */
  const problem = G.checkScore(reset ? null : prev && Object.assign({}, prev, { seasonP: prev.season === season ? prev.seasonP : 0 }), next, now);
  if (problem) return G.json(422, { error: problem });
  const row = Object.assign(next, { id: me.id, name, look: G.cleanLook(b.look, next.prestige), season, at: now, prestigeAt: reset || !prev || next.prestige > prev.prestige ? now : prev.prestigeAt,
    starsAt: !prev || prev.season !== season || next.seasonStars > (prev.seasonStars || 0) ? now : prev.starsAt,   /* when they reached this star total, for ties */
    firstSeason: prev ? prev.firstSeason || "" : season, code: me.farmCode || "" });   /* rows from before rookies existed count as veterans */
  const founder = G.isFounder(row);
  if (founder) await G.addTrophy(store, me, { k: "founder", s: row.firstSeason }, now);
  if (row.look.charm === "founder" && !founder) row.look.charm = "";   /* the Founding farmer charm is only for the launch season's farmers */
  if (row.look.pin && !(me.trophies || []).some((t) => t.id === row.look.pin)) row.look.pin = "";   /* only a trophy you hold can be pinned */
  row.trophies = G.publicTrophies(me.trophies);
  await store.set(key, row); keepRow(ck, row);
  const list = await boardFor(store, "season", season, ck, now);
  return G.json(200, { ok: true, rank: list.findIndex((r) => r.id === me.id) + 1, players: list.length });
};
