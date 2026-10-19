/* the timeline and pop-up density charts for the review page, from one human_log run */
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2])), out = process.argv[3];
const end = 135, W = 760, L = 112, R = 14, X = (m) => L + (m / end) * (W - L - R);
const lanes = [['lesson', 'Lessons'], ['tab', 'Tabs'], ['unlock', 'Unlocks'], ['staff', 'Staff and perks'], ['prestige', 'Prestige']];
const laneY = (k) => 34 + lanes.findIndex((l) => l[0] === k) * 40;
const ev = [];
const name = { 'tab:upgrades': 'Upgrades', 'tab:unlock': 'Unlock', 'tab:orders': 'Daily', 'tab:shop': 'Shop', 'tab:ranks': 'Ranks', 'tab:looks': 'Looks', 'tab:roast': 'Roastery' };
d.log.forEach((e) => {
  const m = e.t / 60;
  if (e.k === 'guide' && !e.x.end) ev.push(['lesson', m, String(e.x.n + 1)]);
  if (e.k === 'guide' && e.x.end) ev.push(['lesson', m, 'done']);
  if (e.k === 'avail' && name[e.x]) ev.push(['tab', m, name[e.x]]);
  if (e.k === 'avail' && /^(var|method|farm):/.test(e.x)) ev.push(['unlock', m, e.x.split(':')[0]]);
  if (e.k === 'avail' && ['buyers', 'weekly', 'mgr', 'foreman', 'agent', 'cupall', 'replantall'].includes(e.x)) ev.push(['staff', m, { buyers: 'Buyers', weekly: 'Weekly', mgr: 'Manager', foreman: 'Foreman', agent: 'Agent', cupall: 'Cup all', replantall: 'Replant all' }[e.x]]);
  if (e.k === 'prestige') ev.push(['prestige', m, 'P' + e.x]);
  if (e.k === 'golden') ev.push(['staff', m, 'Golden bush']);
});
const walk = d.log.find((e) => e.k === 'modal' && e.x.ti === 'Rosa · Prestige'); if (walk) ev.push(['prestige', walk.t / 60, 'walk']);
const H = 34 + lanes.length * 40 + 24;
let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="When each feature arrives, minute by minute, from a fresh save to prestige 3"><g class="grid">';
for (let m = 0; m <= 130; m += 10) s += '<line x1="' + X(m).toFixed(1) + '" x2="' + X(m).toFixed(1) + '" y1="18" y2="' + (H - 24) + '"/><text x="' + X(m).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + m + '</text>';
s += '</g>';
let at = 0; d.sessions.forEach((x) => { const a = at / 60, b = x.at / 60; s += '<rect class="sess" x="' + X(a).toFixed(1) + '" y="14" width="' + (X(b) - X(a)).toFixed(1) + '" height="4" rx="2"/>'; at = x.at; });
d.sessions.slice(0, -1).forEach((x) => { s += '<text class="away" x="' + X(x.at / 60).toFixed(1) + '" y="11" text-anchor="middle">' + x.away + 'h away</text>'; });
lanes.forEach(([k, t]) => { s += '<text class="lane" x="0" y="' + (laneY(k) + 4) + '">' + t + '</text><line class="laneline" x1="' + L + '" x2="' + (W - R) + '" y1="' + laneY(k) + '" y2="' + laneY(k) + '"/>'; });
const sorted = ev.sort((a, b) => a[1] - b[1]);
sorted.forEach(([k, m, t]) => { s += '<circle class="ev ' + k + '" cx="' + X(m).toFixed(1) + '" cy="' + laneY(k) + '" r="4.5"><title>' + Math.floor(m) + ' min: ' + t + '</title></circle>'; });
const lessonLbl = { '1': 'steps 1–7', done: '8–9, lessons done' };
const groups = [];   /* labels close together in a lane share one label */
sorted.forEach(([k, m, t]) => {
  if (k === 'unlock') return; if (k === 'lesson') { if (!lessonLbl[t]) return; t = lessonLbl[t]; }
  const g = groups.find((x) => x.k === k && m - x.last < 3); if (g) { if (!g.t.includes(t)) g.t.push(t); g.last = m; } else groups.push({ k, m, last: m, t: [t] });
});
const taken = { };
groups.forEach((g) => {
  const x = X(g.m), y = laneY(g.k), txt = g.t.join(' + '), w = txt.length * 5.9 + 8, row = taken[g.k] || (taken[g.k] = { up: [], down: [] });
  const free = (side) => row[side].every(([a, b]) => x + w / 2 < a || x - w / 2 > b);
  const side = free('up') ? 'up' : 'down'; row[side].push([x - w / 2, x + w / 2]);
  const anchor = x - w / 2 < L ? 'start' : x + w / 2 > W - R ? 'end' : 'middle', tx = anchor === 'start' ? Math.max(L, x - 6) : anchor === 'end' ? Math.min(W - R, x + 6) : x;
  s += '<text class="evl" x="' + tx.toFixed(1) + '" y="' + (y + (side === 'up' ? -9 : 16)) + '" text-anchor="' + anchor + '">' + txt + '</text>';
});
s += '</svg>';
/* pop-ups per 5 minutes */
const B = 5, n = Math.ceil(end / B), bars = Array.from({ length: n }, () => [0, 0]);
d.log.forEach((e) => { if (e.k !== 'modal') return; const i = Math.floor(e.t / 60 / B); if (i < n) bars[i][/^Sold to/.test(e.x.ti) ? 1 : 0] += 1; });
const max = Math.max(...bars.map((b) => b[0] + b[1])), top = Math.ceil(max / 5) * 5, H2 = 170, Y = (v) => 14 + (1 - v / top) * (H2 - 44);
let s2 = '<svg viewBox="0 0 ' + W + ' ' + H2 + '" role="img" aria-label="Pop-ups per five minutes of play"><g class="grid">';
for (let v = 0; v <= top; v += 5) s2 += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>';
for (let m = 0; m <= 130; m += 10) s2 += '<text x="' + X(m).toFixed(1) + '" y="' + (H2 - 10) + '" text-anchor="middle">' + m + '</text>';
s2 += '</g>';
const bw = (X(B) - X(0)) * 0.78;
bars.forEach(([o, sale], i) => { const x = X(i * B) + (X(B) - X(0)) * 0.11; s2 += '<rect class="b-sale" x="' + x.toFixed(1) + '" y="' + Y(o + sale).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(o) - Y(o + sale)).toFixed(1) + '"><title>' + (i * B) + '-' + (i * B + B) + ' min: ' + sale + ' sale pop-ups</title></rect><rect class="b-other" x="' + x.toFixed(1) + '" y="' + Y(o).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(o)).toFixed(1) + '"><title>' + (i * B) + '-' + (i * B + B) + ' min: ' + o + ' other pop-ups</title></rect>'; });
s2 += '<text class="lane" x="0" y="' + (Y(top / 2) + 4).toFixed(1) + '">per 5 min</text></svg>';
fs.writeFileSync(out, JSON.stringify({ timeline: s, popups: s2, max }));
console.log('ok', ev.length, 'events, max', max);
