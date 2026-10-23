/* Interface sweep: load a game state, open every tab and sub-page, screenshot each, and flag sideways scrolling, clipped buttons,
   broken images and "undefined"/"NaN" text. The state is a run.js output (its final save) or 'fresh'; prep-js runs in the page first.
   node ui_sweep.js <test.html> <state.json|fresh> <outdir> <label> [width] [height] [prep-js] */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [page, stateFile, outDir, label, W = '390', H = '844', prep = ''] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, hasTouch: true });
  const errs = []; g.on('pageerror', (e) => errs.push(e.message)); g.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  let state = null;
  if (stateFile !== 'fresh') { const d = JSON.parse(fs.readFileSync(stateFile, 'utf8')); state = d.final || d; state.last = Date.now(); }
  await g.addInitScript((st) => { try { localStorage.clear(); if (st) localStorage.setItem('beju-farm-save-v3', JSON.stringify(st)); } catch (e) {} }, state);
  await g.goto('file://' + path.resolve(page)); await g.waitForTimeout(900);
  const clean = () => g.evaluate(() => { const T = window.__T; (T.modalQueue || []).length = 0; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('pcer').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  if (prep) await g.evaluate(prep);
  for (let k = 0; k < 3; k++) { await g.waitForTimeout(300); await clean(); }
  const issues = [];
  const check = async (where) => {
    const r = await g.evaluate(() => {
      const out = [], P = document.getElementById('panel'), vis = (el) => el.offsetParent !== null;
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page scrolls sideways: ' + document.documentElement.scrollWidth + ' > ' + innerWidth);
      const txt = document.body.innerText;
      ['undefined', 'NaN', 'null', '[object', 'Infinity'].forEach((w) => { const re = new RegExp('(^|[^a-z])' + w.replace('[', '\\[') + '([^a-z]|$)', 'i'); if (re.test(txt)) { const i = txt.search(re); out.push('text has "' + w + '": …' + txt.slice(Math.max(0, i - 50), i + 40).replace(/\s+/g, ' ') + '…'); } });
      document.querySelectorAll('#panel *, .tabs *, .top *, .hud-l *, .hud-r *, #modalCard *').forEach((el) => {
        if (!vis(el)) return;
        if (el.closest('.ccards, .nbw')) return;
        const cs = getComputedStyle(el);
        if ((el.matches('button, .btn, .chip, .dchip, .plate, .fit') ) && (el.scrollWidth > el.clientWidth + 2) && cs.overflow !== 'visible') out.push('clipped ' + el.tagName.toLowerCase() + '.' + el.className + ': "' + el.innerText.replace(/\s+/g, ' ').slice(0, 50) + '" ' + el.scrollWidth + '>' + el.clientWidth);
        const r = el.getBoundingClientRect(); if (r.width && P.contains(el) && (r.right > P.getBoundingClientRect().right + 1 || r.left < P.getBoundingClientRect().left - 1) && !el.closest('.subtabs')) out.push('sticks out of the sheet: ' + el.tagName.toLowerCase() + '.' + el.className + ' "' + (el.innerText || '').replace(/\s+/g, ' ').slice(0, 40) + '" ' + Math.round(r.left) + '-' + Math.round(r.right));
      });
      document.querySelectorAll('img').forEach((im) => { if (vis(im) && im.complete && !im.naturalWidth && !/^data:,$/.test(im.getAttribute('src') || '')) out.push('broken img ' + (im.getAttribute('src') || '').slice(0, 40)); });
      return [...new Set(out)].slice(0, 25);
    });
    r.forEach((x) => issues.push(where + ': ' + x));
  };
  const shot = async (name) => { await g.screenshot({ path: path.join(outDir, label + '_' + name + '.png') }); };
  const open = async (tab, set) => {
    await clean();
    await g.evaluate(([tab, set]) => { const T = window.__T, S = T.S; Object.assign(S, set || {}); T.setTab(tab); T.renderPanel(); }, [tab, set]);
    await g.waitForTimeout(350); await clean(); await g.evaluate(() => window.__T.renderPanel()); await g.waitForTimeout(150);
  };
  // the map itself, sheet put away
  await clean(); await shot('00map'); await check('map');
  const pages = [
    ['farm', { farmSub: 'fields' }, 'farm_fields'], ['farm', { farmSub: 'upgrades' }, 'farm_upgrades'], ['farm', { farmSub: 'build' }, 'farm_build'], ['farm', { farmSub: 'staff' }, 'farm_staff'],
    ['mill', {}, 'mill'], ['roast', {}, 'roast'],
    ['unlock', { unTab: 'coffees' }, 'unlock_coffees'], ['unlock', { unTab: 'processes' }, 'unlock_processes'], ['unlock', { unTab: 'farms' }, 'unlock_farms'], ['unlock', { unTab: 'research' }, 'unlock_research'], ['unlock', { unTab: 'notebook' }, 'unlock_notebook'],
    ['orders', { dailySub: 'today' }, 'daily'],
    ['ranks', { rankSub: 'board', rankTab: 'season' }, 'ranks_board'], ['ranks', { rankSub: 'board', rankTab: 'all' }, 'ranks_legacy'], ['ranks', { rankSub: 'season' }, 'ranks_season'], ['ranks', { rankSub: 'prestige' }, 'ranks_prestige'], ['ranks', { rankSub: 'records' }, 'ranks_records'],
    ['looks', {}, 'looks'],
    ['shop', { shopTab: 'cranes' }, 'shop_boosts'], ['shop', { shopTab: 'chars' }, 'shop_farmer'], ['shop', { shopTab: 'bskin' }, 'shop_style'], ['shop', { shopTab: 'roast' }, 'shop_roastery'], ['shop', { shopTab: 'beju' }, 'shop_real'],
    ['test', {}, 'settings']
  ];
  for (const [tab, set, name] of pages) {
    const locked = await g.evaluate((t) => { const T = window.__T; return !!document.querySelector('.tab.locked[data-tab="' + t + '"]'); }, tab);
    await open(tab, set);
    await shot(name + (locked ? '_LOCKED' : '')); await check(name);
  }
  // the mill and roastery maps with the sheet put away
  for (const t of ['mill', 'roast']) { await clean(); await g.evaluate((t) => { window.__T.setTab(t, true); }, t); await g.waitForTimeout(400); await clean(); await shot('map_' + t); await check('map_' + t); }
  fs.writeFileSync(path.join(outDir, label + '_issues.json'), JSON.stringify({ issues, errs }, null, 1));
  console.log(label, 'issues', issues.length, 'errors', errs.length);
  issues.slice(0, 60).forEach((x) => console.log('  ' + x)); errs.slice(0, 10).forEach((x) => console.log('  ERR ' + x));
  await b.close();
})();
