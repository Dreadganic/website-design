/* Can the interface take more screens? On three phone widths, with everything open, this checks that the bottom bar's eight tabs
   sit on one row with no clipped label, and that every row of sub-tabs (each tab's, each island page's) fits on one row with
   no clipped label. Rows that only appear online (Ranks' Cup, Daily's Co-op) are checked at their fullest by adding the missing
   buttons with their real labels. It also reports the headroom: whether each row would still fit one more sub-tab, and that a
   ninth bottom tab would not fit. Add a new screen as a sub-tab where there's headroom, and run this.
   Rows are counted by layout position (offsetTop), so a tab's bounce when it first opens doesn't count as a second row.
   node nav_capacity.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const FULL = { ranks: ['Board', 'Season', 'Prestige', 'Cup', 'Records'], orders: ['Today', 'Las Nubes Co-op'], roast: ['Roasting', 'Counter'] };   /* the fullest rows: Cup and the co-op only show online, the Counter from roastery reputation 5; a co-op's name can run to about 15 letters */
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const errs = [], head = [];
  for (const [w, h] of [[320, 568], [360, 640], [390, 844]]) {
    const g = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true }); g.on('pageerror', (e) => errs.push(e.message));
    await g.goto('file://' + file); await g.waitForTimeout(700);
    const E = (f, a) => g.evaluate(f, a);
    await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 7; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.tabs.looks = true; S.navSeen = new Proxy({}, { get: () => true }); S.nav = null; S.rev.cur = null; S.xp = 1e7;
      S.route = T.routeFresh(); S.route.seen = true; S.route.mig = 1; ['pier', 'isle_re', 'isle_ba', 'isle_ga'].forEach((k) => { S.route.bd[k] = 1; }); T.bmTick(); S.bm.seen = true; T.konaTick(); S.kona.seen = true; S.re = T.reFresh(); S.re.seen = true; S.ba = T.baFresh(); S.ba.seen = true; S.ga = T.gaFresh(); S.ga.seen = true; });
    await E(() => window.__T.setTab('farm')); await g.waitForTimeout(700);   /* the bar redraws with every tab open */
    const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
    /* the bottom bar */
    const bar = await E(() => { const tabs = [...document.querySelectorAll('#tabs .tab')], rows = new Set(tabs.map((t) => t.offsetTop)).size;
      const clipped = tabs.filter((t) => [...t.querySelectorAll('span, b, small')].concat([t]).some((x) => x.scrollWidth > x.clientWidth + 1)).map((t) => t.dataset.tab);
      return { n: tabs.length, rows, clipped, wPx: Math.round(tabs[0].getBoundingClientRect().width) }; });
    ok(bar.n === 8 && bar.rows === 1, w + 'px: the bottom bar holds its 8 tabs on one row (' + bar.rows + ' rows)');
    ok(!bar.clipped.length, w + 'px: no bottom tab label is clipped' + (bar.clipped.length ? ': ' + bar.clipped.join(', ') : ''));
    /* every row of sub-tabs */
    const views = [['farm', { farmSub: 'fields', isle: false }], ['roast', { roastSub: 'roasting' }], ['unlock', {}], ['orders', {}], ['ranks', {}], ['looks', {}], ['shop', { shopTab: 'cranes' }],
      ['farm', { isle: 'hb' }], ['farm', { isle: 'bm' }], ['farm', { isle: true }], ['farm', { isle: 're' }], ['farm', { isle: 'ba' }], ['farm', { isle: 'ga' }]];
    for (const [t, set] of views) {
      await E(([t, set]) => { const T = window.__T; Object.assign(T.S, set); T.setTab(t); T.renderPanel(); }, [t, set]); await g.waitForTimeout(120); await clean();
      const r = await E(([t, full]) => {
        const P = document.getElementById('panel'); let row = P.querySelector('.subtabs') || P.querySelector('.seg');
        if (full && (!row || !row.classList.contains('subtabs'))) { row = document.createElement('div'); row.className = 'seg subtabs'; row.innerHTML = '<button type="button" aria-pressed="true"></button>'; P.prepend(row); }   /* a row that only shows online: drawn as the game would */
        if (!row) return null;
        if (full) { const b0 = row.querySelector('button'); row.innerHTML = ''; full.forEach((l) => { const x = b0.cloneNode(false); x.textContent = l; row.appendChild(x); }); }
        const bs = [...row.querySelectorAll('button')], measure = () => ({ rows: new Set(bs.map((x) => x.offsetTop)).size, clipped: bs.filter((x) => x.scrollWidth > x.clientWidth + 1 || x.scrollHeight > x.clientHeight + 2).map((x) => x.textContent.trim()) });
        const now = measure(), labels = bs.map((x) => x.textContent.trim());
        const extra = bs[0].cloneNode(false); extra.textContent = 'Collection'; row.appendChild(extra); bs.push(extra); const more = measure(); extra.remove(); bs.pop();   /* one more sub-tab, with a long-ish label */
        return { labels, rows: now.rows, clipped: now.clipped, roomFor1: more.rows === 1 && !more.clipped.length, sub: !!row.classList.contains('subtabs') };
      }, [t, FULL[t] && !set.isle ? FULL[t] : null]);
      if (!r) continue;
      const name = (set.isle ? 'island ' + (set.isle === true ? 'kona' : set.isle) : t) + ' [' + r.labels.join(' | ') + ']';
      ok(r.rows === 1, w + 'px: ' + name + ' fits on one row (' + r.rows + ' rows)');
      ok(!r.clipped.length, w + 'px: ' + name + ' has no clipped label' + (r.clipped.length ? ': ' + r.clipped.join(', ') : ''));
      if (w === 320) head.push(name + (r.roomFor1 ? ' · room for one more' : ' · full'));
    }
    /* a ninth bottom tab doesn't fit: new screens go in as sub-tabs */
    const ninth = await E(() => { const barEl = document.getElementById('tabs'), x = barEl.querySelector('.tab').cloneNode(true); barEl.appendChild(x); const rows = new Set([...barEl.children].map((t) => t.offsetTop)).size; x.remove(); return rows; });
    if (w === 320) head.push('bottom bar · a ninth tab would make ' + ninth + ' rows: full');
    if (shots) { await E(() => { const T = window.__T; T.S.looksSub = 'collection'; T.setTab('looks'); T.renderPanel(); }); await g.waitForTimeout(200); await g.screenshot({ path: shots + '/looks-' + w + '.png' }); }
    await g.close();
  }
  console.log('Headroom at 320 px:\n  ' + head.join('\n  '));
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
