/* Idle save gate: an open tab nobody touches uploads its save every 30 minutes, not every 3.
   node save_gate_e2e.js <test.html> [shots dir]   (the real game-save function behind a local server, counting uploads) */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const N = path.join(__dirname, '../../netlify/');
const G = require(N + 'lib/game'); const store = G.memoryStore();
const fns = {};
['game-account', 'game-save', 'game-score', 'game-visit', 'game-events', 'game-grants', 'game-samples', 'game-claim', 'game-harvest', 'game-coop', 'game-coe', 'game-checkin', 'game-gift', 'game-link', 'game-name'].forEach((n) => { fns[n] = require(N + 'lib/handlers/' + n); Object.defineProperty(fns[n], '__deps', { get: () => ({ store, now: Date.now(), harvest: { days: [] } }), configurable: true }); });
const html = fs.readFileSync(path.resolve(process.argv[2]), 'utf8');
let puts = 0, slow = 0;
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (!u.pathname.startsWith('/.netlify/functions/')) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return; }
  let body = ''; req.on('data', (c) => { body += c; }); req.on('end', async () => {
    const name = u.pathname.split('/').pop(), fn = fns[name];
    if (!fn) { res.writeHead(404); res.end('{}'); return; }
    if (name === 'game-save' && req.method === 'PUT') { puts++; if (slow) await new Promise((r) => setTimeout(r, slow)); }
    const r = await fn.handler({ httpMethod: req.method, headers: req.headers, body: body || undefined, queryStringParameters: Object.fromEntries(u.searchParams) });
    res.writeHead(r.statusCode, { 'content-type': 'application/json' }); res.end(r.body);
  });
});
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise((r) => srv.listen(8766, r));
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const T = window.__T; T.S.guide = T.GUIDE.length; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; });
  const player = await p.evaluate(() => window.__T.NET.acct && window.__T.NET.acct.player);
  ok(!!player && puts === 1, 'going online uploads the save once (' + puts + ')');
  const tick = () => p.evaluate(async () => { window.__T.NET.lastSync = 0; window.__T.NET.forcedAt = 0; await window.__T.cloudSync(); });   /* as if 3 minutes went by */
  const hide = () => p.evaluate(async () => { const N = window.__T.NET; N.forcedAt = 0; await window.__T.cloudSync(true); });   /* leaving the tab */
  const srvVer = async () => ((await store.get('saves/' + player)) || {}).version;

  await p.waitForTimeout(5200);   /* the server takes one save every 5 s */
  let n = puts; await tick(); await tick(); await hide();
  ok(puts === n, 'an untouched tab skips the 3-minute save and the leave-tab save (' + (puts - n) + ' uploads)');

  await p.keyboard.press('Shift'); n = puts; const v0 = await srvVer(); await tick();
  ok(puts === n + 1 && (await srvVer()) > v0, 'a key press makes the next save go (v' + v0 + ' → v' + (await srvVer()) + ')');

  await p.waitForTimeout(5200); n = puts; await tick();
  ok(puts === n, 'then the tab is idle again: no upload');

  await p.mouse.click(195, 420); await p.waitForTimeout(5200); n = puts; await hide();
  ok(puts === n + 1, 'a tap, then leaving the tab, saves once');

  await p.waitForTimeout(5200); await p.keyboard.press('Shift'); slow = 800; n = puts;
  const inFlight = tick(); await p.waitForTimeout(200); await p.keyboard.press('Shift'); await inFlight; slow = 0;
  await p.waitForTimeout(5200); await tick();
  ok(puts === n + 2, 'a key press while an upload is on its way still gets saved next time (' + (puts - n) + ' uploads)');

  await p.waitForTimeout(5200); n = puts;
  await p.evaluate(() => { window.__T.NET.savedAt = Date.now() - 1800001; }); await tick();
  ok(puts === n + 1, 'an idle tab still uploads every 30 minutes, so the farm\'s own progress reaches the server');

  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
