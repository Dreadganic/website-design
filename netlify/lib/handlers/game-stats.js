/* GET /.netlify/functions/game-stats?key=<STATS_KEY>&days=7  ->  retention, funnel and feature usage from recent beacon events.
   Set STATS_KEY in the Netlify UI (Site configuration → Environment variables); without it this returns 403, so the
   aggregate stays private. Reads beacon blobs directly (each batch is its own blob, see game-beacon.js). At the current
   scale a week of events is a few hundred blobs; if the game grows, add a daily roll-up blob and read that instead. */
const G = require("../game");

const DAY = 86400000;
const dayOf = (ts) => Math.floor(ts / DAY);
const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "GET") return G.json(405, { error: "method_not_allowed" });
  const q = event.queryStringParameters || {};
  const want = process.env.STATS_KEY, got = q.key || "";
  if (!want || got !== want) return G.json(403, { error: "forbidden" });
  const days = Math.max(1, Math.min(90, Math.round(+q.days) || 7));
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), from = now - days * DAY;
  const events = [];
  for (const k of await store.list("beacon/")) {
    if (Number(k.split("/").pop().split("-")[0]) < from) continue;
    const blob = await store.get(k);
    if (blob && Array.isArray(blob.events)) for (const e of blob.events) if (e.ts >= from) events.push(e);
  }
  events.sort((a, b) => a.ts - b.ts);

  /* counts per event */
  const counts = {};
  for (const e of events) counts[e.e] = (counts[e.e] || 0) + 1;

  /* sessions: one per (fid, sid); length from session_end */
  const starts = events.filter((e) => e.e === "session_start");
  const ends = events.filter((e) => e.e === "session_end").map((e) => e.len).filter((n) => n > 0);

  /* retention: first-seen day per fid, then who came back exactly d days later */
  const firstDay = {}, seenDays = {};
  for (const e of starts) {
    const d = dayOf(e.ts);
    if (firstDay[e.fid] === undefined || d < firstDay[e.fid]) firstDay[e.fid] = d;
    if (!seenDays[e.fid]) seenDays[e.fid] = new Set();
    seenDays[e.fid].add(d);
  }
  const today = dayOf(now), ret = {};
  for (const dd of [1, 7, 30]) {
    let cohort = 0, back = 0;
    for (const fid of Object.keys(firstDay)) {
      const f = firstDay[fid];
      if (f > today - dd || f < today - days) continue;   /* cohort: first seen exactly dd days ago, inside the window */
      cohort += 1;
      if (seenDays[fid].has(f + dd)) back += 1;
    }
    ret["d" + dd] = { cohort, returned: back, rate: cohort ? Math.round((1000 * back) / cohort) / 10 : null };
  }

  /* feature usage */
  const counterSessions = events.filter((e) => e.e === "counter_close");
  const away = events.filter((e) => e.e === "away_collect").map((e) => e.h).filter((n) => n > 0);
  const prestigeByP = {};
  for (const e of events) if (e.e === "prestige" || e.e === "first_prestige") prestigeByP["P" + (e.p || 1)] = (prestigeByP["P" + (e.p || 1)] || 0) + 1;
  const players = Object.keys(firstDay).length;
  const bags = {};   /* real-bag cards: shown, then "See the real bag" tapped, per coffee */
  for (const e of events) if ((e.e === "bag_card" || e.e === "order_click") && e.key) { const b = bags[e.key] = bags[e.key] || { cards: 0, clicks: 0 }; if (e.e === "bag_card") b.cards += 1; else b.clicks += 1; }

  return G.json(200, {
    days, from: new Date(from).toISOString(), to: new Date(now).toISOString(),
    players, events: events.length, counts,
    sessions: { started: counts.session_start || 0, ended: ends.length, medianLenSec: median(ends) },
    retention: ret,
    counter: { closes: counterSessions.length, medianServed: median(counterSessions.map((e) => e.served || 0)), medianWalkouts: median(counterSessions.map((e) => e.out || 0)) },
    away: { sessions: away.length, medianHours: median(away) },
    bags, prestigeByP, p5Plus: starts.filter((e) => (e.p || 0) >= 5).length,
    funnel: { first_pick: counts.first_pick || 0, first_sale: counts.first_sale || 0, first_prestige: counts.first_prestige || 0, counter_open: counts.counter_open || 0, kona_open: counts.kona_open || 0, order_click: counts.order_click || 0 }
  });
};
