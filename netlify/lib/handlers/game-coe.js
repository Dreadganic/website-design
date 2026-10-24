/* The Cup of Excellence, a weekly championship on equal terms (see netlify/lib/coe.js).
   GET  /.netlify/functions/game-coe                                   ->  { brief, mine, board, hall, last }
   POST /.netlify/functions/game-coe  { act: "start", v, m, profile }  ->  { n, c, hw, dur }   (opens an attempt: the crack window for this roast)
   POST /.netlify/functions/game-coe  { act: "submit", n, t }          ->  { score, mine }   (t: ms into the roast when you tapped Crack)
   The weekly board ranks each player's best attempt. When a week ends its final places feed the Q grader rating, and the Hall of Excellence ranks that rating. */
const G = require("../game");
const C = require("../community");
const E = require("../coe");

const BOARD_MS = 60e3;
const PROFILES = ["light", "medium", "dark"];

async function weekBoard(store, wk, now, force) {   /* everyone's best this week, recounted at most once a minute */
  const key = "coe/" + wk + "/board"; let b = await store.get(key);
  if (force || !b || now - b.at > BOARD_MS) {
    const keys = await store.list("coe/" + wk + "/best/"), rows = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
    rows.sort((x, y) => y.total - x.total || x.at - y.at);
    b = { at: now, rows: rows.map((r) => ({ id: r.id, name: r.name, look: r.look, total: r.total })) };
    await store.set(key, b);
  }
  return b;
}
async function finalise(store, wk, now) {   /* once a week is over: its final places, then the Hall of Excellence from the last 8 weeks */
  if (await store.get("coe/" + wk + "/final")) return;
  const b = await weekBoard(store, wk, now, true), n = b.rows.length;
  await store.set("coe/" + wk + "/final", { n, pct: Object.fromEntries(b.rows.map((r, i) => [r.id, n ? 100 * (n - i) / n : 0])) });
  const weeks = []; let k = wk; for (let i = 0; i < 8; i++) { weeks.push(k); k = C.prevWeek(k); }
  const finals = await Promise.all(weeks.map((w) => store.get("coe/" + w + "/final")));
  const who = {};
  finals.forEach((f) => { if (f) Object.entries(f.pct).forEach(([id, p]) => { (who[id] = who[id] || []).push(p); }); });
  const rows = await Promise.all(Object.entries(who).map(async ([id, pcts]) => { const s = (await store.get("scores/" + id)) || {}; return { id, name: s.name || "Farmer", look: s.look || {}, rating: E.ratingFrom(pcts), weeks: pcts.length }; }));
  rows.sort((a, b2) => b2.rating - a.rating);
  await store.set("coe/hall", { week: wk, at: now, rows });
}
const pub = (r, i) => ({ rank: i + 1, name: r.name, look: r.look, total: r.total });

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), wk = C.weekKey(now), last = C.prevWeek(wk);
  await finalise(store, last, now);
  const me = await G.authed(event, store);
  if (event.httpMethod === "GET") {
    const b = await weekBoard(store, wk, now), hall = (await store.get("coe/hall")) || { rows: [] };
    const att = me ? (await store.get("coe/" + wk + "/att/" + me.id)) || { list: [] } : null;
    const mi = me ? b.rows.findIndex((r) => r.id === me.id) : -1, hi = me ? hall.rows.findIndex((r) => r.id === me.id) : -1;
    const lf = me && await store.get("coe/" + last + "/final");
    if (lf && lf.pct[me.id] !== undefined) { const rk = Math.round(lf.n - lf.pct[me.id] * lf.n / 100) + 1; if (rk <= Math.max(1, Math.ceil(lf.n * 0.1))) await G.addTrophy(store, me, { k: "coe", w: last, r: rk }, now); }   /* the weekly top 10% (and always the winner) goes on the trophy shelf */
    return G.json(200, {
      brief: E.briefFor(wk), ends: C.weekStart(wk) + 7 * C.DAY,
      mine: att && { used: att.list.length, left: E.ATTEMPTS - att.list.length, list: att.list, best: mi > -1 ? b.rows[mi].total : null, rank: mi + 1 || null, players: b.rows.length },
      board: b.rows.slice(0, 20).map(pub), players: b.rows.length,
      hall: hall.rows.slice(0, 20).map((r, i) => ({ rank: i + 1, name: r.name, look: r.look, rating: r.rating })), rating: hi > -1 ? hall.rows[hi].rating : null, hallRank: hi + 1 || null,
      last: lf && lf.pct[me.id] !== undefined ? { week: last, pct: Math.round(lf.pct[me.id]), players: lf.n, rank: Math.round(lf.n - lf.pct[me.id] * lf.n / 100) + 1, top: Math.round(lf.n - lf.pct[me.id] * lf.n / 100) + 1 <= Math.max(1, Math.ceil(lf.n * 0.1)) } : null   /* top: the weekly top 10%, and always the winner */
    });
  }
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  if (!me) return G.json(401, { error: "sign_in" });
  const row = (await store.get("scores/" + me.id)) || {};
  if ((row.prestige || 0) < E.MIN_PRESTIGE) return G.json(403, { error: "not_yet" });
  const b = G.parse(event) || {}, key = "coe/" + wk + "/att/" + me.id, att = (await store.get(key)) || { list: [] }, brief = E.briefFor(wk);
  if (b.act === "start") {
    if (att.list.length >= E.ATTEMPTS) return G.json(422, { error: "no_attempts_left" });
    if (!brief.vars.includes(b.v) || !brief.methods.includes(b.m) || !PROFILES.includes(b.profile)) return G.json(422, { error: "not_in_the_brief" });
    const n = att.list.length + 1, win = E.crackWindow(wk, n, b.v);
    att.open = { n, v: b.v, m: b.m, profile: b.profile, at: now }; await store.set(key, att);
    return G.json(200, { n, c: win.c, hw: win.hw, dur: E.DUR });
  }
  if (b.act === "submit") {
    const o = att.open, t = Math.round(Number(b.t));
    if (!o || o.n !== b.n) return G.json(422, { error: "no_open_attempt" });
    if (!(t >= 0 && t <= E.DUR)) return G.json(422, { error: "bad_time" });
    if (now - o.at < t - 1500) return G.json(422, { error: "too_quick" });   /* the tap can't come before the roast had run that long */
    const s = E.scoreFor(wk, o.n, o.v, o.m, o.profile, t);
    att.list.push({ n: o.n, v: o.v, m: o.m, profile: o.profile, t, total: s.total, at: now }); delete att.open; await store.set(key, att);
    const bestKey = "coe/" + wk + "/best/" + me.id, best = await store.get(bestKey);
    if (!best || s.total > best.total) await store.set(bestKey, { id: me.id, name: row.name || "Farmer", look: row.look || {}, total: s.total, at: now });
    const board = await weekBoard(store, wk, now, true), mi = board.rows.findIndex((r) => r.id === me.id);
    return G.json(200, { score: s, mine: { used: att.list.length, left: E.ATTEMPTS - att.list.length, best: board.rows[mi].total, rank: mi + 1, players: board.rows.length } });
  }
  return G.json(400, { error: "bad_act" });
};
