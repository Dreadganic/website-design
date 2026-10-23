/* prints the playthrough as a readable timeline: lessons and walks with where their arrows went, every window and what its button did */
const d = require(require('path').resolve(process.argv[2]));
const where = (o) => o ? (o.tab || '?') + (o.sheet ? (o.full ? ' (full)' : ' (half)') : ' (map)') : '';
let p = -1;
d.log.forEach((e) => {
  if (e.kind === 'prestige' || (e.p !== undefined && e.p !== p && e.kind !== 'issue')) { if (e.p !== undefined && e.p !== p) { p = e.p; console.log('\n===== PRESTIGE ' + p + ' ====='); } }
  const at = String(e.t).padStart(4) + 's ' + (e.lv !== undefined ? 'Lv' + String(e.lv).padEnd(3) : '      ');
  if (e.kind === 'step') console.log(at, 'STEP  ', e.step, '|', e.text);
  else if (e.kind === 'arrow') console.log(at, '  arrow →', e.target ? e.target.desc + ' [' + (e.target.i + 1) + '/' + e.target.n + ']' : 'NOTHING', e.arrow ? '' : '(arrow hidden)', e.cover && e.cover.length ? 'COVER ' + e.cover.join('; ') : '', '| screen', where(e));
  else if (e.kind === 'tap') console.log(at, '  tap', e.on, '→', e.result, '| now', where(e));
  else if (e.kind === 'window') console.log(at, 'WINDOW', JSON.stringify(e.text.slice(0, 110)), '[' + e.buttons.join(' / ') + '] pressed', JSON.stringify(e.pressed), '→', where(e.after) + (e.after.mode ? ' mode ' + e.after.mode : '') + (e.queued ? ' (' + e.queued + ' more queued)' : '') + (e.during ? ' DURING ' + e.during : ''));
  else if (e.kind === 'issue') console.log(at, '!!! ISSUE', e.what, '|', e.step, '|', e.target ? e.target.desc : '', e.shot || '');
  else if (e.kind === 'tabs') console.log(at, 'TAB OPENS', e.open.join(', '));
  else if (e.kind === 'ceremony') console.log(at, 'CEREMONY', e.text.slice(0, 60));
  else if (e.kind === 'prestige-intent') console.log(at, 'player goes to prestige');
  else if (e.kind === 'outfit') console.log(at, 'picked an outfit');
  else if (e.kind === 'end' || e.kind === 'error') console.log(at, e.kind.toUpperCase(), JSON.stringify(e));
});
console.log('\nissues:', d.issues.length, '| page errors:', d.errs.length, d.errs.slice(0, 3), '| bot errors:', d.berr, '| real seconds', d.secs);
