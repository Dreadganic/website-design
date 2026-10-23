/* Online end-to-end: the real Netlify functions behind a local server, two browser "devices".
   node online_e2e.js <test.html> [shots dir]   (served from http://localhost, so the game turns its online layer on) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const N = path.join(__dirname, '../../netlify/');
const G = require(N + 'lib/game'); const store = G.memoryStore();
const fns = {};
['game-account', 'game-save', 'game-score', 'game-visit', 'game-events', 'game-grants', 'game-samples', 'game-claim', 'game-harvest', 'game-coop', 'game-coe', 'game-checkin', 'game-gift', 'game-link'].forEach((n) => { fns[n] = require(N + 'functions/' + n); Object.defineProperty(fns[n], '__deps', { get: () => ({ store, now: Date.now(), harvest: { days: [] } }), configurable: true }); });
const html = fs.readFileSync(path.resolve(process.argv[2]), 'utf8');
const log = [];
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (!u.pathname.startsWith('/.netlify/functions/')) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return; }
  let body = ''; req.on('data', (c) => { body += c; }); req.on('end', async () => {
    const name = u.pathname.split('/').pop(), fn = fns[name];
    if (!fn) { res.writeHead(404); res.end('{}'); return; }
    try {
      const r = await fn.handler({ httpMethod: req.method, headers: req.headers, body: body || undefined, queryStringParameters: Object.fromEntries(u.searchParams) });
      log.push(req.method + ' ' + name + ' ' + r.statusCode + (r.statusCode >= 400 ? ' ' + r.body.slice(0, 60) : ''));
      res.writeHead(r.statusCode, { 'content-type': 'application/json' }); res.end(r.body);
    } catch (e) { log.push('THREW ' + name + ' ' + e.message); res.writeHead(500); res.end('{}'); }
  });
});
const shots = process.argv[3] || '.'; fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await new Promise((r) => srv.listen(8765, r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const dev = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500); return p; };
  const clean = (p) => p.evaluate(() => { const T = window.__T; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const settle = async (p) => { await p.waitForTimeout(1500); await clean(p); };   /* let windows that arrive late (samples, check-in) come, then clear them */
  const tap = (p, sel) => p.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
  const modal = (p) => p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText.replace(/\s+/g, ' '));
  const toastTxt = (p) => p.evaluate(() => document.getElementById('toast').innerText);
  const hide = (p) => p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });   /* the page going to the background saves at once */
  const prep = (p) => p.evaluate(() => { const T = window.__T, S = T.S; S.guide = T.GUIDE.length; T.act('add:checkin'); });

  // device A: a farm at prestige 2, saved online
  const A = await dev();
  ok(await A.evaluate(() => window.__T.NET.status) === 'online', 'device A goes online and gets an account');
  const playerA = await A.evaluate(() => window.__T.NET.acct.player);
  await prep(A); await A.evaluate(() => { const T = window.__T, S = T.S; S.prestige = 2; S.coins = 123456; S.name = 'Mika'; Object.assign(S.tabs, { ranks: true, shop: true, unlock: true, upgrades: true, orders: true }); });
  await settle(A); await A.waitForTimeout(5200); await hide(A); await A.waitForTimeout(800);   /* the server takes one save every 5 s */
  const srvSave = () => store.get('saves/' + playerA);
  let sv = await srvSave();
  ok(sv && sv.data.prestige === 2 && sv.data.coins === 123456, 'device A saved its farm online (v' + (sv && sv.version) + ')');
  // Settings › Play on another device
  await settle(A); await tap(A, '#gearBtn'); await A.waitForTimeout(300);
  const card = await A.evaluate(() => document.getElementById('panel').innerText);
  ok(/Play on another device/.test(card) && /recovery code/i.test(card), 'Settings shows the device card online');
  await A.screenshot({ path: path.join(shots, 'settings.png') });
  await clean(A); await tap(A, '[data-act="linkmake"]'); await A.waitForTimeout(600);
  const m1 = await modal(A); const code = (m1.match(/([A-Z2-9]{4})-([A-Z2-9]{4})/) || []).slice(1).join('');
  ok(code.length === 8, 'a code is shown: ' + code);
  await A.screenshot({ path: path.join(shots, 'code.png') });
  await clean(A);

  // device B: a fresh farm uses the code
  const B = await dev(); await prep(B); await settle(B);
  const playerB0 = await B.evaluate(() => window.__T.NET.acct.player);
  await tap(B, '#gearBtn'); await B.waitForTimeout(200); await tap(B, '[data-act="linkask"]'); await B.waitForTimeout(200);
  await B.fill('#linkIn', code.slice(0, 4).toLowerCase() + ' - ' + code.slice(4)); await tap(B, '[data-act="linkuse"]'); await B.waitForTimeout(800);
  const m2 = await modal(B);
  ok(/Load this farm\?/.test(m2) && /Mika/.test(m2) && /prestige 2/.test(m2), 'device B is asked before loading Mika\'s farm: ' + m2.slice(0, 90));
  await B.screenshot({ path: path.join(shots, 'load.png') });
  await Promise.all([B.waitForNavigation({ waitUntil: 'load' }), tap(B, '[data-act="linkload"]')]); await B.waitForTimeout(2000);
  const bNow = await B.evaluate(() => ({ p: window.__T.S.prestige, coins: window.__T.S.coins, player: window.__T.NET.acct.player, status: window.__T.NET.status, modal: document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText }));
  ok(bNow.p === 2 && bNow.coins >= 123456 && bNow.player === playerA && bNow.player !== playerB0, 'device B now plays Mika\'s farm as the same player');
  ok(bNow.status === 'online' && !/Newer save/.test(bNow.modal), 'device B is online with no "newer save" question');
  await settle(B); await tap(B, '#gearBtn'); await B.waitForTimeout(200); await tap(B, '[data-act="linkask"]'); await B.fill('#linkIn', code); await tap(B, '[data-act="linkuse"]'); await B.waitForTimeout(600);
  ok(/used already/.test(await toastTxt(B)), 'a used code says so: "' + await toastTxt(B) + '"');
  await clean(B);
  // the recovery code: shown on A, used on a third device
  await settle(A); await tap(A, '#gearBtn'); await A.waitForTimeout(200); await tap(A, '[data-act="recovery"]'); await A.waitForTimeout(300);
  const rec = ((await modal(A)).match(/p_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/) || [''])[0];
  ok(rec.startsWith(playerA + '.'), 'the recovery code names this farm');
  await clean(A);
  const C3 = await dev(); await prep(C3); await settle(C3);
  await tap(C3, '#gearBtn'); await C3.waitForTimeout(200); await tap(C3, '[data-act="linkask"]'); await C3.fill('#linkIn', rec); await tap(C3, '[data-act="linkuse"]'); await C3.waitForTimeout(700);
  ok(/Load this farm\?/.test(await modal(C3)), 'a recovery code finds the farm too');
  await clean(C3);

  // B plays on and saves; A (older) comes back: it is asked, and saves nothing until it chooses
  await B.evaluate(() => { window.__T.S.coins = 999999; }); await hide(B); await B.waitForTimeout(800);
  sv = await srvSave(); ok(sv.data.coins === 999999, 'device B saved its newer progress');
  await A.reload(); await A.waitForTimeout(2200);   /* A, open since before B saved, comes back */
  const askA = await modal(A); await A.screenshot({ path: path.join(shots, 'newer.png') }); ok(/Newer save found/.test(askA), 'device A is told a newer save exists' + (askA ? '' : ' (no window: ' + await A.evaluate(() => window.__T.S.coins) + ' coins)'));
  await hide(A); await A.waitForTimeout(800);
  sv = await srvSave(); ok(sv.data.coins === 999999, 'while A decides, B\'s newer save is not overwritten (' + sv.data.coins + ')');
  if (/Newer save found/.test(askA)) { await Promise.all([A.waitForNavigation({ waitUntil: 'load' }), tap(A, '#modalCard [data-act="cloudLoad"]')]); await A.waitForTimeout(2000); }
  ok(await A.evaluate(() => window.__T.S.coins) === 999999, 'device A loads the newer farm');

  // names: the leaderboard's rules up front
  await settle(A); await A.evaluate(() => { const T = window.__T; T.S.rankSub = 'board'; T.setTab('ranks'); }); await A.waitForTimeout(300);
  await A.fill('#nameIn', 'x'); await tap(A, '[data-act="rename"]'); await A.waitForTimeout(150);
  ok(/at least 2/.test(await toastTxt(A)), 'a one-letter name is refused with a reason');
  await A.waitForTimeout(2800); await A.fill('#nameIn', 'Mika <b>'); await tap(A, '[data-act="rename"]'); await A.waitForTimeout(150);
  ok(await A.evaluate(() => window.__T.S.name) === 'Mika b', 'markup is stripped from names: ' + await A.evaluate(() => window.__T.S.name));

  // reset: the leaderboard row starts again
  await store.set('scores/' + playerA, Object.assign((await store.get('scores/' + playerA)) || { id: playerA, name: 'Mika', look: {} }, { prestige: 3, level: 5, points: 3000, season: G.seasonKey(Date.now()), at: Date.now() - 60e3, prestigeAt: Date.now() - 864e5 }));
  await settle(A); await tap(A, '#gearBtn'); await A.waitForTimeout(200);
  await tap(A, '[data-act="reset"]'); await tap(A, '[data-act="reset"]'); await A.waitForTimeout(300);
  ok(await A.evaluate(() => window.__T.S.resetPending === true), 'a reset farm marks its row to start again');
  await A.waitForTimeout(31000);   /* the 30 s timer posts the score */
  const row = await store.get('scores/' + playerA);
  ok(row && row.prestige === 0, 'after a reset the leaderboard row starts again (prestige ' + (row && row.prestige) + ')');
  ok(await A.evaluate(() => !window.__T.S.resetPending), 'the reset flag clears once the server took it');

  console.log('page errors A:', A.errs, 'B:', B.errs, 'C:', C3.errs);
  console.log(log.filter((l) => / [45]\d\d /.test(l) || /THREW/.test(l)).slice(0, 20).join('\n'));
  await b.close(); srv.close();
})();
