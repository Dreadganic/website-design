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
  boat: { name: "Fill the trader's boat", pts: 10, cap: 20 }
};
const BASIC = ["sell", "cup", "golden", "contract"];
const RANK_CRANES = [3, 2, 2, 1, 1, 1, 1, 1, 1, 1];   /* a little, plus a badge: play cranes stay low */
const leagueName = (l) => ["", "Seedling", "Sprout", "Cherry", "Roaster", "Geisha"][l] || "Seedling";
function boardFor(wk) {   /* four tasks a week: three everyone can do, and one more from the whole list */
  const n = Math.round(C.weekStart(wk) / (7 * C.DAY)), all = Object.keys(DERBY_TASKS);
  const basic = [0, 1, 2, 3].map((i) => BASIC[(n + i) % BASIC.length]).slice(0, 3);
  const extra = all.filter((k) => !basic.includes(k))[n % (all.length - 3)];
  return basic.concat([extra]);
}
async function ensureWeek(store, wk, now) {   /* group this week's co-ops, settling last week's results first */
  const key = "derby/" + wk; let d = await store.get(key);
  if (d) return d;
  const prev = await store.get("derby/" + C.prevWeek(wk));
  if (prev && prev.groups) await settle(store, C.prevWeek(wk), prev);
  const idx = (await store.get("coopidx")) || {}, live = Object.entries(idx).filter(([, x]) => x.n >= 2);
  if (live.length < DERBY_MIN_COOPS) return { week: wk, on: false, have: live.length };
  const coops = await Promise.all(live.map(([id]) => store.get("coops/" + id)));
  const rows = live.map(([id, x], i) => ({ id, p: x.p, league: (coops[i] && coops[i].league) || 1 })).sort((a, b) => b.league - a.league || b.p - a.p);
  const groups = [];
  if (rows.length < LEAGUE_COOPS) groups.push(rows.map((r) => r.id));   /* a small community: everyone in one group, no leagues yet */
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
    const pts = await Promise.all(g.map(async (id) => ({ id, pts: ((await store.get("derby/" + wk + "/c/" + id)) || {}).pts || 0 })));
    pts.sort((a, b) => b.pts - a.pts);
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
  if (d.on && !d.leagues && coop.members.length >= 2 && !d.groups.some((g) => g.includes(coop.id))) { d.groups[0].push(coop.id); await store.set("derby/" + d.week, d); }
  return d;
}
async function derbyAdd(store, coop, me, counts, now) {   /* a member's task counts this week; only rises count, each capped */
  if (!counts || typeof counts !== "object") return;
  const wk = C.weekKey(now), d = await joinLate(store, await ensureWeek(store, wk, now), coop);
  if (!d.on || !d.groups.some((g) => g.includes(coop.id))) return;
  const key = "derby/" + wk + "/c/" + coop.id, rec = (await store.get(key)) || { pts: 0, m: {} }, mine = rec.m[me.id] || {};
  let changed = false;
  d.board.forEach((k) => { const t = DERBY_TASKS[k], n = Math.min(t.cap, Math.max(0, Math.floor(Number(counts[k]) || 0))); if (n > (mine[k] || 0)) { rec.pts += (n - (mine[k] || 0)) * t.pts; mine[k] = n; changed = true; } });
  if (changed) { rec.m[me.id] = mine; await store.set(key, rec); }
}
async function derbyView(store, coop, me, now) {
  const wk = C.weekKey(now), d = await joinLate(store, await ensureWeek(store, wk, now), coop);
  const lastWk = C.prevWeek(wk), res = await store.get("derby/" + lastWk + "/result/" + coop.id);
  const lastRec = res && (await store.get("derby/" + lastWk + "/c/" + coop.id));
  const last = res ? { rank: res.rank, of: res.of, league: res.league, to: res.to, cranes: res.cranes, canClaim: !!(lastRec && lastRec.m[me.id]) && !res.claimed.includes(me.id) } : null;
  if (!d.on) return { on: false, need: DERBY_MIN_COOPS, have: d.have, last };
  const g = d.groups.find((x) => x.includes(coop.id));
  if (!g) return { on: false, need: DERBY_MIN_COOPS, have: d.groups.flat().length, joinsNext: true, last };
  const rows = await Promise.all(g.map(async (id) => { const c = await store.get("coops/" + id), r = (await store.get("derby/" + wk + "/c/" + id)) || { pts: 0, m: {} }; return { you: id === coop.id, name: (c && c.name) || "Co-op", pts: r.pts, m: r.m }; }));
  rows.sort((a, b) => b.pts - a.pts);
  const mineRow = rows.find((r) => r.you);
  return { on: true, week: wk, ends: C.weekStart(wk) + 7 * C.DAY, leagues: !!d.leagues, league: coop.league || 1, leagueName: leagueName(coop.league || 1),
    board: d.board.map((k) => ({ id: k, name: DERBY_TASKS[k].name, pts: DERBY_TASKS[k].pts, cap: DERBY_TASKS[k].cap, mine: ((mineRow.m[me.id] || {})[k]) || 0 })),
    group: rows.map((r, i) => ({ rank: i + 1, name: r.name, pts: r.pts, you: r.you })), rank: rows.indexOf(mineRow) + 1, last };
}
async function derbyClaim(store, coop, me, now) {
  const lastWk = C.prevWeek(C.weekKey(now)), key = "derby/" + lastWk + "/result/" + coop.id, res = await store.get(key);
  if (!res) return { error: "no_result" };
  const rec = await store.get("derby/" + lastWk + "/c/" + coop.id);
  if (!rec || !rec.m[me.id]) return { error: "did_not_play" };
  if (res.claimed.includes(me.id)) return { error: "already_claimed" };
  res.claimed.push(me.id); await store.set(key, res);
  return { cranes: res.cranes };
}

module.exports = { DERBY_MIN_COOPS, LEAGUE_COOPS, DERBY_TASKS, GROUP, LEAGUES, boardFor, ensureWeek, derbyAdd, derbyView, derbyClaim, leagueName };
