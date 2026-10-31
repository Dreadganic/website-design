/* Real-bag cards: an unlock that exists for real links its bag on bejucoffee.com, once a save, only once orders count.
   node realbag_e2e.js <test.html> [shots dir]   (makes an orders-live copy beside it: ORDERS_LIVE on, API '/fn/' answered locally) */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const live = file.replace(/\.html$/, '') + '_live.html';
fs.writeFileSync(live, fs.readFileSync(file, 'utf8').replace(/^const ORDERS_LIVE = false;/m, 'const ORDERS_LIVE = true;').replace(/^const API = .*$/m, "const API = '/fn/';"));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const open = async (f) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); p.errs = []; p.opened = [];
    p.on('pageerror', (e) => p.errs.push(e.message));
    await c.route('**/fn/**', (r) => r.fulfill({ status: 404, body: '{}' }));   /* no server: the farm stays offline-ish, the cards only need ordersLive() */
    await c.route('https://bejucoffee.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>shop</title>' }));
    c.on('page', (np) => { p.opened.push(np.url()); np.close().catch(() => {}); });
    await p.goto('file://' + f); await p.waitForTimeout(1500);
    await p.evaluate(() => { const T = window.__T, S = T.S; S.guide = T.GUIDE.length; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; S.prestige = 3; S.points = 1e7; S.lastMethod = null; S.mlots = { washed: 99, natural: 99, honey: 99, rum: 99, whiskey: 99 }; ['mogiana', 'huila'].forEach((l) => { S.farms[l].mastery = 30; }); });   /* farm levels that clear the Huila and barrel gates */
    await p.waitForTimeout(1500); await p.evaluate(() => { for (let i = 0; i < 12; i++) window.__T.closeModal(); document.getElementById('modal').hidden = true; });   /* windows that arrive late (Rosa's roastery card at prestige 3) */
    return p;
  };
  const modal = (p) => p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText.replace(/\s+/g, ' '));
  const clear = (p) => p.evaluate(() => { for (let i = 0; i < 12; i++) window.__T.closeModal(); document.getElementById('modal').hidden = true; });
  const last = (p) => p.evaluate(() => window.__T.BEACON.last());
  const card = async (p) => /This one is real/.test(await modal(p));   /* the daily check-in waits for a free screen, so other windows can follow a card */

  const A = await open(live);
  await A.evaluate(() => { window.__T.act('farm:huila'); });
  let m = await modal(A);
  ok(await A.evaluate(() => window.__T.S.farms.huila.unlocked) && /Huila is open/.test(m) && /Colombia Pink Whiskey/.test(m) && /Monteblanco/.test(m), 'opening Huila shows the bag grown there: ' + m.slice(0, 90));
  if (shots) await A.screenshot({ path: path.join(shots, 'huila-card.png') });
  await A.click('#modalCard button[data-act="close"]'); await A.waitForTimeout(300);
  ok(!(await card(A)), 'Later closes it');
  await clear(A);

  await A.evaluate(() => window.__T.act('method:rum'));
  ok(await A.evaluate(() => window.__T.S.methods.rum), 'Rum barrel unlocks with know-how');
  m = await modal(A);
  ok(/Rum barrel unlocked/.test(m) && /This one is real/.test(m) && /Colombia Rum Barrel/.test(m) && /La Loma/.test(m) && /¥4,500/.test(m), 'its card names the real bag: ' + m.slice(0, 120));
  const href = await A.evaluate(() => (document.querySelector('#modalCard a[data-bag]') || {}).href);
  ok(href === 'https://bejucoffee.com/shop/rumbarrel/', 'the card links the bag page: ' + href);
  let e = await last(A); ok(e && e.e === 'bag_card' && e.key === 'rumbarrel', 'bag_card is counted for rumbarrel');
  if (shots) await A.screenshot({ path: path.join(shots, 'rum-card.png') });
  await A.click('#modalCard a[data-bag]'); await A.waitForTimeout(500);
  e = await last(A);
  ok(e && e.e === 'order_click' && e.key === 'rumbarrel' && e.t === 'See the real bag', 'tapping it counts an order click for that bag');
  ok(A.opened.some((u) => u.includes('/shop/rumbarrel/')), 'the bag page opens in a new tab');
  ok(!(await card(A)), 'and the card closes behind it');
  await clear(A);

  await A.evaluate(() => window.__T.act('method:whiskey'));
  ok(await A.evaluate(() => window.__T.S.methods.whiskey) && !(await card(A)), 'Whiskey barrel: Pink Whiskey was shown already, so no second card');
  await A.evaluate(() => window.__T.act('method:honey'));
  ok(await A.evaluate(() => window.__T.S.methods.honey) && !(await card(A)), 'Honey has no real bag: just the toast');
  const saved = await A.evaluate(() => { window.__T.save(); return JSON.parse(localStorage.getItem('beju-farm-save-v3')).bagSeen; });
  ok(saved && saved.rumbarrel && saved.pinkwhiskey && !saved.strawberry, 'the shown cards are remembered in the save');
  ok(!A.errs.length, 'no page errors' + (A.errs.length ? ': ' + A.errs.join(' | ') : ''));

  const B = await open(file);   /* the build as it ships today: orders don't count yet */
  await B.evaluate(() => window.__T.act('farm:huila')); const huilaCard = await card(B); await clear(B);
  await B.evaluate(() => window.__T.act('method:rum'));
  ok(await B.evaluate(() => window.__T.S.farms.huila.unlocked && window.__T.S.methods.rum && !window.__T.S.bagSeen) && !huilaCard && !(await card(B)), 'before orders count, opening Huila and Rum barrel show no bag card');
  ok(!B.errs.length, 'no page errors before launch either');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
