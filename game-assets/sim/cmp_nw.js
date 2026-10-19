/* before/after summary: node cmp_nw.js before1,before2,.. after1,after2,.. */
const fs = require('fs');
const load = (l) => l.split(',').map((f) => JSON.parse(fs.readFileSync(f)));
const [B, A] = [load(process.argv[2]), load(process.argv[3])];
const first = (d, p) => { const e = d.log.find(p); return e ? e.t / 60 : null; };
const rng = (ds, f) => { const v = ds.map(f).filter((x) => x != null); return v.length ? Math.min(...v).toFixed(0) + '–' + Math.max(...v).toFixed(0) : '-'; };
const rows = [
  ['Lessons done (min)', (d) => first(d, (e) => e.k === 'guide' && e.x.end)],
  ['First prestige (min)', (d) => first(d, (e) => e.k === 'prestige' && e.x === 1)],
  ['Prestige 2 (min)', (d) => first(d, (e) => e.k === 'prestige' && e.x === 2)],
  ['Prestige 3 (min)', (d) => first(d, (e) => e.k === 'prestige' && e.x === 3)],
  ['Pop-ups, first hour', (d) => d.log.filter((e) => e.k === 'modal' && e.t < 3600).length],
  ['Pop-ups, to P3', (d) => d.log.filter((e) => e.k === 'modal').length],
  ['Pop-up words, first hour', (d) => d.log.filter((e) => e.k === 'modal' && e.t < 3600).reduce((s, e) => s + e.x.w, 0)],
  ['Level-up pop-ups', (d) => d.log.filter((e) => e.k === 'modal' && /Congratulations/.test(e.x.ti)).length],
  ['Sale pop-ups', (d) => d.log.filter((e) => e.k === 'modal' && /^Sold to|Peaberry|Micro-lot/.test(e.x.ti)).length],
  ['Toasts per minute', (d) => d.log.filter((e) => e.k === 'toast').length / (d.log[d.log.length - 1].t / 60)],
  ['Most unlocks at one moment', (d) => { const g = {}; d.log.filter((e) => e.k === 'avail').forEach((e) => { const k = Math.floor(e.t / 30); g[k] = (g[k] || 0) + 1; }); return Math.max(0, ...Object.values(g)); }],
];
console.log('measure'.padEnd(30) + 'before'.padStart(12) + 'after'.padStart(12));
rows.forEach(([n, f]) => console.log(n.padEnd(30) + rng(B, f).padStart(12) + rng(A, f).padStart(12)));
console.log('\nunlock order after, run 1:'); A[0].log.filter((e) => e.k === 'avail').forEach((e) => console.log(String(Math.floor(e.t / 60)).padStart(4) + ':' + String(e.t % 60).padStart(2, '0'), 'L' + e.lv, 'P' + e.p, e.x));
console.log('\nquiet stretches over 8 min (after):'); A.forEach((d, i) => { const ev = d.log.filter((e) => ['level', 'avail', 'guide', 'prestige'].includes(e.k)).map((e) => e.t); const out = []; for (let j = 1; j < ev.length; j++) if (ev[j] - ev[j - 1] > 480) out.push(Math.round(ev[j - 1] / 60) + 'm +' + Math.round((ev[j] - ev[j - 1]) / 60)); console.log(i, out.join(', ')); });
console.log('\nfeature gaps (avail only) over 10 min (after):'); A.forEach((d, i) => { const ev = d.log.filter((e) => ['avail', 'guide', 'prestige', 'golden'].includes(e.k)).map((e) => e.t); const out = []; for (let j = 1; j < ev.length; j++) if (ev[j] - ev[j - 1] > 600) out.push(Math.round(ev[j - 1] / 60) + 'm +' + Math.round((ev[j] - ev[j - 1]) / 60)); console.log(i, out.join(', ')); });
