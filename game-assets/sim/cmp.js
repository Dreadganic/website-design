const fs = require('fs');
const h = (t) => (t / 3600).toFixed(1);
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(f));
  const pt = d.events.filter((e) => e.e.startsWith('PRESTIGE')).map((e) => h(e.t));
  const osaka = d.events.find((e) => /osaka/.test(e.e)); const farm = (n) => (d.events.find((e) => e.e === 'unlock farm:' + n) || {}).t;
  const S = d.final, w = Object.fromEntries(Object.keys(S.farms).filter(k => S.farms[k].unlocked).map(k => [k.slice(0, 4), S.farms[k].workers.length]));
  const end = d.snaps.at(-1).t, days = ((end + d.awayH * 3600) / 86400).toFixed(1);
  console.log(f.padEnd(11), 'play', h(end) + 'h', d.mode === 'casual' ? 'calendar ' + days + 'd' : '', '| prestiges at', pt.join(', ') || '-', '| osaka', osaka ? h(osaka.t) + 'h' : 'no', '| toba', farm('toba') ? h(farm('toba')) : '-', 'turr', farm('turrialba') ? h(farm('turrialba')) : '-', '| workers', JSON.stringify(w), '| coins', Math.round(S.coins), 'kh', Math.round(S.points), 'cranes', S.cranes, '| gaps>5m', d.gaps.filter(g => g[1] > 300).length, d.errs.length ? 'ERR ' + d.errs[0] : '');
}
