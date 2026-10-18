const fs = require('fs');
const files = process.argv.slice(2), agg = {};
for (const f of files) { const d = JSON.parse(fs.readFileSync(f)); for (const [p, st] of Object.entries(d.tabs || {})) { const a = agg[p] || (agg[p] = { cycles: 0, busy: 0, tabs: 0, subs: 0, acts: {}, combos: {} }); a.cycles += st.cycles; a.busy += st.busy; a.tabs += st.tabs; a.subs += st.subs; for (const [k, v] of Object.entries(st.acts)) a.acts[k] = (a.acts[k] || 0) + v; for (const [k, v] of Object.entries(st.combos)) a.combos[k] = (a.combos[k] || 0) + v; } }
for (const [p, a] of Object.entries(agg)) {
  const tot = Object.values(a.acts).reduce((x, y) => x + y, 0), share = Object.entries(a.acts).sort((x, y) => y[1] - x[1]).map(([k, v]) => k + ' ' + Math.round(v / tot * 100) + '%').join(', ');
  const combos = Object.entries(a.combos).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => k + ' ' + Math.round(v / a.busy * 100) + '%').join(', ');
  console.log('P' + p, '| checks with something to do', Math.round(a.busy / a.cycles * 100) + '%', '| tabs per check', (a.tabs / Math.max(1, a.busy)).toFixed(2), '| tab+subtab places', (a.subs / Math.max(1, a.busy)).toFixed(2));
  console.log('   actions:', share); console.log('   together:', combos);
}
