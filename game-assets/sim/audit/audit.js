/* Plays Beju Farm to prestige 3 like a new player who follows every arrow: Rosa's lessons, the unlock walks and the prestige walk are
   done by tapping what the arrow points at; every window is read and answered with its main button. The bot only spends and runs the
   mill when no lesson, walk or window is up. Logs where each arrow lands, what covers it, and the order things happen in.
   node audit.js <page.html> <out.json> [speed] [maxMinutes]   (see ../README.md) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [html, out] = [process.argv[2], process.argv[3]], speed = +(process.argv[4] || 20), maxMin = +(process.argv[5] || 30), dir = path.dirname(out);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await g.goto('file://' + html); await g.waitForTimeout(600);
  await g.addScriptTag({ path: __dirname + '/policy_audit.js' }); await g.addScriptTag({ path: __dirname + '/aud_page.js' });
  await g.evaluate((sp) => { const S = window.__A.S; S.sfx = false; S.music = false; S.speed = sp; BOT.cfg.mode = 'active'; BOT.cfg.maxBuild = 5;
    setInterval(() => { try { BOT.decide(); } catch (e) { window.__berr = (window.__berr || []).concat(e.message).slice(-5); } }, 250); }, speed);
  const t0 = Date.now(), secs = () => Math.round((Date.now() - t0) / 1000), log = [], issues = []; let shots = 0;
  const E = (kind, o) => { const e = Object.assign({ t: secs(), kind }, o); log.push(e); return e; };
  const snap = async (name) => { if (shots >= 60) return null; shots += 1; const f = 'shot' + String(shots).padStart(2, '0') + '-' + name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + '.png'; await g.screenshot({ path: path.join(dir, f) }); return f; };
  const I = () => g.evaluate(() => AUD.inspect());
  const click = async (x, y) => { await g.mouse.click(x, y); await sleep(450); };
  const clickSel = async (sel) => { const r = await g.evaluate(async (q) => { const find = () => [...document.querySelectorAll(q)].find((e) => e.offsetParent !== null); let el = find(); if (!el) return null; el.scrollIntoView({ block: 'center' }); await new Promise((ok) => setTimeout(ok, 350)); el = find(); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + Math.min(b.height / 2, 14) }; }, sel); if (!r) return false; await click(r.x, r.y); return true; };   /* found again after the wait: a page that re-rendered meanwhile has a new element */
  const issue = async (s, what, extra) => { const e = { t: secs(), lv: s.lv, p: s.p, what, mode: s.mode, step: stepName(s), guideText: s.guideText, target: s.target, tab: s.tab, sheet: s.sheet, full: s.full }; Object.assign(e, extra || {}); e.shot = await snap(what); issues.push(e); E('issue', e); console.log('  ISSUE', what, '|', e.step, '|', JSON.stringify(e.target || {}).slice(0, 140)); };
  const stepName = (s) => (s.mode === 'guide' || s.mode === 'guide-wait' ? 'lesson ' + (s.guide + 1) : s.mode === 'pwalk' ? 'prestige walk ' + s.pwalk : s.mode === 'nav' ? 'walk ' + s.nav : '');
  let lastKey = '', tries = 0, lastModal = '', lastLv = 0, lastP = 0, prevTabs = '', lastPrint = 0, sawArrowKey = '', botHelpUntil = 0, done = false, lastWalkStart = {};
  const setBot = (on) => g.evaluate((v) => { window.__allowBot = v; }, on);
  while (!done && secs() < maxMin * 60) {
    if (botHelpUntil && Date.now() > botHelpUntil) { botHelpUntil = 0; await setBot(false); }
    let s; try { s = await I(); } catch (e) { E('error', { msg: e.message }); await sleep(500); continue; }
    if (s.lv !== lastLv || s.p !== lastP) { if (s.p !== lastP) E('prestige', { p: s.p, lv: s.lv }); else E('level', { lv: s.lv, p: s.p }); lastLv = s.lv; lastP = s.p; }
    const tk = s.tabs.join(','); if (tk !== prevTabs) { if (prevTabs) E('tabs', { lv: s.lv, p: s.p, open: s.tabs.filter((x) => !prevTabs.split(',').includes(x)) }); prevTabs = tk; }
    if (secs() - lastPrint >= 30) { await g.evaluate((sp) => { window.__A.S.speed = sp; }, speed); lastPrint = secs(); fs.appendFileSync(path.join(dir, 'progress.txt'), secs() + 's  P' + s.p + ' Lv' + s.lv + ' need ' + s.need + ' mode=' + s.mode + ' ' + stepName(s) + ' tab=' + s.tab + ' mins=' + s.mins + ' issues=' + issues.length + '\n'); console.log(secs() + 's  P' + s.p + ' Lv' + s.lv + ' mode=' + s.mode + ' ' + stepName(s) + ' tab=' + s.tab + (s.sheet ? (s.full ? ' full' : ' half') : ' closed') + ' issues=' + issues.length); }
    if (s.p >= 3 && !s.modal && !s.pcer && !s.pwalk && !s.mode) { E('end', { lv: s.lv, p: s.p }); done = true; break; }
    if (s.modal) {
      const key = s.modal.text;
      const btn = s.modal.buttons.find((x) => x.green) || s.modal.buttons[0];
      if (!btn) { await issue(s, 'window with no button', { text: key }); await g.evaluate(() => window.__G.closeModal()); continue; }
      const before = { tab: s.tab, sheet: s.sheet };
      if (key === lastModal && tries++ > 6) { await issue(s, 'window does not close', { text: key }); await g.evaluate(() => window.__G.closeModal()); tries = 0; continue; }
      if (btn.covered) await issue(s, 'window button covered by ' + btn.covered, { text: key });
      if (await g.evaluate(() => !!document.querySelector('#modalCard #nameAsk'))) await g.fill('#nameAsk', 'Audit farmer');   /* the name window: a new player types a name first */
      await click(btn.x, btn.y);
      const a = await I();
      E('window', { lv: s.lv, p: s.p, text: key, buttons: s.modal.buttons.map((x) => x.label), pressed: btn.label, act: btn.act, queued: s.queue, during: s.mode && s.mode !== 'guide-wait' ? stepName(s) : '', before, after: { tab: a.tab, sheet: a.sheet, full: a.full, scene: a.scene, farmSub: a.farmSub, unTab: a.unTab, rankSub: a.rankSub, mode: a.mode, modalNext: !!a.modal } });
      lastModal = key; continue;
    }
    if (s.pcer) { E('ceremony', { p: s.p, text: s.pcer.text, under: s.pcer.under }); await click(s.pcer.x, s.pcer.y); continue; }
    if (s.mode === 'guide' || s.mode === 'nav' || s.mode === 'pwalk') {
      const key = stepName(s) + '|' + (s.target ? s.target.i + s.target.sel : 'none') + '|' + s.guideN;
      if (key !== lastKey) {
        if (stepName(s) !== (lastKey.split('|')[0])) { E('step', { lv: s.lv, p: s.p, step: stepName(s), text: s.guideText, chain: s.chain }); lastWalkStart[stepName(s)] = secs(); }
        E('arrow', { lv: s.lv, p: s.p, step: stepName(s), target: s.target, arrow: s.arrow, arrowOff: s.arrowOff, cover: s.cover, tab: s.tab, sheet: s.sheet, full: s.full, scene: s.scene });
        lastKey = key; tries = 0; sawArrowKey = '';
      }
      if (!s.target) { if (tries === 2) await issue(s, 'nothing to point at'); }
      else {
        if (sawArrowKey !== key && tries === 1) {   /* judge the arrow once it has had a frame to settle */
          sawArrowKey = key;
          if (!s.arrow) await issue(s, 'arrow hidden');
          else if (s.arrowOff > 14) await issue(s, 'arrow off target by ' + s.arrowOff + 'px', { arrow: s.arrow });
          if (s.cover && s.cover.length) await issue(s, 'target covered: ' + s.cover.join('; '));
          if (!s.target.inView) await issue(s, 'target off screen');
          if (s.target.inSheetView === false) await issue(s, 'target scrolled out of the sheet');
        }
        if (tries >= 1) {
          const before = s; await click(s.target.x, s.target.y); const a = await I();
          const sameStep = stepName(a) === stepName(before) && a.guideN === before.guideN;
          if (sameStep && a.target && a.target.i > before.target.i) await issue(before, 'tap led further away (' + before.target.sel + ' -> ' + a.target.sel + ')', { after: { tab: a.tab, sheet: a.sheet } });
          if (!sameStep || (a.target && a.target.i < before.target.i)) E('tap', { step: stepName(before), on: before.target.sel, result: stepName(a) !== stepName(before) ? 'step done' : 'closer', tab: a.tab, sheet: a.sheet, full: a.full });
        }
      }
      tries += 1;
      if (tries > 3) await sleep(tries > 10 ? 1500 : 600);   /* waiting on the game: a lot drying, a bush ripening, coins */
      if (tries === 30) { await issue(s, 'stuck: needed the bot to play on'); await setBot(true); botHelpUntil = Date.now() + 15000; }
      if (tries >= 70) { await issue(s, 'stuck: skipped'); if (!(await clickSel('[data-act="guideNext"]')) && !(await clickSel('[data-act="navend"]'))) await clickSel('[data-act="pwalkend"]'); tries = 0; }
      continue;
    }
    lastKey = '';
    if (s.lv >= s.need && s.p < 3 && !s.pwalk && (s.pwalkDone || s.p > 0) && s.mode !== 'guide-wait') {   /* prestige the way a player would, through Ranks */
      E('prestige-intent', { lv: s.lv, p: s.p });
      await g.evaluate(() => BOT.knowhow());
      if (!(s.tab === 'ranks' && s.sheet)) await clickSel('.tab[data-tab="ranks"]');
      await clickSel('[data-act="ranksub:prestige"]');
      const ok = (await clickSel('[data-act="prestigeAsk"]')) || (await clickSel('[data-act="prestige"]'));
      if (!ok) await issue(await I(), 'could not find the Prestige button');
      await sleep(400); continue;
    }
    if (s.skinPicks > 0 && s.p >= 1 && !s.mode) {   /* a new outfit to choose, in Looks */
      if (!(s.tab === 'looks' && s.sheet)) await clickSel('.tab[data-tab="looks"]');
      if (await clickSel('.look.pick')) E('outfit', { p: s.p }); else await sleep(400);
      continue;
    }
    await sleep(350);
  }
  const data = await g.evaluate(() => ({ toasts: window.__toasts, berr: window.__berr || [] }));
  Object.assign(data, { log, issues, errs, secs: secs() });
  fs.writeFileSync(out, JSON.stringify(data, null, 1));
  console.log('done in', secs(), 's;', issues.length, 'issues;', errs.length, 'page errors', errs.slice(0, 3), data.berr);
  await b.close();
})();
