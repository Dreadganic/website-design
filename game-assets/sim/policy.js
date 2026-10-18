/* A bot that plays Beju Farm like an engaged, sensible player. Runs inside the sim build (window.__G). */
window.BOT = (function () {
  const G = window.__G, cv = document.getElementById('cv');
  const act = (s) => { const b = document.createElement('button'); b.dataset.act = s; b.style.display = 'none'; document.body.appendChild(b); b.click(); b.remove(); };
  const B = { t: 0, events: [], snaps: [], buys: [], taps: true, lastBuy: 0, gaps: [], cfg: {} };
  let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   /* cfg.human: a seeded coin-flip so runs repeat */
  const H = () => !!B.cfg.human;
  const log = (e) => B.events.push({ t: Math.round(B.t), lv: G.level(), p: G.S.prestige, e });
  const closeAll = () => { let g = 0; while (!document.getElementById('modal').hidden && g++ < 20) G.closeModal(); };
  const score = (v) => G.VAR[v].kg * G.VAR[v].speed * G.VAR[v].value;
  const live = (l) => G.S.farms[l].unlocked && !G.S.dormant[l];
  function bought(what, cost, cur) { B.buys.push({ t: B.t, what, cost, cur }); if (B.t - B.lastBuy > 120) B.gaps.push([Math.round(B.lastBuy), Math.round(B.t - B.lastBuy)]); B.lastBuy = B.t; }
  function tap() {
    const S = G.S, f = S.farms[S.loc]; if (!B.taps || S.hearts <= 0 || G.stored() >= G.cap()) return;
    const r = cv.getBoundingClientRect();
    const ripe = f.shrubs.filter((s) => s.p >= 1).slice(0, 2);
    ripe.forEach((s) => cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (s.x + 9) / G.W * r.width, clientY: r.top + (s.y + 11) / G.H * r.height })));
  }
  function mill() {
    const S = G.S;
    if (!(S.staff.foreman)) {
      for (let i = S.lots.length - 1; i >= 0; i--) { const l = S.lots[i]; if (l.left > 0) continue; const c = S.tabs.orders && S.contracts.find((x) => G.fits(x, l)); act(c ? 'deliver:' + i + '.' + c.id : 'sell:' + i); }
      let g = 0;
      while (S.lots.length < G.racks() && G.stored() > 0 && g++ < 8) {
        const v = Object.keys(S.cherries).filter((x) => S.cherries[x] > 0).sort((a, b) => S.cherries[b] - S.cherries[a])[0];
        if (S.cherries[v] < Math.max(10, G.cap() * 0.2) && G.stored() < G.cap() * 0.85 && S.stats.lotsSold > 0) break;
        const want = S.tabs.orders && S.contracts.find((c) => (!c.v || c.v === v) && c.method && S.methods[c.method] && c.have < c.kg);
        const best = Object.keys(G.METHODS).filter((k) => S.methods[k]).sort((a, b) => G.METHODS[b].mult - G.METHODS[a].mult)[0];
        const n = S.lots.length; act('mv:' + v); act('lot:' + (want ? want.method : best)); if (S.lots.length === n) break;
      }
    }
    S.tasks.forEach((t, i) => { if (t.have >= t.goal && !t.done) act('task:' + i); });
    const wk = S.weekly; if (!wk.claimed && wk.mine > 0 && Math.min(wk.target, wk.team + wk.mine) >= wk.target) act('weekly');
  }
  function knowhow() {
    const S = G.S; let guard = 0;
    while (guard++ < 10) {
      const c = [];
      const ok = (k) => !G.gateOK || G.gateOK(k);   /* unlocks that wait for a prestige */
      G.VAR_ORDER.forEach((v) => { if (!S.vars[v] && v !== 'geisha' && ok('var:' + v)) c.push(['var:' + v, G.VAR[v].cost]); });   /* coffees open as their home farms do */
      const nv = G.VAR_ORDER.find((v) => !S.vars[v] && v !== 'geisha' && ok('var:' + v));
      Object.keys(G.METHODS).forEach((m) => { if (!S.methods[m] && G.METHODS[m].cost && ok('method:' + m)) c.push(['method:' + m, G.METHODS[m].cost]); });
      G.LOCS.forEach((l) => { if (G.canOpen(l)) c.push(['farm:' + l, G.FARM_COST[l]]); });
      if (G.researchCost && !nv) c.push(['research', G.researchCost()]);
      c.sort((a, b) => a[1] - b[1]);
      if (!c.length || c[0][1] > S.points) break;
      if (H()) {   /* a human doesn't always spend at once, and doesn't always pick the cheapest */
        if (rnd() < 0.5) break;
        const aff = c.filter((x) => x[1] <= S.points); const pick = aff[Math.floor(rnd() * aff.length)]; c.splice(c.indexOf(pick), 1); c.unshift(pick);
      }
      const before = S.points; act(c[0][0]); closeAll(); if (S.points === before) break;
      bought(c[0][0], c[0][1], 'kh'); if (c[0][0] !== 'research') log('unlock ' + c[0][0]);
      if (c[0][0].startsWith('var:')) replant();
    }
    if (!B.cfg.noOsaka && !S.farms.osaka.unlocked && S.cranes >= 60) { act('farm:osaka'); closeAll(); if (S.farms.osaka.unlocked) { log('unlock osaka (cranes)'); replant(); } }
  }
  function replant() {
    if (H() && rnd() < 0.5) return;   /* sometimes keeps the old coffee for a while */
    const S = G.S, home = S.loc, owned = G.VAR_ORDER.filter((v) => S.vars[v]), best = owned.sort((a, b) => score(b) - score(a))[0];
    G.LOCS.forEach((l) => { if (!S.farms[l].unlocked || l === 'osaka') return; if (H() && l !== home && rnd() < 0.6) return; act('go:' + l);
      const nat = G.isNative && B.cfg.native !== false ? owned.filter((v) => G.isNative(l, v)).sort((a, b) => score(b) - score(a))[0] : null;   /* keep field 1 native for the terroir bonus */
      S.farms[l].beds.forEach((v, b) => { const want = b === 0 && nat ? nat : best; if (v !== want && (want === nat || score(want) > score(v) * 1.15)) act('plant:' + b + '.' + want); }); });
    act('go:' + home); closeAll();
  }
  function coins() {
    const S = G.S; let guard = 0;
    while (guard++ < 12) {
      const c = [];
      G.LOCS.forEach((l) => {
        if (!live(l)) return; const f = S.farms[l];
        if (f.workers.length < G.maxPickers(f)) c.push([l, 'hire', G.hireCost(f)]);
        G.BUILD_ORDER.forEach((k) => { if ((f.build[k] || 0) < (G.buildMax ? Math.min(G.buildMax(), B.cfg.maxBuild || 10) : (B.cfg.maxBuild || 3))) c.push([l, 'build:' + k, G.buildCost(l, k)]); });
        if (!f.manager && l !== 'osaka') c.push([l, 'mgr', G.MANAGER_COST(l)]);
        if (G.masterCost && f.manager) c.push([l, 'master', G.masterCost(l)]);
        if (!f.field && l !== 'osaka') c.push([l, 'up:field', G.UP.field.cost()]);
      });
      ['storage', 'pickers', 'racks', 'hearts'].forEach((k) => { if (S.lv[k] < G.UP[k].max) c.push([S.loc, 'up:' + k, G.UP[k].cost(S.lv[k])]); });
      if (!S.staff.foreman) c.push([S.loc, 'foreman', G.FOREMAN_COST]); else if (!S.staff.agent) c.push([S.loc, 'agent', G.AGENT_COST]);
      c.sort((a, b) => a[2] - b[2]);
      if (H()) {
        Object.keys(G.DECOR).forEach((k) => { if (S.decor[k] === undefined) c.push([S.loc, 'decor:' + k, G.DECOR[k].cost]); });
        if (rnd() < 0.35) break;   /* saving up, or just not looking at the Build tab */
        const aff = c.filter((x) => x[2] <= S.coins); if (!aff.length) break;
        const here = aff.filter((x) => x[0] === S.loc), pool = here.length && rnd() < 0.6 ? here : aff;   /* mostly upgrades the farm on screen */
        const pick = pool[Math.floor(rnd() * pool.length)]; c.splice(c.indexOf(pick), 1); c.unshift(pick);
      }
      if (!c.length || c[0][2] > S.coins) break;
      const [l, what, cost] = c[0], home = S.loc, before = S.coins;
      if (l !== S.loc) act('go:' + l);
      act(what); closeAll(); if (S.loc !== home) act('go:' + home);
      if (S.coins === before) break;
      bought(l + ' ' + what, cost, 'coins');
      if (['foreman', 'agent', 'mgr', 'up:storage', 'up:racks', 'up:field'].includes(what) || what.startsWith('build:') && cost > 5000) log('buy ' + l + ' ' + what + ' (' + cost + ')');
    }
  }
  function prestige() {
    const S = G.S;
    if (G.level() >= G.prestigeNeed() && H()) { B.readyAt = B.readyAt || B.t; if (B.t - B.readyAt < 600) return; }   /* thinks it over for ten minutes */
    if (G.level() >= G.prestigeNeed() && (!B.cfg.maxP || S.prestige < B.cfg.maxP)) { B.readyAt = 0;
      knowhow(); act('prestigeAsk'); act('prestige'); closeAll();
      const sk = [0, 1, 2, 3, 4, 5, 6, 7].find((i) => !S.skins[i]); if (S.skinPicks && sk !== undefined) act('pickskin:' + sk);
      closeAll(); log('PRESTIGE ' + S.prestige + ' (dormant: ' + Object.keys(S.dormant).join(',') + ')');
    }
  }
  function active() {   /* only when cfg.active: cup every lot by hand and tap golden bushes */
    if (!B.cfg.active) return; const S = G.S;
    S.lots.forEach((l, i) => { if (!l.cupped && (!H() || rnd() < 0.15)) act('cup:' + i); });
    const g = G.golden; if (g && H() && !g.seen) { g.seen = true; g.miss = rnd() < 0.45; }
    if (g && !(H() && g.miss)) { if (S.loc !== g.loc) act('go:' + g.loc); const s = S.farms[S.loc].shrubs[g.i], r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (s.x + 9) / G.W * r.width, clientY: r.top + (s.y + 11) / G.H * r.height })); }
  }
  function decide() { closeAll(); G.checkIn(); G.checkTabs(); tap(); active(); mill(); knowhow(); coins(); prestige(); closeAll(); }
  function snap() {
    const S = G.S;
    B.snaps.push({ t: Math.round(B.t), lv: G.level(), xp: Math.round(S.xp), p: S.prestige, coins: Math.round(S.coins), kh: Math.round(S.points), cranes: S.cranes, farms: G.LOCS.filter(live).length, workers: G.totalWorkers(), lots: S.stats.lotsSold, contracts: S.stats.contracts || 0, cap: G.cap(), racks: G.racks(), stored: Math.round(G.stored()), day: S.day });
  }
  B.run = function (seconds, step) {   /* advance the game by `seconds`, deciding every `step` seconds */
    step = step || 2; const end = B.t + seconds; let nextD = B.t, nextS = Math.floor(B.t / 60) * 60 + 60;
    while (B.t < end) {
      G.tick(0.25); B.t += 0.25; window.__clock(0.25);
      if (B.t >= nextD) { decide(); nextD = B.t + step; }
      if (B.t >= nextS) { snap(); nextS += 60; }
    }
    return { t: B.t, lv: G.level(), p: G.S.prestige };
  };
  B.away = function (hours) { window.__clock(hours * 3600); B.awayH = (B.awayH || 0) + hours; G.away(hours); closeAll(); log('away ' + hours + 'h'); };
  B.G = G;
  return B;
})();
