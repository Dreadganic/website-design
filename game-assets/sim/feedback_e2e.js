/* Playtest feedback, round of 25 October: quick reactions as a small label where you tapped (not the banner), long windows that scroll,
   menus that stay open while you use them, the boat's remaining delivery, the head roaster's blends from reputation 15, and renaming for cranes.
   node feedback_e2e.js <test.html from mktest.py> */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path'), file = path.resolve(process.argv[2]);
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; (T.modalQueue || []).length = 0; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  await E(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 3; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.roastery.tip = true; S.roastery.rep = T.REP_AT(9); S.roastery.beans = { 'caturra.washed': { kg: 600, coins: 90000, pts: 3000, cup: 86 } }; });
  for (let k = 0; k < 3; k++) { await clean(); await g.waitForTimeout(150); }

  /* a perfect crack: a label where you tapped, no banner */
  await E(() => { const T = window.__T, S = T.S; S.roastery.roasters = []; T.startRoast('caturra.washed', 'medium', true); const r = S.roastery.roasters[0]; r.start = Date.now() - r.dur * 0.75; S.roastSub = 'roasting'; T.setTab('roast'); T.renderPanel(); });
  await g.waitForTimeout(300); await clean();
  await g.click('[data-act="crack:0"]'); await g.waitForTimeout(150);
  ok(await E(() => !!document.querySelector('.tapfloat') && /Perfect crack/.test(document.querySelector('.tapfloat').textContent)), 'a perfect crack shows a small label where you tapped');
  ok(await E(() => document.getElementById('toast').hidden || !/crack/i.test(document.getElementById('toast').textContent)), 'and no banner');
  await g.waitForTimeout(1500); ok(await E(() => !document.querySelector('.tapfloat')), 'the label fades away');
  await E(() => { const T = window.__T, S = T.S; S.roastery.roasters = []; T.startRoast('caturra.washed', 'medium', true); const r = S.roastery.roasters[0]; r.start = Date.now() - r.dur * 0.75; r.warned = false; T.setTab('farm', true); T.roasteryTick(); });
  ok(await E(() => document.getElementById('toast').hidden || !/First crack/.test(document.getElementById('toast').textContent)), 'first crack away from the roastery: no banner (the Crack button and sound say so)');

  /* long windows scroll */
  await E(() => { window.__T.setTab('farm'); window.__T.act('bed:0'); }); await g.waitForTimeout(300);
  ok(await E(() => { const c = document.getElementById('modalCard'), cs = getComputedStyle(c); return cs.overflowY === 'auto' && c.getBoundingClientRect().bottom <= innerHeight + 1; }), 'the replant window fits the screen and scrolls');
  await clean();

  /* a menu in the sheet stays open while you use it */
  await E(() => { const T = window.__T, S = T.S; S.roastery.rep = T.REP_AT(10); S.roastSub = 'roasting'; T.setTab('roast'); T.renderPanel(); }); await g.waitForTimeout(300); await clean();
  const had = await E(() => { const s = document.querySelector('[data-blendname]'); if (!s) return false; s.focus(); window.__sel = s; return true; });
  await g.waitForTimeout(1300);
  ok(had && await E(() => document.contains(window.__sel) && document.activeElement === window.__sel), 'the blend name menu isn\'t rebuilt while it\'s open');
  await E(() => { const s = window.__sel; s.value = '2'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await g.waitForTimeout(1300);
  ok(await E(() => document.activeElement !== window.__sel), 'and lets go once a name is picked');

  /* the boat's remaining delivery */
  await E(() => { const T = window.__T, S = T.S; S.farms.toba.unlocked = true; S.buyers = true; S.contracts = S.contracts.filter((c) => !c.boat); S.contracts.push({ id: 'bt', boat: true, buyer: 'Toba trader', v: 'caturra', method: 'washed', kg: 1000, have: 300, minCup: 80, coins: 50000, points: 2000, due: S.minutesTotal + 600 }); S.loc = 'toba'; T.setTab('farm'); T.renderPanel(); });
  await g.waitForTimeout(700);
  ok(await E(() => /700 kg to go/.test(document.getElementById('locBeds').textContent)), 'Toba\'s bar: 700 kg to go');
  await E(() => { window.__T.setTab('mill'); window.__T.renderPanel(); }); await g.waitForTimeout(700);
  ok(await E(() => /boat: 700 kg to go/.test(document.getElementById('locBeds').textContent)), 'the Mill\'s bar too');
  ok(await E(() => /700 kg to go/.test(document.getElementById('panel').innerText)), 'and the boat\'s card: ' + (await E(() => document.getElementById('panel').innerText.slice(0, 300).replace(/\s+/g, ' '))));

  /* the head roaster blends from reputation 15 */
  const blendAt = (rep) => E((rep) => { const T = window.__T, S = T.S, R = S.roastery; S.staff.roaster = true; S.roasterOff = false; R.rep = T.REP_AT(rep); R.roasters = [{ key: 'x.y', profile: 'light', start: Date.now(), dur: 1e9, auto: false }, { key: 'x.y', profile: 'light', start: Date.now(), dur: 1e9 }, { key: 'x.y', profile: 'light', start: Date.now(), dur: 1e9 }, { key: 'x.y', profile: 'light', start: Date.now(), dur: 1e9 }]; R.blendAt = 0; S.counter.pre = [];
    R.bags = [{ key: 'caturra.washed', profile: 'medium', kg: 160, coins: 1000, pts: 10, q: 60 }, { key: 'caturra.washed', profile: 'dark', kg: 160, coins: 1000, pts: 10, q: 70 }, { key: 'caturra.washed', profile: 'light', kg: 160, coins: 1000, pts: 10, q: 70, seasonal: 'Momiji', skey: S.season.key }];
    T.headRoasterTick(false); R.roasters = []; return R.bags.map((b) => b.blend ? 'blend:' + b.q : b.profile); }, rep);
  const b14 = await blendAt(14), b15 = await blendAt(15);
  ok(!b14.some((x) => /blend/.test(x)), 'no blends below reputation 15: ' + b14.join(','));
  ok(b15.filter((x) => /blend/.test(x)).length === 1 && b15.includes('light'), 'at 15 he blends a spare pair and leaves the season\'s bag: ' + b15.join(','));
  ok(b15.includes('blend:70'), 'the blend\'s quality is the average +5');

  /* renaming costs 50 cranes; your first name is free */
  const ren = (nm) => E((nm) => { const T = window.__T; T.setTab('ranks'); T.S.rankSub = 'board'; T.renderPanel(); document.getElementById('nameIn').value = nm; T.act('rename'); }, nm);
  await E(() => { const T = window.__T; T.setTab('ranks'); T.renderPanel(); }); await g.waitForTimeout(600); await clean(); await E(() => { window.__T.S.cranes = 30; }); await ren('Tessa'); await g.waitForTimeout(300);
  ok((await E(() => window.__T.S.name)) === 'Tess' && (await E(() => window.__T.S.cranes)) === 30, 'not enough cranes: the name stays: ' + (await E(() => window.__T.S.name + ' ' + window.__T.S.cranes)));
  const c0 = await E(() => { window.__T.S.cranes = 70; return 70; }); await ren('Tessa'); await g.waitForTimeout(300);
  ok((await E(() => window.__T.S.name)) === 'Tessa' && (await E(() => window.__T.S.cranes)) === c0 - 50, 'a new name for 50 cranes: ' + (await E(() => window.__T.S.cranes)));
  await E(() => { const S = window.__T.S; S.name = 'You'; S.nameOk = ''; S.cranes = 0; }); await ren('Mori'); await g.waitForTimeout(300);
  ok((await E(() => window.__T.S.name)) === 'Mori', 'a first name is free');

  console.log(pass + ' passed, ' + fail + ' failed' + (errs.length ? ' · page errors: ' + errs.slice(0, 4).join(' | ') : ''));
  if (fail || errs.length) process.exitCode = 1;
  await b.close();
})();
