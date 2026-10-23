/* A bot that plays Beju Farm like an engaged, sensible player. Runs inside the sim build (window.__G). */
window.BOT = (function () {
  const G = window.__G, cv = document.getElementById('cv');
  /* where each action lives in the interface, to measure how much tab hopping a player would do */
  const LOCOF = (x) => { const a = x.split(':')[0];
    if (['hire', 'plant', 'bed', 'replantall', 'replantask', 'sellraw', 'mv', 'estbuy', 'ceremony', 'koi', 'age', 'unage', 'rake'].includes(a)) return 'farm:fields'; if (a === 'up') return 'farm:upgrades'; if (a === 'build') return 'farm:build';
    if (['mgr', 'master', 'foreman', 'agent', 'rule', 'train', 'hireroaster', 'emhire'].includes(a)) return 'farm:staff';
    if (['lot', 'cup', 'sell', 'deliver', 'toroast', 'sellall', 'cupall', 'reqfill', 'reqskip'].includes(a)) return 'mill';
    if (['roast', 'crack', 'sellbag', 'sellbags', 'roastfeed', 'rreq', 'binsell', 'blendask', 'blendwith'].includes(a)) return 'roast';
    if (['var', 'method', 'farm', 'research', 'tech'].includes(a)) return 'unlock'; if (['task', 'weekly', 'wtask'].includes(a)) return 'orders';
    if (['prestige', 'prestigeAsk', 'pickskin'].includes(a)) return 'ranks'; if (['decor', 'rbuy', 'buybskin', 'buychar', 'buyhat'].includes(a)) return 'shop'; return null; };
  const at = (loc) => { if (!loc) return; const T = B.tabs || (B.tabs = {}), p = G.S.prestige, st = T[p] || (T[p] = { cycles: 0, busy: 0, tabs: 0, subs: 0, acts: {}, combos: {}, cracks: 0 }); st.acts[loc] = (st.acts[loc] || 0) + 1; (B.cyc || (B.cyc = new Set())).add(loc); };
  const LOCKED = (loc) => { const S = G.S, m = loc && loc.split(':'); if (!m || !B.cfg.locks) return false;   /* cfg.locks: only use what the interface has opened */
    if (m[0] === 'farm' && m[1] !== 'fields') return !S.tabs.upgrades; if (m[0] === 'unlock') return !S.tabs.unlock; if (m[0] === 'shop') return !S.tabs.shop; if (m[0] === 'ranks') return !S.tabs.ranks; if (m[0] === 'roast') return !(G.roasteryOpen && G.roasteryOpen());
    if (m[0] === 'orders') return !S.tabs.orders && S.guide >= (G.GUIDE || []).length; return false; };
  const act = (s) => { if (LOCKED(LOCOF(s))) return; at(LOCOF(s)); const b = document.createElement('button'); b.dataset.act = s; b.style.display = 'none'; document.body.appendChild(b); b.click(); b.remove(); };
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
    at('farm:fields');
    const r = cv.getBoundingClientRect();
    const ripe = f.shrubs.filter((s) => s.p >= 1).slice(0, 2);
    ripe.forEach((s) => cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (s.x + 9) / G.W * r.width, clientY: r.top + (s.y + 11) / G.H * r.height })));
  }
  function mill() {
    const S = G.S;
    if (!(S.staff.foreman)) {
      for (let i = S.lots.length - 1; i >= 0; i--) { const l = S.lots[i]; if (l.left > 0) continue; const c = S.buyers && S.contracts.find((x) => G.fits(x, l)); act(c ? 'deliver:' + i + '.' + c.id : 'sell:' + i); }
      let g = 0;
      while (S.lots.length < G.racks() && G.stored() > 0 && g++ < 8) {
        const v = Object.keys(S.cherries).filter((x) => S.cherries[x] > 0).sort((a, b) => S.cherries[b] - S.cherries[a])[0];
        if (S.cherries[v] < Math.max(10, G.cap() * 0.2) && G.stored() < G.cap() * 0.85 && S.stats.lotsSold > 0) break;
        const want = S.buyers && S.contracts.find((c) => (!c.v || c.v === v) && c.method && S.methods[c.method] && c.have < c.kg);
        const best = Object.keys(G.METHODS).filter((k) => S.methods[k]).sort((a, b) => G.METHODS[b].mult - G.METHODS[a].mult)[0];
        const n = S.lots.length; act('mv:' + v); act('lot:' + (want ? want.method : best)); if (S.lots.length === n) break;
      }
    }
    S.tasks.forEach((t, i) => { if (t.have >= t.goal && !t.done) act('task:' + i); });
    ((S.wtasks || {}).list || []).forEach((t, i) => { if (t.have >= t.goal && !t.done) { act('wtask:' + i); B.wtasks = (B.wtasks || 0) + 1; } });   /* weekly tasks */
    const wk = S.weekly; if (!wk.claimed && wk.mine > 0 && Math.min(wk.target, wk.team + wk.mine) >= wk.target) act('weekly');
  }
  function knowhow() {
    const S = G.S; let guard = 0;
    while (guard++ < 10) {
      const c = [];
      const ok = (k) => !G.gateOK || G.gateOK(k);   /* unlocks that wait for a prestige */
      if (S.lastVar && !(S.planted || {})[S.lastVar]) { const v = S.lastVar, home = G.LOCS.find((l) => S.farms[l].unlocked && !S.dormant[l] && G.isNative && G.isNative(l, v)) || 'mogiana', back = S.loc; act('go:' + home); act('plant:1.' + v); act('go:' + back); }   /* plant the newest coffee, as the Unlock tab asks */
      G.VAR_ORDER.forEach((v) => { if (!S.vars[v] && ok('var:' + v)) c.push(['var:' + v, G.VAR[v].cost]); });   /* coffees open as their home farms do */
      const nv = G.VAR_ORDER.find((v) => !S.vars[v] && ok('var:' + v));
      Object.keys(G.METHODS).forEach((m) => { if (!S.methods[m] && G.METHODS[m].cost && ok('method:' + m)) c.push(['method:' + m, G.METHODS[m].cost]); });
      G.LOCS.forEach((l) => { if (G.canOpen(l)) c.push(['farm:' + l, G.FARM_COST[l]]); });
      if (G.trainCost) { ['foreman', 'agent', 'roaster'].forEach((w) => { if (S.staff[w] && G.trainLv(w) < 20) c.push(['train:' + w, G.trainCost(w)]); }); if (S.farms[S.loc].manager && G.trainLv('mgr', S.loc) < 20) c.push(['train:mgr', G.trainCost('mgr', S.loc)]); }   /* staff training, in know-how */
      (G.TECH || []).forEach((t) => { if (!(S.tech || {})[t.id] && G.techOpen(t)) c.push(['tech:' + t.id, t.cost]); });   /* techniques: know-how upgrades kept for good */
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
        if (!f.manager && l !== 'osaka' && (!G.mgrOK || G.mgrOK())) c.push([l, 'mgr', G.MANAGER_COST(l)]);
        if (G.masterCost && f.manager) c.push([l, 'master', G.masterCost(l)]);
        if (!f.field && l !== 'osaka') c.push([l, 'up:field', G.UP.field.cost()]);
      });
      ['storage', 'pickers', 'racks', 'hearts'].forEach((k) => { if (S.lv[k] < G.UP[k].max && !(k === 'storage' && G.STORE && G.STORE[S.lv[k]] && G.STORE[S.lv[k]].p > S.prestige)) c.push([S.loc, 'up:' + k, G.UP[k].cost(S.lv[k])]); });
      if (G.trainCost && S.prestige >= 5) { G.LOCS.forEach((l) => { if (live(l) && S.farms[l].manager && G.trainLv('mgr', l) < 10) c.push([l, 'train:mgr', G.trainCost('mgr', l)]); }); ['foreman', 'agent', 'roaster'].forEach((w) => { if (S.staff[w] && G.trainLv(w) < 10) c.push([S.loc, 'train:' + w, G.trainCost(w)]); }); }
      if (G.roasterOK && !S.staff.roaster && G.roasterOK()) c.push([S.loc, 'hireroaster', G.ROASTER_COST]);   /* the late staff */
      if (G.EM_LOCS) G.EM_LOCS.forEach((l) => { if (G.emCan(l)) c.push([S.loc, 'emhire:' + l, G.emHire(l)]); else if (G.emHired(l) && G.trainLv('em_' + l) < 10 && S.prestige >= 5) c.push([S.loc, 'train:em_' + l, G.trainCost('em_' + l)]); });   /* estate managers */   /* staff training */
      if (G.estateNext && !B.cfg.noEstate) G.LOCS.forEach((l) => { const n = G.estateNext(l); if (n && !n.why && S.points >= n.k) c.push([l, 'estbuy:' + l, n.c]); });   /* estate projects */
      if (!S.staff.foreman) { if (!G.foremanOK || G.foremanOK()) c.push([S.loc, 'foreman', G.FOREMAN_COST]); } else if (!S.staff.agent && (!G.agentOK || G.agentOK())) c.push([S.loc, 'agent', G.AGENT_COST]);
      c.sort((a, b) => a[2] - b[2]);
      if (H()) {
        Object.keys(G.DECOR).forEach((k) => { if (S.decor[k] === undefined) c.push([S.loc, 'decor:' + k, G.DECOR[k].cost]); });
        if (G.RCOS && S.rcos && !B.cfg.noCos && G.roasteryOpen && G.roasteryOpen()) G.RCOS.forEach((x) => { if (!S.rcos.own[x.id] && x.src.coins && (!B.cfg.cosShare || rnd() < B.cfg.cosShare)) c.push([S.loc, 'rbuy:' + x.id, x.src.coins]); });   /* roastery cosmetics in Shop > Roastery */
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
    if (S.request) { const i = S.lots.findIndex((l) => l.v === S.request.v && l.method === S.request.m); if (i > -1 && !S.lots[i].cupped) act('cup:' + i); act('reqfill'); closeAll(); }   /* fills a regular's request when the lot is ready */
    const g = G.golden; if (g && H() && !g.seen) { g.seen = true; g.miss = rnd() < 0.45; }
    if (g && !(H() && g.miss)) { if (S.loc !== g.loc) act('go:' + g.loc); const s = S.farms[S.loc].shrubs[g.i], r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (s.x + 9) / G.W * r.width, clientY: r.top + (s.y + 11) / G.H * r.height })); }
  }
  function estate() {   /* the estate projects' tap-in moments: the daily ceremony, the koi and the barrel cellar */
    const S = G.S, E = S.estate; if (!E || !G.estOn) return;
    if (G.estOn('gedeo', 2) && !G.cerOn() && (!H() || rnd() < 0.05)) { const n0 = E.cerDay; act('ceremony'); closeAll(); if (E.cerDay !== n0) B.cer = (B.cer || 0) + 1; }
    if (G.rakeReady && G.rakeReady() && (!H() || rnd() < 0.1)) { act('rake'); closeAll(); }
    if (G.estOn('osaka', 1) && Date.now() - (E.koiAt || 0) >= 3 * 3600e3 && (!H() || rnd() < 0.1)) { act('koi'); closeAll(); B.koi = (B.koi || 0) + 1; }
    E.cellar.forEach((c, j) => { if (G.agedCup(c) >= 3) { act('unage:' + j); closeAll(); } });
    if (E.cellar.length < G.cellarSlots() && (!H() || rnd() < 0.2)) { const i = S.lots.reduce((bi, l, i) => (l.left <= 0 && (bi < 0 || G.saleFor(l.v, l.method, l.kg).coins > G.saleFor(S.lots[bi].v, S.lots[bi].method, S.lots[bi].kg).coins) ? i : bi), -1); if (i > -1) { act('age:' + i); closeAll(); B.aged = (B.aged || 0) + 1; } }
  }
  function roast() {   /* the roastery: keep it fed, roast (usually the best roast), catch the crack, sell bags to the buyer who wants them */
    if (!G.roasteryOpen || !G.roasteryOpen() || B.cfg.noRoast) return; const S = G.S, R = S.roastery;
    if (S.staff.foreman && R.feed === 0) act('roastfeed:4');   /* foreman stocking is on by default; switch it back on if it was turned off */
    if (!S.staff.foreman) S.lots.forEach((l, i) => { if (l.left <= 0 && Object.keys(R.beans).length < 2 && i === 0) act('toroast:' + i); });
    while (R.roasters.length < G.roasterCount() && Object.keys(R.beans).length) {
      const k = Object.keys(R.beans).sort((a, b) => R.beans[b].kg - R.beans[a].kg)[0], [v, m] = k.split('.'), best = G.bestRoast(v, m);
      const p = H() && rnd() < 0.25 ? ['light', 'medium', 'dark'][Math.floor(rnd() * 3)] : best; const n = R.roasters.length; act('roast:' + k + '|' + p); if (R.roasters.length === n) break;
    }
    R.roasters.forEach((r, i) => { if (!r.crack && G.inCrack(r) && !r.tried) { r.tried = true; if (!H() || rnd() < Math.min(0.9, 0.3 + (r.cw || 0.16) * r.dur / 1000 * 0.04)) act('crack:' + i);   /* tighter windows are missed more often */ } });
    for (let i = R.bags.length - 1; i >= 0; i--) { const b = R.bags[i], k = G.bestBuyer ? G.bestBuyer(b) : Object.keys(G.RBUYERS).find((x) => b.blend || G.RBUYERS[x].wants === b.profile) || 'konbini'; const c0 = S.coins; act('sellbag:' + i + '.' + k); B.roastCoins = (B.roastCoins || 0) + (S.coins - c0); B.roastSold = (B.roastSold || 0) + 1; }
  }
  function cycleEnd() {   /* one check of the game: which tabs and sub-tabs it needed */
    const set = B.cyc || new Set(), p = G.S.prestige, T = B.tabs || (B.tabs = {}), st = T[p] || (T[p] = { cycles: 0, busy: 0, tabs: 0, subs: 0, acts: {}, combos: {}, cracks: 0 });
    st.cycles += 1; if (set.size) { st.busy += 1; const mains = [...new Set([...set].map((x) => x.split(':')[0]))].sort(); st.tabs += mains.length; st.subs += set.size; st.combos[mains.join('+')] = (st.combos[mains.join('+')] || 0) + 1; }
    B.cyc = new Set();
  }
  function lessons() {   /* follow Rosa's lessons the way a new player would: open the tab she points at, cup the lot, plant the new coffee */
    const S = G.S, g = G.GUIDE && G.GUIDE[S.guide]; if (!g || (g.when && !g.when())) return;
    if (g.ev && g.ev.startsWith('tab:')) { G.setTab(g.ev.slice(4)); G.setTab('farm'); }
    if (g.ev === 'cup') { const i = S.lots.findIndex((l) => !l.cupped); if (i > -1) act('cup:' + i); }
    if (g.ev === 'plant' && S.vars.catuai) { const home = S.loc; act('go:mogiana'); act('plant:1.catuai'); act('go:' + home); }
    if (g.ev === 'var' && !S.vars.catuai) act('var:catuai');
  }
  function decide() { closeAll(); lessons(); G.checkIn(); G.checkTabs(); tap(); active(); mill(); estate(); roast(); knowhow(); coins(); prestige(); closeAll(); cycleEnd(); }
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
