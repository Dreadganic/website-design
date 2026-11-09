/* The Co-op Derby: a weekly race between cooperatives. Members score points from a shared board of tasks.
   With 4 to 19 co-ops it runs as one group with no leagues, so a small community still has it. From 20, co-ops are grouped about 10 at a time
   by league and strength, and at the end of the week the top 3 of each group move up a league and the bottom 3 move down. */
const C = require("./community");

const DERBY_MIN_COOPS = 4, LEAGUE_COOPS = 20, GROUP = 10, LEAGUES = 5, MOVE = 3;   /* from 4 co-ops it runs as one group; leagues (moving up and down) start at 20 */
/* each task: points per unit, and the most one member can count in a week (so one big farm can't carry a co-op alone) */
const DERBY_TASKS = {
  sell: { name: "Sell or deliver lots", pts: 1, cap: 400 },
  cup: { name: "Cup lots by hand", pts: 2, cap: 200 },
  golden: { name: "Catch golden bushes", pts: 5, cap: 60 },
  contract: { name: "Complete contracts", pts: 3, cap: 100 },
  roast: { name: "Roast bags", pts: 1, cap: 300 },
  boat: { name: "Fill the trader's boat", pts: 10, cap: 20 },
  neigh: { name: "Be a good neighbour", pts: 1, cap: 60 }   /* counted on the server: helping a mate (5), a care package (5), cheering a farm outside the co-op (2, three a day). On every board */
};
const BEST = 5, FULL_TABLE = 1.1;   /* a co-op scores its best five members; +10% when everyone who's active scored */
/* house co-ops: run by the cast, they fill a small community's group to four so the Derby is always on. They pace at about the group's middle and never take a place */
const HOUSES = [{ id: "h_rosa", name: "Rosa's Growers", m: 0.95 }, { id: "h_ama", name: "Captain Ama's Crew", m: 1.05 }, { id: "h_ines", name: "Dr. Inés's Naturalists", m: 0.85 }];
const isHouse = (id) => String(id).startsWith("h_");
const houseOf = (id) => HOUSES.find((h) => h.id === id);
function housePts(id, realPts, wk, now) {   /* the middle of the real co-ops' points, or a steady pace while there are few; grows through the week */
  const h = houseOf(id), sorted = realPts.slice().sort((a, b) => a - b), mid = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const frac = Math.max(0, Math.min(1, (now - C.weekStart(wk)) / (7 * C.DAY)));
  return Math.round(Math.max(mid, 900 * frac) * (h ? h.m : 1));
}
const ensureMp = (rec) => { if (rec && !rec.mp) { rec.mp = {}; Object.keys(rec.m || {}).forEach((pid) => { rec.mp[pid] = Object.keys(rec.m[pid] || {}).reduce((a, k) => a + (rec.m[pid][k] || 0) * ((DERBY_TASKS[k] || { pts: 0 }).pts), 0); }); } return rec; };   /* a week begun before per-member points: rebuilt from the counts, so nothing restarts mid-week */
const scoreOf = (rec, members) => {   /* the best five members' points, and the full-table bonus */
  ensureMp(rec);
  const mp = Object.values(rec.mp || {}).sort((a, b) => b - a), sum = mp.slice(0, BEST).reduce((a, x) => a + x, 0);
  const active = Object.keys(rec.mp || {}).filter((k) => rec.mp[k] > 0).length;
  return Math.round(sum * (members >= 2 && active >= members ? FULL_TABLE : 1));
};
const BASIC = ["sell", "cup", "golden", "contract"];
const RANK_CRANES = [3, 2, 2, 1, 1, 1, 1, 1, 1, 1];   /* a little, plus a badge: play cranes stay low */
const leagueName = (l) => ["", "Seedling", "Sprout", "Cherry", "Roaster", "Geisha"][l] || "Seedling";
function boardFor(wk) {   /* four tasks a week: three everyone can do, and one more from the whole list */
  const n = Math.round(C.weekStart(wk) / (7 * C.DAY)), all = Object.keys(DERBY_TASKS);
  const basic = [0, 1, 2, 3].map((i) => BASIC[(n + i) % BASIC.length]).slice(0, 3), pool = all.filter((k) => !basic.includes(k) && k !== "neigh");
  const extra = pool[n % pool.length];
  return basic.concat([extra, "neigh"]);
}
async function ensureWeek(store, wk, now) {   /* group this week's co-ops, settling last week's results first */
  const key = "derby/" + wk; let d = await store.get(key);
  if (d) return d;
  const prev = await store.get("derby/" + C.prevWeek(wk));
  if (prev && prev.groups) await settle(store, C.prevWeek(wk), prev);
  const idx = (await store.get("coopidx")) || {}, live = Object.entries(idx).filter(([, x]) => x.n >= 2);
  if (!live.length) return { week: wk, on: false, have: 0 };
  const coops = await Promise.all(live.map(([id]) => store.get("coops/" + id)));
  const band = (n) => (n <= 3 ? 0 : n <= 6 ? 1 : 2);   /* co-ops of a like size race each other */
  const rows = live.map(([id, x], i) => ({ id, p: x.p, n: x.n, league: (coops[i] && coops[i].league) || 1 })).sort((a, b) => b.league - a.league || band(b.n) - band(a.n) || b.p - a.p);
  const groups = [];
  if (rows.length < LEAGUE_COOPS) groups.push(rows.map((r) => r.id).concat(HOUSES.slice(0, Math.max(0, DERBY_MIN_COOPS - rows.length)).map((h) => h.id)));   /* a small community: one group, with house co-ops to make four */
  else {
    for (let i = 0; i < rows.length; i += GROUP) groups.push(rows.slice(i, i + GROUP).map((r) => r.id));
    if (groups[groups.length - 1].length < GROUP / 2) groups[groups.length - 2].push(...groups.pop());   /* no tiny last group */
  }
  d = { week: wk, on: true, leagues: groups.length > 1, board: boardFor(wk), groups, at: now };
  await store.set(key, d);
  return d;
}
async function settle(store, wk, d) {   /* last week's places, league moves and crane rewards */
  if (d.settled) return;
  for (const g of d.groups) {
    const real = await Promise.all(g.filter((id) => !isHouse(id)).map(async (id) => { const c = await store.get("coops/" + id), r = (await store.get("derby/" + wk + "/c/" + id)) || {}; return { id, pts: r.m && Object.keys(r.m).length ? scoreOf(r, (c && c.members.length) || 1) : r.pts || 0 }; }));
    const all = real.concat(g.filter(isHouse).map((id) => ({ id, pts: housePts(id, real.map((x) => x.pts), wk, C.weekStart(wk) + 7 * C.DAY), house: true })));
    all.sort((a, b) => b.pts - a.pts);
    const pts = all.filter((x) => !x.house);   /* places and rewards among real co-ops only: a house can never take one */
    for (let i = 0; i < pts.length; i++) {
      const coop = await store.get("coops/" + pts[i].id); if (!coop) continue;
      const league = coop.league || 1, move = !d.leagues ? 0 : i < MOVE && pts[i].pts > 0 ? 1 : i >= pts.length - MOVE ? -1 : 0;
      coop.league = Math.max(1, Math.min(LEAGUES, league + move)); await store.set("coops/" + coop.id, coop);
      await store.set("derby/" + wk + "/result/" + coop.id, { rank: i + 1, of: pts.length, league, to: coop.league, pts: pts[i].pts, cranes: RANK_CRANES[i] || 1, claimed: [] });
    }
  }
  d.settled = true; await store.set("derby/" + wk, d);
}
async function joinLate(store, d, coop) {   /* without leagues there's one group, so a co-op formed mid-week joins it straight away */
  if (d.on && !d.leagues && coop.members.length >= 2 && !d.groups.some((g) => g.includes(coop.id))) { const g = d.groups[0], hi = g.map(isHouse).lastIndexOf(true); if (hi > -1) g.splice(hi, 1, coop.id); else g.push(coop.id); await store.set("derby/" + d.week, d); }   /* a real co-op takes a house co-op's place */
  return d;
}
async function derbyAdd(store, coop, me, counts, now) {   /* a member's task counts this week; only rises count, each capped */
  if (!counts || typeof counts !== "object") return;
  const wk = C.weekKey(now), d = await joinLate(store, await ensureWeek(store, wk, now), coop);
  if (!d.on || !d.groups.some((g) => g.includes(coop.id))) return;
  const key = "derby/" + wk + "/c/" + coop.id, rec = ensureMp((await store.get(key)) || { pts: 0, m: {}, mp: {} }), mine = rec.m[me.id] || {};
  let changed = false;
  d.board.forEach((k) => { if (k === "neigh") return; const t = DERBY_TASKS[k], n = Math.min(t.cap, Math.max(0, Math.floor(Number(counts[k]) || 0))); if (n > (mine[k] || 0)) { rec.mp[me.id] = (rec.mp[me.id] || 0) + (n - (mine[k] || 0)) * t.pts; mine[k] = n; changed = true; } });
  if (changed) { rec.m[me.id] = mine; rec.pts = scoreOf(rec, coop.members.length); await store.set(key, rec); }
}
async function derbyNeigh(store, coop, meId, pts, now) {   /* the neighbour row, counted here from what the server saw: never from the game's own counts */
  if (!coop) return;
  const wk = C.weekKey(now), d = await joinLate(store, await ensureWeek(store, wk, now), coop);
  if (!d.on || !d.groups.some((g) => g.includes(coop.id))) return;
  const key = "derby/" + wk + "/c/" + coop.id, rec = ensureMp((await store.get(key)) || { pts: 0, m: {}, mp: {} });
  const mine = rec.m[meId] || {}, had = mine.neigh || 0, add = Math.max(0, Math.min(DERBY_TASKS.neigh.cap - had, pts));
  if (!add) return;
  mine.neigh = had + add; rec.m[meId] = mine; rec.mp[meId] = (rec.mp[meId] || 0) + add; rec.pts = scoreOf(rec, coop.members.length); await store.set(key, rec);
}
async function derbyView(store, coop, me, now) {
  const wk = C.weekKey(now), d = await joinLate(store, await ensureWeek(store, wk, now), coop);
  const lastWk = C.prevWeek(wk), res = await store.get("derby/" + lastWk + "/result/" + coop.id);
  const lastRec = res && (await store.get("derby/" + lastWk + "/c/" + coop.id));
  const last = res ? { rank: res.rank, of: res.of, league: res.league, to: res.to, cranes: res.cranes, canClaim: !!(lastRec && lastRec.m[me.id]) && !res.claimed.includes(me.id) } : null;
  if (!d.on) return { on: false, need: DERBY_MIN_COOPS, have: d.have, last };
  const g = d.groups.find((x) => x.includes(coop.id));
  if (!g) return { on: false, need: DERBY_MIN_COOPS, have: d.groups.flat().length, joinsNext: true, last };
  const realRows = await Promise.all(g.filter((id) => !isHouse(id)).map(async (id) => { const c = await store.get("coops/" + id), r = (await store.get("derby/" + wk + "/c/" + id)) || { pts: 0, m: {} }; return { id, you: id === coop.id, name: (c && c.name) || "Co-op", banner: (c && c.banner) || "", n: c ? c.members.length : 0, pts: r.m && Object.keys(r.m).length ? scoreOf(r, (c && c.members.length) || 1) : r.pts || 0, m: r.m }; }));
  const rows = realRows.concat(g.filter(isHouse).map((id) => ({ id, house: true, name: houseOf(id).name, banner: "house", pts: housePts(id, realRows.map((x) => x.pts), wk, now), m: {} })));
  rows.sort((a, b) => b.pts - a.pts);
  const mineRow = rows.find((r) => r.you), at = rows.indexOf(mineRow), rival = at > 0 ? rows[at - 1] : null;
  const names = {}; await Promise.all(coop.members.map(async (pid) => { names[pid] = ((await store.get("scores/" + pid)) || {}).name || "Farmer"; }));
  const mvp = {}; d.board.forEach((k) => { let best = null; Object.keys(mineRow.m || {}).forEach((pid) => { const v = (mineRow.m[pid] || {})[k] || 0; if (v > 0 && (!best || v > best.v)) best = { v, pid }; }); if (best) mvp[k] = names[best.pid] || "Farmer"; });   /* the best in the co-op at each task: praise only, never a bottom list */
  const scored = Object.keys(mineRow.m || {}).filter((pid) => coop.members.includes(pid)).length;
  return { on: true, week: wk, ends: C.weekStart(wk) + 7 * C.DAY, leagues: !!d.leagues, league: coop.league || 1, leagueName: leagueName(coop.league || 1),
    board: d.board.map((k) => ({ id: k, name: DERBY_TASKS[k].name, pts: DERBY_TASKS[k].pts, cap: DERBY_TASKS[k].cap, mine: ((mineRow.m[me.id] || {})[k]) || 0 })),
    board2: undefined, mvp, scored, members: coop.members.length, fullTable: FULL_TABLE, best: BEST,
    rival: rival ? { name: rival.name, pts: rival.pts, gap: Math.max(1, rival.pts - mineRow.pts + 1), house: !!rival.house, banner: rival.banner || "" } : null,
    group: rows.map((r, i) => ({ rank: i + 1, name: r.name, pts: r.pts, you: !!r.you, house: !!r.house, banner: r.banner || "" })), rank: at + 1, last };
}
async function derbyClaim(store, coop, me, now) {
  const lastWk = C.prevWeek(C.weekKey(now)), key = "derby/" + lastWk + "/result/" + coop.id, res = await store.get(key);
  if (!res) return { error: "no_result" };
  const rec = await store.get("derby/" + lastWk + "/c/" + coop.id);
  if (!rec || !rec.m[me.id]) return { error: "did_not_play" };
  if (res.claimed.includes(me.id)) return { error: "already_claimed" };
  res.claimed.push(me.id); await store.set(key, res);
  return { cranes: res.cranes, rank: res.rank, of: res.of, week: lastWk };
}

module.exports = { derbyNeigh, HOUSES, scoreOf, DERBY_MIN_COOPS, LEAGUE_COOPS, DERBY_TASKS, GROUP, LEAGUES, boardFor, ensureWeek, derbyAdd, derbyView, derbyClaim, leagueName };
