/* What covers each map: for several screen sizes, every interface element drawn over the map (HUD, corner buttons, the gold and
   crack buttons, the guide bar showing an event, the open sheet), as rectangles in map pixels at scroll 0, plus the map window and scroll room.
   node measure.js <test page from sim/mktest.py> <run.js output with a late-game save> <outdir>  ->  outdir/cover.json, then check.py */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [page, stateFile, out] = process.argv.slice(2);
const SIZES = [[360, 640], [375, 667], [390, 844], [430, 932], [820, 1180], [1280, 800]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const d = JSON.parse(fs.readFileSync(stateFile, 'utf8')); const st = d.final || d; st.last = Date.now(); st.name = st.name || 'Mock'; st.nameOk = st.name;
  const res = [];
  for (const [w, h] of SIZES) {
    const g = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 800 });
    await g.addInitScript((st) => { localStorage.clear(); localStorage.setItem('beju-farm-save-v3', JSON.stringify(st)); }, st);
    await g.goto('file://' + path.resolve(page)); await g.waitForTimeout(1200);
    const clean = () => g.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('pcer').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
    for (let k = 0; k < 3; k++) { await g.waitForTimeout(250); await clean(); }
    for (const sc of ['farm', 'mill', 'roast']) for (const sheet of [false, true]) {
      await g.evaluate(([sc, sheet]) => { const T = window.__T; if (sc === 'farm') T.S.loc = 'huila'; T.setTab(sc, !sheet); }, [sc, sheet]); await g.waitForTimeout(400); await clean();
      await g.waitForTimeout(150);
      const r = await g.evaluate((sheet) => {   /* one synchronous pass, so the game loop can't hide the buttons again before we look */
        const app = document.getElementById('app'), sh = document.getElementById('sheet'); sh.style.transition = 'none'; if (sheet) app.classList.remove('full');
        const gd = document.getElementById('guide'), wasG = gd.hidden, wasT = gd.innerHTML; gd.hidden = false;
        const go = document.getElementById('goldGo'), wasGo = go.hidden, wasGoT = go.textContent; go.hidden = false; go.textContent = 'Golden bush! Tap it';
        const cg = document.getElementById('crackGo'), wasC = cg.hidden; cg.hidden = false;
        gd.innerHTML = '<span class="gstep">Event</span><span class="gtext">Pigs in the Huila field!</span>'; const wasGh = app.style.getPropertyValue('--gh'); if (!gd.closest('.sheet')) app.style.setProperty('--gh', (gd.offsetHeight + 6) + 'px');   /* the game lifts the corner buttons above the guide bar */
        document.getElementById('scroller').scrollTop = 0;
        const cv = document.getElementById('cv').getBoundingClientRect(), sc = document.getElementById('scroller'), sr = sc.getBoundingClientRect(), k = cv.width / 192;
        const toMap = (q) => ({ x: (q.left - cv.left) / k, y: (q.top - cv.top) / k, w: q.width / k, h: q.height / k });
        const vis = (el) => el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
        const over = [];
        const add = (el, name) => { if (!vis(el)) return; const q = el.getBoundingClientRect(); const a = { left: Math.max(q.left, sr.left), top: Math.max(q.top, sr.top), right: Math.min(q.right, sr.right), bottom: Math.min(q.bottom, sr.bottom) }; if (a.right <= a.left || a.bottom <= a.top) return; over.push(Object.assign({ name }, toMap({ left: a.left, top: a.top, width: a.right - a.left, height: a.bottom - a.top }))); };
        add(document.getElementById('hearts'), 'hearts'); add(document.getElementById('hudLevel'), 'level pill');
        document.querySelectorAll('.hud-r .clock > *').forEach((e) => add(e, 'clock'));
        ['hudCoins', 'hudCranes', 'hudStore'].forEach((id) => add(document.getElementById(id), 'coin pills'));
        ['sfxBtn', 'musicBtn', 'gearBtn'].forEach((id) => add(document.getElementById(id), 'corner buttons'));
        add(go, 'gold button'); add(cg, 'crack button');
        if (!gd.closest('.sheet')) add(gd, 'guide bar');
        if (sheet) add(sh, 'sheet');
        const extra = new Set();
        for (let y = sr.top + 2; y < sr.bottom; y += 6) for (let x = sr.left + 2; x < sr.right; x += 6) { const e = document.elementFromPoint(x, y); if (e && e.id !== 'cv' && !e.closest('.hud-l, .hud-r, .sound, .goldgo, #guide, #sheet, #scroller')) extra.add((e.id || e.className || e.tagName) + ''); }
        const out = { k, win: toMap(sr), room: (sc.scrollHeight - sc.clientHeight) / k, over, extra: [...extra], guideIn: gd.closest('.sheet') ? 'sheet' : 'map' };
        gd.hidden = wasG; gd.innerHTML = wasT; app.style.setProperty('--gh', wasGh); go.hidden = wasGo; go.textContent = wasGoT; cg.hidden = wasC; sh.style.transition = '';
        return out;
      }, sheet);
      res.push(Object.assign({ w, h, scene: sc, sheet }, r));
    }
    await g.close();
  }
  fs.writeFileSync(path.join(out, 'cover.json'), JSON.stringify(res, null, 1));
  res.forEach((r) => console.log(r.w + 'x' + r.h, r.scene, r.sheet ? 'sheet' : 'map', 'k=' + r.k.toFixed(2), 'win', r.win.h.toFixed(0), 'room', r.room.toFixed(0), 'guide in', r.guideIn, r.over.filter((o) => /guide|sheet|gold|crack/.test(o.name)).map((o) => o.name + ' y' + o.y.toFixed(0) + '-' + (o.y + o.h).toFixed(0)).join('; '), 'extra', r.extra.join(',')));
  await b.close();
})();
