/* Names end-to-end: the first time the game opens it asks for a name, and no two farmers can hold the same one.
   node names_e2e.js <test.html> [shots dir]   (the real Netlify functions behind http://localhost, as in online_e2e.js) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const N = path.join(__dirname, '../../netlify/');
const G = require(N + 'lib/game'); const store = G.memoryStore();
const fns = {};
['game-account', 'game-save', 'game-score', 'game-visit', 'game-events', 'game-grants', 'game-samples', 'game-claim', 'game-harvest', 'game-coop', 'game-coe', 'game-checkin', 'game-gift', 'game-link', 'game-name'].forEach((n) => { fns[n] = require(N + 'lib/handlers/' + n); Object.defineProperty(fns[n], '__deps', { get: () => ({ store, now: Date.now() }), configurable: true }); });
const file = path.resolve(process.argv[2]), html = fs.readFileSync(file, 'utf8');
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (!u.pathname.startsWith('/.netlify/functions/')) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return; }
  let body = ''; req.on('data', (c) => { body += c; }); req.on('end', async () => {
    const fn = fns[u.pathname.split('/').pop()];
    if (!fn) { res.writeHead(404); res.end('{}'); return; }
    const r = await fn.handler({ httpMethod: req.method, headers: req.headers, body: body || undefined, queryStringParameters: Object.fromEntries(u.searchParams) });
    res.writeHead(r.statusCode, { 'content-type': 'application/json' }); res.end(r.body);
  });
});
const shots = process.argv[3] || '.'; fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise((r) => srv.listen(8766, r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const dev = async (url) => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); await p.goto(url || 'http://localhost:8766/farm/'); await p.waitForTimeout(1500); return p; };
  const modal = (p) => p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText.replace(/\s+/g, ' '));
  const type = async (p, sel, t) => { await p.fill(sel, t); await p.press(sel, 'Enter'); await p.waitForTimeout(500); };
  const gone = (p) => p.waitForFunction(() => document.getElementById('modal').hidden || !document.getElementById('nameAsk'), null, { timeout: 3000 }).then(() => true, () => false);   /* a closed window keeps its last content */
  const nameWin = async (p) => { for (let i = 0; i < 5 && await p.evaluate(() => !document.getElementById('nameAsk') && !document.getElementById('modal').hidden); i++) { await p.evaluate(() => window.__T.closeModal()); await p.waitForTimeout(150); } return modal(p); };   /* a window already open (Rosa's lesson) goes first */
  const holder = async (name) => ((await store.get('names/' + G.nameKey(name))) || {}).id;

  // a new farmer: the game opens on the name window, and won't take a stand-in name
  const A = await dev();
  let m = await modal(A);
  ok(/Welcome to Beju Farm/.test(m) && /No two farmers share a name/.test(m), 'a new farm opens on the name window, before Rosa\'s first lesson');
  ok(await A.evaluate(() => document.activeElement && document.activeElement.id === 'nameAsk'), 'the name box has the focus');
  await A.screenshot({ path: path.join(shots, 'name-window.png') });
  await A.keyboard.press('Escape'); await A.waitForTimeout(200);
  ok(/Welcome to Beju Farm/.test(await modal(A)), 'Escape doesn\'t skip it');
  await type(A, '#nameAsk', 'You');
  ok(/could be anyone/.test(await modal(A)), '"You" is refused, in the window');
  await type(A, '#nameAsk', 'Player 7');
  ok(/could be anyone/.test(await modal(A)), '"Player 7" is refused too');
  await type(A, '#nameAsk', 'Mika');
  ok(await gone(A), 'a name of your own closes the window');
  const idA = await A.evaluate(() => window.__T.NET.acct.player);
  ok(await holder('Mika') === idA, 'the server holds Mika for this farm');
  ok(await A.evaluate(() => window.__T.S.name === 'Mika' && window.__T.S.nameOk === 'Mika'), 'the farm is called Mika');
  await A.waitForTimeout(800);
  ok(/Rosa/i.test(await modal(A)), 'then Rosa\'s first lesson starts: ' + (await modal(A)).slice(0, 40));

  // a second farmer can't take it, whatever the capitals and spaces
  const B = await dev();
  await type(B, '#nameAsk', 'MI KA');
  m = await modal(B);
  ok(/Another farmer is already called MI KA/.test(m), 'MI KA is taken: ' + m.slice(0, 90));
  await B.screenshot({ path: path.join(shots, 'name-taken.png') });
  await type(B, '#nameAsk', 'Kenji');
  ok(await gone(B) && await holder('Kenji') === await B.evaluate(() => window.__T.NET.acct.player), 'Kenji is free');

  // renaming in Settings: a taken name is refused, a free one frees the old
  await B.evaluate(() => { const T = window.__T; T.S.guide = T.GUIDE.length; for (let i = 0; i < 6; i++) T.closeModal(); });
  await B.click('#gearBtn'); await B.waitForTimeout(400);
  ok(await B.evaluate(() => !!document.querySelector('#panel #nameIn')), 'Settings has the name box');
  await type(B, '#nameIn', 'mika');
  ok(/Another farmer is already called mika/.test(await B.evaluate(() => document.getElementById('toast').innerText)), 'Settings refuses a taken name');
  await type(B, '#nameIn', 'Ken');
  ok(await B.evaluate(() => window.__T.S.name) === 'Ken' && !(await holder('Kenji')), 'Ken saved, and Kenji is free again');

  // the board shows both, once each
  await A.evaluate(() => { window.__T.NET.lastScore = ''; window.__T.NET.lastKey = ''; }); await B.evaluate(() => { window.__T.NET.lastScore = ''; window.__T.NET.lastKey = ''; });
  await A.waitForTimeout(16500);   /* scores go up every 15 s, and the board's row cache is 15 s */
  const names = (await fns['game-score'].handler({ httpMethod: 'GET', headers: {}, queryStringParameters: { mode: 'season' } })).body;
  ok(JSON.stringify(JSON.parse(names).top.map((r) => r.name).sort()) === '["Ken","Mika"]', 'the board: ' + JSON.parse(names).top.map((r) => r.name).join(', '));

  // a farm named while offline, whose name someone took meanwhile, is asked again when it comes online
  const C = await dev();
  await C.evaluate(() => { const T = window.__T; T.S.name = 'Mika'; T.S.nameOk = ''; T.closeModal(); });
  await C.reload(); await C.waitForTimeout(2000);
  m = await nameWin(C);
  ok(/Another farmer took the name Mika first/.test(m), 'asked again: ' + m.slice(0, 80));
  await type(C, '#nameAsk', 'Lia');
  ok(await gone(C) && await holder('Lia') === await C.evaluate(() => window.__T.NET.acct.player), 'Lia saved');
  ok(await C.evaluate(() => { window.__T.act('reset'); window.__T.act('reset'); return window.__T.S.name; }) === 'Lia', 'a new game keeps the name');

  // the offline copy asks too, without the online note
  const D = await dev('file://' + file);
  m = await modal(D);
  ok(/Welcome to Beju Farm/.test(m) && !/No two farmers/.test(m), 'the offline copy asks for a name');
  await type(D, '#nameAsk', 'Sora');
  ok(await gone(D) && await D.evaluate(() => window.__T.S.name) === 'Sora', 'and keeps it');

  for (const [n, p] of [['A', A], ['B', B], ['C', C], ['D', D]]) ok(!p.errs.length, 'no page errors on ' + n + (p.errs.length ? ': ' + p.errs.join(' | ') : ''));
  await b.close(); srv.close();
})();
