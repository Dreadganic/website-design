/* Getting around: tapping the place name opens "Where to?", every open farm and island in one list with what needs you at
   each; one tap travels there (from the mill or roastery too); a dot by the name when somewhere else needs you; the arrows
   still step through in order.
   node nav_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 6; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true });
    T.LOCS.forEach((l) => { S.farms[l].unlocked = true; }); T.bmTick(); S.bm.seen = true; S.route = T.routeFresh(); S.route.seen = true; S.route.mig = 1; T.konaTick(); S.kona.seen = true; S.rev.cur = null; S.loc = 'mogiana'; S.isle = false; T.setTab('farm', true); });
  await clean(); await g.waitForTimeout(600);
  await g.click('#locTap'); await g.waitForTimeout(200);
  const tiles = await E(() => [...document.querySelectorAll('#modalCard .place')].map((t) => t.dataset.act));
  ok(/Where to\?/.test(await E(() => document.getElementById('modalCard').innerText)), 'tapping the place name opens "Where to?"');
  ok(tiles.join() === 'goplace:mogiana,goplace:huila,goplace:gedeo,goplace:toba,goplace:turrialba,goplace:osaka,goplace:hb,goplace:bm,goplace:kona', 'every open farm, then the harbour, Blue Mountain and Kona (' + tiles.length + ')');
  ok(await E(() => document.querySelector('#modalCard .place.here').dataset.act === 'goplace:mogiana'), 'the place you\'re at is marked');
  if (shots) await g.screenshot({ path: shots + '/where-to.png' });
  await g.click('#modalCard [data-act="goplace:kona"]'); await g.waitForTimeout(250);
  ok(await E(() => window.__T.scene === 'kona' && document.getElementById('modal').hidden), 'one tap: straight from Mogiana to Kona Ridge');
  await E(() => window.__T.setTab('mill')); await g.waitForTimeout(150); await clean();
  await g.click('#locTap'); await g.waitForTimeout(200); await g.click('#modalCard [data-act="goplace:gedeo"]'); await g.waitForTimeout(250);
  ok(await E(() => window.__T.scene === 'farm' && window.__T.S.loc === 'gedeo'), 'from the mill, a tap goes back out to a farm');
  await E(() => { const B = window.__T.S.bm; B.bbq = [{ kg: 20, u: 0, o: 0, at: Date.now() - 48 * 3600e3 }]; window.__T.renderPanel(); }); await g.waitForTimeout(700);
  ok(await E(() => document.getElementById('locTap').classList.contains('call')), 'a dot by the name when another place needs you');
  await g.click('#locTap'); await g.waitForTimeout(200);
  ok(await E(() => { const t = document.querySelector('#modalCard [data-act="goplace:bm"]'); return t.classList.contains('call') && /1 to grade/.test(t.innerText); }), 'and its tile says what: 1 to grade at Blue Mountain');
  await g.click('#modalCard [data-act="goplace:bm"]'); await g.waitForTimeout(700);
  ok(await E(() => window.__T.scene === 'bm' && !document.getElementById('locTap').classList.contains('call')), 'once you\'re there, the dot goes');
  await clean(); await E(() => window.__T.travel(1)); await g.waitForTimeout(150);
  ok(await E(() => window.__T.scene === 'kona'), 'the arrows still step through in order');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
