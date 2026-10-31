/* Returning player: a save last written minutes or hours ago must load into a running farm. Every other suite loads a save
   written that moment, so the welcome-back payout (away) never runs at start-up; a const it touched before being set up once
   stopped the whole game for everyone coming back (no map, no sound, no Shop).
   node returning_e2e.js <test.html> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  /* a prestige 6 farm with everything open, sat on Turrialba */
  const mk = await b.newPage(); await mk.goto('file://' + file); await mk.waitForTimeout(1200);
  const save = await mk.evaluate(() => {
    const T = window.__T, S = T.S; S.guide = T.GUIDE.length; S.prestige = 6; S.coins = 25e6; S.points = 3e6; S.cranes = 10;
    Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; });
    ['huila', 'gedeo', 'toba', 'turrialba'].forEach((l) => { S.farms[l].unlocked = true; S.farms[l].mastery = 30; });
    S.loc = 'turrialba'; T.save(); return JSON.parse(localStorage.getItem('beju-farm-save-v3'));
  });
  await mk.close();

  for (const [label, mins] of [['2 minutes', 2], ['8 hours', 480], ['3 days', 4320]]) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await c.newPage(), errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await c.addInitScript((st) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('beju-farm-save-v3', JSON.stringify(st)); sessionStorage.setItem('seeded', '1'); } }, Object.assign({}, save, { last: Date.now() - mins * 60e3 }));
    await p.goto('file://' + file); await p.waitForTimeout(1500);
    const started = await p.evaluate(() => !!window.__T);
    ok(started && !errs.length, label + ' away: the page starts up to the end' + (errs.length ? ': ' + errs.join(' | ') : started ? '' : ' (stopped before the farm loop)'));
    if (!started) { await c.close(); continue; }
    const t0 = await p.evaluate(() => window.__T.S.minutesTotal); await p.waitForTimeout(1200);
    ok((await p.evaluate(() => window.__T.S.minutesTotal)) > t0, label + ' away: the farm clock runs');
    const card = await p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText.replace(/\s+/g, ' '));
    if (mins > 5) {
      ok(/Welcome back/.test(card), label + ' away: the welcome-back card: ' + card.slice(0, 60));
      const q = await p.evaluate(() => [window.__T.BEACON.qlen(), window.__T.BEACON.last().e]);
      ok(q[0] >= 2 && q[1] === 'session_start', label + ' away: the payout\'s away_collect is queued before session_start (' + q[0] + ' events)');
    } else ok(!/Welcome back/.test(card), label + ' away: no welcome-back card, the farm just catches up');
    if (shots) await p.screenshot({ path: path.join(shots, 'returning-' + mins + '.png') });
    await p.evaluate(() => { for (let i = 0; i < 12; i++) window.__T.closeModal(); document.getElementById('modal').hidden = true; });
    const tabs = [];
    for (const t of ['farm', 'mill', 'roast', 'unlock', 'orders', 'ranks', 'looks', 'shop']) {
      const n = errs.length;
      await p.evaluate((t) => { const T = window.__T; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.querySelector('.tab[data-tab="' + t + '"]').click(); }, t);
      await p.waitForTimeout(120);
      if (errs.length > n) tabs.push(t + ': ' + errs.slice(n).join(' | '));
    }
    ok(!tabs.length, label + ' away: every tab opens, the Shop too' + (tabs.length ? ': ' + tabs.join('; ') : ''));
    ok(/Boosts/.test(await p.evaluate(() => document.getElementById('panel').innerText)), label + ' away: the Shop panel is showing');
    await c.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
