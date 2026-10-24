/* Notes from later play, end to end: the co-op order's size and Claim button, every other Claim button, the rack the foreman keeps
   for a request, the Shop's lock, the farm level in the farm bar, and the menu staying open or closed across farms.
   node notes_e2e.js <test page with API '/fn/'> [shots dir]   (the real Netlify functions answer /fn/ requests, as in community_e2e.js) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const N = path.join(__dirname, '../../netlify/');
const G = require(N + 'lib/game'), C = require(N + 'lib/community'); const store = G.memoryStore();
const fns = {}; ['game-account', 'game-save', 'game-score', 'game-visit', 'game-events', 'game-grants', 'game-samples', 'game-claim', 'game-harvest', 'game-coop', 'game-coe', 'game-checkin', 'game-name', 'game-gift', 'game-link'].forEach((n) => { fns[n] = require(N + 'lib/handlers/' + n); Object.defineProperty(fns[n], '__deps', { get: () => ({ store, now: Date.now(), harvest: { days: [] } }), configurable: true }); });
const shots = process.argv[3] || '.'; fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route('**/fn/**', async (route) => { const req = route.request(), u = new URL(req.url()), fn = fns[u.pathname.split('/').pop()];
    if (!fn) return route.fulfill({ status: 404, body: '{}' });
    const r = await fn.handler({ httpMethod: req.method(), headers: req.headers(), body: req.postData(), queryStringParameters: Object.fromEntries(u.searchParams) });
    route.fulfill({ status: r.statusCode, headers: { 'content-type': 'application/json' }, body: r.body }); });
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForTimeout(1500);
  await p.fill('#nameAsk', 'Notes'); await p.press('#nameAsk', 'Enter'); await p.waitForTimeout(800);
  const clean = () => p.evaluate(() => { const T = window.__T; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const toast = () => p.evaluate(() => document.getElementById('toast').innerText);
  const panel = () => p.evaluate(() => document.getElementById('panel').innerText.replace(/\s+/g, ' '));
  const tapAct = (act) => p.evaluate((a) => { const el = [...document.querySelectorAll('[data-act="' + a + '"]')].find((x) => x.offsetParent !== null && !x.disabled); if (!el) return false; el.click(); return true; }, act);

  // a level 7 farm: the Shop (level 8) is still shut, Looks is open
  await p.evaluate(() => { const T = window.__T, S = T.S; S.guide = T.GUIDE.length; S.xp = T.XP_AT(7) + 1; S.prestige = 0; S.tabs.shop = false; S.tabs.looks = true; S.chars = {}; Object.assign(S.tabs, { unlock: true, upgrades: true, orders: true }); T.checkTabs(); });
  await clean(); await p.evaluate(() => window.__T.setTab('looks')); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => !!document.querySelector('#panel [data-act="shopchars"]'))) && /opens at level 8/.test(await panel()), 'Looks has no way into the Shop before level 8, and says when it opens');
  await p.evaluate(() => window.__T.act('shopchars')); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.getElementById('sheetT').textContent !== 'Shop' && !document.querySelector('#panel [data-act="shoptab:cranes"]')), 'nor does an old link');
  await p.evaluate(() => window.__T.act('shopgo:bskin')); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('#panel [data-act="shoptab:cranes"]')), 'Farm style can\'t open it either');

  // the farm level sits in the farm bar, and the Fields page no longer repeats it
  await p.evaluate(() => { const S = window.__T.S; S.farms.mogiana.build = { housing: 3, wetmill: 2 }; }); await clean(); await p.evaluate(() => window.__T.setTab('farm')); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.getElementById('locLv').textContent) === 'Lv 5' && !/farm level/.test(await panel()), 'farm level 5 is in the farm bar, not on the Fields page');
  await p.screenshot({ path: path.join(shots, 'farm-bar.png'), clip: { x: 0, y: 0, width: 390, height: 110 } });

  // the menu stays open or put away when you change farms
  await p.evaluate(() => { const S = window.__T.S; S.farms.huila.unlocked = true; });
  const open = () => p.evaluate(() => document.getElementById('app').classList.contains('open'));
  ok(await open(), 'the Farm menu is open'); await clean(); await p.click('#nextLoc'); await p.waitForTimeout(300);
  ok(await open() && await p.evaluate(() => window.__T.S.loc) !== 'mogiana', 'and stays open on the next farm');
  await p.evaluate(() => document.querySelector('.sheet-x').click()); await p.waitForTimeout(300); await clean(); await p.click('#prevLoc'); await p.waitForTimeout(300);
  ok(!(await open()), 'put away, it stays put away');

  // the foreman leaves a rack free while a request waits to be started
  const rack = await p.evaluate(() => { const T = window.__T, S = T.S; S.lv.racks = 4; S.staff.foreman = true; S.staff.rule = 'natural'; S.lots = []; S.cherries = { caturra: 5000 }; S.request = { who: 'Kenji at Kissa Hoshi, Kyoto', v: 'caturra', m: 'washed', ends: Date.now() + 864e5, coins: 900, points: 300 };
    T.staffTick(); const free = T.racks() - S.lots.length; return { free, racks: T.racks() }; });
  ok(rack.free === 1, 'the foreman filled ' + (rack.racks - rack.free) + ' of ' + rack.racks + ' racks and kept one for the request');
  await clean(); await p.evaluate(() => window.__T.setTab('mill')); await p.waitForTimeout(400);
  ok(/keeps a rack free for it/.test(await panel()) && await p.evaluate(() => window.__T.racks() - window.__T.S.lots.length) === 1, 'a while later the rack is still free, and the request card says so');
  ok(await tapAct('reqstart') && await p.evaluate(() => window.__T.S.lots.some((l) => l.v === 'caturra' && l.method === 'washed')), 'Start lot uses the free rack');
  ok(await p.evaluate(() => { const T = window.__T, S = T.S; S.cherries = { caturra: 5000 }; T.staffTick(); return S.lots.length === T.racks(); }), 'once it\'s started, the foreman may fill every rack again');

  // the other Claim buttons: a daily task, a weekly task, the season track, the weekly roastery order
  await p.evaluate(() => { const T = window.__T, S = T.S; S.xp = T.XP_AT(12); S.tabs.ranks = S.tabs.shop = true; S.request = null; T.newTasks(); S.tasks[0].have = S.tasks[0].goal; S.season.stars = 40; S.weekly.mine = S.weekly.target; S.weekly.claimed = false; if (S.wtasks && S.wtasks.list) S.wtasks.list[0].have = S.wtasks.list[0].goal; });
  await clean(); await p.evaluate(() => { window.__T.S.dailySub = 'today'; window.__T.setTab('orders'); }); await p.waitForTimeout(400);
  let before = await p.evaluate(() => window.__T.S.coins + window.__T.S.points + window.__T.S.cranes);
  ok(await tapAct('task:0') && await p.evaluate(() => window.__T.S.tasks[0].done || window.__T.S.tasks[0].have < window.__T.S.tasks[0].goal), 'a daily task\'s Claim pays');
  const wt = await p.evaluate(() => !!(window.__T.S.wtasks && window.__T.S.wtasks.list)); if (wt) ok(await tapAct('wtask:0') && await p.evaluate(() => window.__T.S.wtasks.list[0].done), 'a weekly task\'s Claim pays');
  ok(await tapAct('weekly') && await p.evaluate(() => window.__T.S.weekly.claimed), 'the weekly roastery order\'s Claim pays');
  ok(await p.evaluate(() => window.__T.S.coins + window.__T.S.points + window.__T.S.cranes) > before, 'and the rewards arrived');
  await clean(); await p.evaluate(() => { window.__T.S.rankSub = 'season'; window.__T.setTab('ranks'); }); await p.waitForTimeout(400);
  ok(await tapAct('tierall') && await p.evaluate(() => Object.keys(window.__T.S.season.claimed).length > 0), 'Claim all on the season track pays');

  // the co-op: an order sized to this farm, and a Claim button that pays
  await p.evaluate(() => { const T = window.__T, S = T.S; S.prestige = 2; S.soldLog = {}; T.S.rateG = 0; });
  const est = await p.evaluate(async () => { const T = window.__T; await T.coopAct({ act: 'find' }); return T.NET.coop && T.NET.coop.order.target; });
  ok(est >= C.COOP_MIN_PER, 'joined a co-op; its first order asks ' + est + ' kg');
  const sized = await p.evaluate(async () => { const T = window.__T; await T.coopAct({ act: 'leave' }); T.S.soldLog = { '2026-10-24': 90000 }; await T.coopAct({ act: 'find' }); return T.NET.coop.order.target; });
  ok(sized >= 30000, 'a farm that sold 90,000 kg this week gets an order of ' + sized + ' kg (a third of its week), not 2,000');
  await p.evaluate(async () => { const T = window.__T, o = T.NET.coop.order; T.S.cw = { wk: o.week, kg: o.target, sent: 0 }; await T.coopSync(true); });
  await clean(); await p.evaluate(() => { window.__T.S.dailySub = 'coop'; window.__T.setTab('orders'); }); await p.waitForTimeout(500);
  before = await p.evaluate(() => window.__T.S.cranes);
  await p.screenshot({ path: path.join(shots, 'coop-claim.png') });
  ok(await tapAct('coop:claim'), 'the co-op order shows a Claim button');
  await p.waitForTimeout(800);
  const got = await p.evaluate(() => window.__T.S.cranes) - before;
  ok(got === 10, 'tapping it pays every tier: +' + got + ' cranes');
  ok(!(await p.evaluate(() => !!document.querySelector('#panel [data-act="coop:claim"]'))), 'and the button goes');

  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
})();
