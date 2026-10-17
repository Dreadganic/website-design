const d = require('./' + process.argv[2]);
const h = (t) => (t / 3600).toFixed(2) + 'h';
console.log('MODE', d.mode, 'end', h(d.snaps.at(-1).t), 'buys', d.buys, 'final prestige', d.final.prestige);
d.events.forEach((e) => { if (/PRESTIGE|farm:|osaka|foreman|agent|mgr|var:|method:/.test(e.e)) console.log(h(e.t), 'lv' + e.lv, 'P' + e.p, e.e); });
// level timeline
let lastLv = 0, lastP = -1; const lv = [];
d.snaps.forEach((s) => { if (s.lv !== lastLv || s.p !== lastP) { lv.push(`${h(s.t)} P${s.p} L${s.lv}`); lastLv = s.lv; lastP = s.p; } });
console.log('LEVELS:', lv.join(' | '));
console.log('LONG GAPS (>2min without a purchase):', d.gaps.filter(g => g[1] > 300).map(g => h(g[0]) + '+' + Math.round(g[1] / 60) + 'm').join(' '));
const S = d.final; console.log('FINAL', JSON.stringify({ coins: Math.round(S.coins), kh: S.points, cranes: S.cranes, lv: S.lv, vars: Object.keys(S.vars), methods: Object.keys(S.methods), staff: S.staff, day: S.day, farms: Object.keys(S.farms).filter(k => S.farms[k].unlocked), workers: Object.fromEntries(Object.keys(S.farms).map(k => [k, S.farms[k].workers.length])), build: Object.fromEntries(Object.keys(S.farms).map(k => [k, S.farms[k].build])) }));
// income per hour by window
const w = 1800; for (let i = 0; i < d.snaps.length; i += 30) { const a = d.snaps[i], b = d.snaps[Math.min(d.snaps.length - 1, i + 30)]; if (!b || b === a) break; console.log(`${h(a.t)}-${h(b.t)} P${a.p}->${b.p} L${a.lv}->${b.lv} coins ${a.coins}->${b.coins} xp/h ${Math.round((b.xp - a.xp + (b.p > a.p ? a.xp : 0)) / ((b.t - a.t) / 3600))} workers ${b.workers} farms ${b.farms} stored ${b.stored}/${b.cap} racks ${b.racks} contracts ${b.contracts}`); }
