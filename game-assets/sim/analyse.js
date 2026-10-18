const d = require('./' + process.argv[2]);
const m = (t) => (t / 60).toFixed(0) + 'm';
const ev = d.events.filter((e) => !/^away/.test(e.e));
console.log('PLAY', d.playH.toFixed(1), 'h in', d.sessions.length, 'sessions; real days ≈', (d.sessions.reduce((a, s) => a + s.mins / 60 + s.away, 0) / 24).toFixed(1));
// runs
let runStart = 0; const runs = [];
ev.forEach((e) => { if (/PRESTIGE/.test(e.e)) { runs.push([runStart, e.t]); runStart = e.t; } });
console.log('RUNS (play time):', runs.map(([a, b], i) => 'P' + i + '→P' + (i + 1) + ' ' + m(b - a)).join(' | '));
console.log('\nUNLOCKS:'); ev.filter((e) => /unlock|PRESTIGE|buy .*(mgr|foreman|agent|field)/.test(e.e)).forEach((e) => console.log(' ', m(e.t).padStart(5), 'P' + e.p, 'lv' + String(e.lv).padEnd(3), e.e));
// cadence
const buys = d.buys.slice().sort((a, b) => a.t - b.t), gaps = [];
for (let i = 1; i < buys.length; i++) gaps.push([buys[i - 1].t, buys[i].t - buys[i - 1].t]);
const big = gaps.filter((g) => g[1] > 600).sort((a, b) => b[1] - a[1]);
console.log('\nPURCHASES', buys.length, '(coins', buys.filter((b) => b.cur === 'coins').length, ', know-how', buys.filter((b) => b.cur === 'kh').length + ')');
const perRun = runs.concat([[runStart, Infinity]]).map(([a, b], i) => { const n = buys.filter((x) => x.t >= a && x.t < b); const len = Math.min(b, d.farms[d.farms.length - 1].t) - a; return 'P' + i + ': ' + n.length + ' buys, one every ' + (len / Math.max(1, n.length) / 60).toFixed(1) + ' min'; });
console.log(perRun.join(' | '));
console.log('gaps over 10 min of play with nothing bought:', big.length, big.slice(0, 8).map((g) => 'at ' + m(g[0]) + ' for ' + m(g[1])).join(', '));
// farm opens: state of earlier farms just before
console.log('\nFARM OPENS (state of the farms you already had):');
ev.filter((e) => /unlock farm:/.test(e.e)).forEach((e) => {
  const s = d.farms.filter((f) => f.t <= e.t + 1).pop(); if (!s) return;
  console.log(' ', m(e.t), 'P' + e.p, e.e.replace('unlock ', ''), '→', s.f.map((f) => f.l + (f.asleep ? '(asleep)' : '') + ' pickers ' + f.w + '/' + f.max + ' bld ' + f.b + '/30' + (f.mgr ? ' mgr' : '') + (f.m ? ' mast' + f.m : '') + (f.field ? ' 4th' : '')).join('; '));
});
const last = d.farms[d.farms.length - 1];
console.log('\nEND', 'P' + last.p, 'lv' + last.lv, 'coins', last.coins, 'kh', last.kh, 'racks', last.racks, 'cap', last.cap);
console.log(' ', last.f.map((f) => f.l + ' pickers ' + f.w + '/' + f.max + ' bld ' + f.b + '/30' + (f.mgr ? ' mgr' : '') + ' mast' + f.m).join('\n  '));
// coins hoard at session ends
const ends = []; let acc = 0; d.sessions.forEach((s) => { acc += s.mins * 60; const f = d.farms.filter((x) => x.t <= acc).pop(); if (f) ends.push(f.coins); });
console.log('\ncoins on hand at session ends (every 4th):', ends.filter((_, i) => i % 4 === 0).join(', '));
const decor = buys.filter((b) => /decor/.test(b.what)).map((b) => m(b.t) + ' ' + b.what.split(' ')[1]); console.log('decor bought:', decor.join(', '));
