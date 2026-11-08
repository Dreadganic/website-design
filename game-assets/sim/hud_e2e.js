/* The new HUD (design doc "Beju Farm: HUD design"), checked against its acceptance criteria: no page scrolling on small phones,
   at most 12% of a 390 x 844 screen covered on a quiet farm, 44 px to tap, text sizes and contrast, nothing moving with reduced
   motion, repeated notices merged, a crack never waiting behind notices, a full store that doesn't rely on colour, and a phone
   held sideways asked to turn upright. Also: what shows when (hearts, level, store), the Settings switches, and Classic.
   node hud_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log('ok', m); } else { fail++; console.log('FAIL', m); } };
const SEL = ['.top', '#hearts', '#hudLevel', '.hud-r .clock', '#hudCoins', '#hudCranes', '#hudStore', '#musicBtn', '#sfxBtn', '#gearBtn', '#tabs'];   /* what was measured at 19.5% */

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (w, h, o = {}) => {
    const g = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, ...o }); g.on('pageerror', (e) => errs.push(e.stack.slice(0, 400)));
    await g.goto('file://' + file); await g.waitForTimeout(800);
    await g.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 7; S.pwalkDone = true; S.practiceTip = true; S.coins = 5e7; S.cranes = 545;
      Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.xp = (T.XP_AT(40) + T.XP_AT(41)) / 2; S.hearts = T.maxHearts(); Object.keys(S.cherries).forEach((k) => { S.cherries[k] = 0; });
      for (let i = 0; i < 9; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.refreshHud(); T.renderPanel(); });
    await g.waitForTimeout(200);
    await g.evaluate(() => { const T = window.__T; for (let i = 0; i < 9; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.hudQuiet(); T.refreshHud(); });
    return g;
  };
  const cover = (g) => g.evaluate((sel) => { const W = innerWidth, H = innerHeight, grid = new Uint8Array(W * H);
    sel.concat(['#gearTop']).forEach((s) => { const e = document.querySelector(s); if (!e || e.hidden || e.offsetParent === null) return; const q = e.getBoundingClientRect();
      for (let y = Math.max(0, Math.floor(q.top)); y < Math.min(H, q.bottom); y++) for (let x = Math.max(0, Math.floor(q.left)); x < Math.min(W, q.right); x++) grid[y * W + x] = 1; });
    let n = 0; for (const v of grid) n += v; return Math.round(n / (W * H) * 1000) / 10; }, SEL);

  /* 1. small phones: nothing off screen, no page scrolling */
  for (const [w, h] of [[360, 640], [390, 844], [320, 568]]) {
    const g = await open(w, h);
    const r = await g.evaluate(() => { const top = document.querySelector('.top').getBoundingClientRect(), tabs = document.getElementById('tabs').getBoundingClientRect();
      return { scroll: document.documentElement.scrollHeight - innerHeight, top: top.top, bottom: tabs.bottom, h2: document.getElementById('app').classList.contains('h2') }; });
    ok(r.h2, w + 'x' + h + ': the new HUD is on by default');
    ok(r.scroll <= 0, w + 'x' + h + ': the page does not scroll (' + r.scroll + ' px over)');
    ok(r.top >= 0 && r.bottom <= h, w + 'x' + h + ': the place bar and tabs are on screen (' + Math.round(r.top) + ', ' + Math.round(r.bottom) + ')');
    if (w === 360) {
      /* 3. tap targets: 44 px, or a 44 px hit area around a small pill */
      const small = await g.evaluate(() => [...document.querySelectorAll('.top button, #tabs button, .pill.go')].filter((e) => e.offsetParent && !e.hidden).map((e) => {
        const q = e.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        if (e.matches('#tabs .tab') && q.height >= 44 && q.width >= 36) return null;   /* eight tabs on a 360 px phone are 38 wide: the tab bar is not being changed (design doc, Layout zones) */
        if (q.width >= 44 && q.height >= 44) return null;
        const hits = [[cx, cy - 21], [cx, cy + 21], [q.left + 2, cy], [q.right - 2, cy]].every(([x, y]) => { const t = document.elementFromPoint(x, y); return t && (t === e || e.contains(t)); });
        return hits && q.width >= 40 ? null : (e.id || e.className) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height); }).filter(Boolean));
      ok(small.length === 0, 'everything tappable on the HUD is 44 px to tap: ' + small.join('; '));
      /* 4. text: 11 px on the HUD, 10 px on tabs, 4.5 to 1 against white and black under any see-through background */
      await g.evaluate(() => { const S = window.__T.S; S.hearts = 2; S.xp = window.__T.XP_AT(41) - 1; window.__T.refreshHud(); });
      const text = await g.evaluate(() => {
        const rgba = (s) => { const m = (s.match(/[\d.]+/g) || []).map(Number); return m.length >= 3 ? [m[0], m[1], m[2], m.length > 3 ? m[3] : 1] : [0, 0, 0, 0]; };
        const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const under = (e, base) => { const layers = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
          let col = base; layers.reverse().forEach((c) => { col = col.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); }); return col; };
        const out = [];
        document.querySelectorAll('.top *, .top, .hud-l *, .hud-r *, #tabs *').forEach((e) => {
          if (!e.offsetParent || e.closest('[aria-hidden="true"]') || e.closest('.toast') || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
          const cs = getComputedStyle(e), px = parseFloat(cs.fontSize), min = e.closest('#tabs') ? 10 : 11, fg = rgba(cs.color);
          const worst = Math.min(...[[255, 255, 255], [0, 0, 0]].map((base) => { const bg = under(e, base), L1 = lum(fg), L2 = lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); }));
          if (px < min - 0.01 || worst < 4.5) out.push('"' + e.textContent.trim().slice(0, 12) + '" ' + px + 'px ' + worst.toFixed(1) + ':1');
        });
        return out; });
      ok(text.length === 0, 'HUD text is at least 11 px (10 on tabs) and 4.5:1: ' + text.join('; '));
      const clip = await g.evaluate(() => [...document.querySelectorAll('#tabs .tab')].filter((t) => t.scrollWidth > t.clientWidth + 1).map((t) => t.textContent));
      ok(clip.length === 0, 'no tab label is cut off at 360 px: ' + clip.join(', '));
    }
    await g.close();
  }

  /* 2. the quiet farm covers at most 12% of a 390 x 844 phone; Classic is the 19.5% it was */
  {
    const g = await open(390, 844);
    const quiet = await g.evaluate(() => { const a = document.getElementById('app'); return ['sh-hearts', 'sh-lv', 'sh-store'].filter((c) => a.classList.contains(c)); });
    ok(quiet.length === 0, 'a quiet farm shows no hearts, level or store: ' + quiet.join(', '));
    const n = await cover(g);
    ok(n <= 12, 'the quiet farm is covered ' + n + '% (at most 12%)');
    if (shots) await g.screenshot({ path: shots + '/hud_quiet.png' });
    await g.evaluate(() => { window.__T.act('hudmode:classic'); });
    const c = await cover(g);
    ok(c > 17, 'Classic covers what it did (' + c + '%)');
    ok(await g.evaluate(() => !document.getElementById('app').classList.contains('h2') && !!document.getElementById('sfxBtn').offsetParent && !document.getElementById('gearTop').offsetParent), 'Classic brings the sound buttons back and hides the new gear');
    await g.evaluate(() => { window.__T.act('hudmode:new'); });
    ok(await g.evaluate(() => document.getElementById('app').classList.contains('h2') && !!document.getElementById('gearTop').offsetParent && !document.getElementById('sfxBtn').offsetParent), 'New again: one gear in the place bar');

    /* what shows when */
    const shown = (g2) => g2.evaluate(() => ({ hearts: !!document.getElementById('hearts').offsetParent, lv: !!document.getElementById('hudLevel').offsetParent, store: !!document.getElementById('hudStore').offsetParent }));
    const at = await g.evaluate(() => { const T = window.__T, S = T.S; T.setTab('farm'); document.getElementById('sheet').hidden = true; S.hearts = T.maxHearts(); const f = S.farms[S.loc];
      f.shrubs.forEach((s) => { if (s) { s.p = 1; s.claim = null; } });
      const cv = document.getElementById('cv'), q = cv.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect(), k = q.width / cv.width * 2;
      const s = f.shrubs.find((x) => { if (!x) return false; const y = q.top + (x.y + 6) * k; return y > st.top + 80 && y < st.bottom - 60; });
      return s ? [q.left + (s.x + 9) * k, q.top + (s.y + 6) * k] : null; });
    const h0 = await g.evaluate(() => window.__T.S.hearts);
    await g.mouse.click(at[0], at[1]); await g.waitForTimeout(100);
    const picked = await g.evaluate(() => window.__T.S.hearts);
    ok(picked < h0, 'a tap on a ripe bush picks by hand (' + h0 + ' → ' + picked + ' hearts)');
    ok((await shown(g)).hearts, 'picking by hand brings the hearts up at once');
    await g.waitForTimeout(3300); await g.evaluate(() => window.__T.refreshHud());
    ok(!(await shown(g)).hearts, 'and they go 3 s after the last pick');
    await g.evaluate(() => { const T = window.__T; T.S.hearts = 1; T.refreshHud(); });
    ok((await shown(g)).hearts, 'hearts show when low');
    await g.evaluate(() => { const T = window.__T, S = T.S; S.hearts = T.maxHearts(); S.xp = T.XP_AT(41) + 1; T.refreshHud(); });
    ok((await shown(g)).lv, 'the level pill shows after a level rises');
    await g.evaluate(() => { const T = window.__T, S = T.S; S.xp = (T.XP_AT(41) * 0.95 + T.XP_AT(42) * 0.05); T.refreshHud(); });
    await g.evaluate(() => { const T = window.__T; T.S.xp = T.XP_AT(41) + (T.XP_AT(42) - T.XP_AT(41)) * 0.93; T.refreshHud(); });
    ok((await shown(g)).lv, 'and when a level is under 10% away');
    await g.evaluate(() => { const T = window.__T, S = T.S; S.lv.storage = 5; S.cherries.caturra = Math.ceil(T.cap() * 0.85); T.refreshHud(); });
    ok((await shown(g)).store, 'the store shows from 80% full');

    /* 8. a full store says so in words, not only colour */
    const full = await g.evaluate(() => { const T = window.__T, S = T.S; S.cherries.caturra = T.cap(); T.refreshHud(); const st = document.getElementById('hudStore'); return { word: (st.querySelector('.sfull') || {}).textContent, label: st.getAttribute('aria-label'), cls: st.classList.contains('full') }; });
    ok(full.word === 'FULL' && full.cls && /full/.test(full.label || ''), 'a full store shows the word FULL and reads out "full": ' + JSON.stringify(full));
    if (shots) await g.screenshot({ path: shots + '/hud_full.png' });
    if (shots) { await g.evaluate(() => { const st = document.createElement('style'); st.id = 'greytest'; st.textContent = 'html { filter: grayscale(1); }'; document.head.appendChild(st); }); await g.screenshot({ path: shots + '/hud_full_grey.png' }); await g.evaluate(() => document.getElementById('greytest').remove()); }
    await g.evaluate(() => { const T = window.__T, S = T.S; Object.keys(S.cherries).forEach((k) => { S.cherries[k] = 0; }); T.refreshHud(); });

    /* the Settings switches */
    await g.evaluate(() => { const T = window.__T; T.act('hudshow:lv'); T.act('hudshow:store'); T.S.xp = (T.XP_AT(41) + T.XP_AT(42)) / 2; window.__lvNow = Date.now(); });
    await g.waitForTimeout(6200); await g.evaluate(() => window.__T.refreshHud());
    const always = await shown(g);
    ok(always.lv && always.store, 'Always show keeps the level bar and store up: ' + JSON.stringify(always));
    await g.evaluate(() => { const T = window.__T; T.act('hudshow:lv'); T.act('hudshow:store'); T.refreshHud(); });
    const off = await shown(g);
    ok(!off.lv && !off.store, 'and off again they hide: ' + JSON.stringify(off));
    const sz = await g.evaluate(() => { const T = window.__T, f = () => parseFloat(getComputedStyle(document.getElementById('hudCoins')).fontSize); const a = f(); T.act('tscale:1.5'); const c = f(); const big = document.getElementById('app').classList.contains('big'); T.act('tscale:1'); return [a, c, big, f()]; });
    ok(sz[0] === 14 && sz[1] === 21 && sz[2] && sz[3] === 14, 'Large text: the coin pill goes from 14 to 21 px at 150% and back: ' + sz.join(', '));
    const snd = await g.evaluate(() => { const T = window.__T, S = T.S, a = S.sfx, m = S.music; T.act('snd:sfx'); T.act('snd:music'); const r = [S.sfx !== a, S.music !== m]; T.act('snd:sfx'); T.act('snd:music'); return r.concat([S.sfx === a, S.music === m]); });
    ok(snd.every(Boolean), 'sound effects and music switch from Settings: ' + snd.join(', '));
    ok(await g.evaluate(() => { document.getElementById('gearTop').click(); return window.__T.tab === 'test' || document.getElementById('sheetT').textContent === 'Settings'; }), 'the gear in the place bar opens Settings');
    ok(await g.evaluate(() => /Screen/.test(document.getElementById('panel').innerText) && /Text size/.test(document.getElementById('panel').innerText) && /Always show/.test(document.getElementById('panel').innerText)), 'Settings has Screen, Text size and Always show');

    /* 6. repeats merge: ten identical notices show once; quick picks add up in one float */
    const tq = await g.evaluate(() => { const T = window.__T; T.toastQ.length = 0; document.getElementById('toast').hidden = true; for (let i = 0; i < 10; i++) T.toast('A crow flew over the farm.'); return [document.getElementById('toast').textContent, T.toastQ.length]; });
    ok(tq[0] === 'A crow flew over the farm.' && tq[1] === 0, 'ten identical notices in a second show once, with none waiting: ' + tq.join(', '));
    const fl = await g.evaluate(() => { const T = window.__T; T.floats.length = 0; for (let i = 0; i < 4; i++) T.floatKg(50 + i * 10, 100, 3); return T.floats.map((f) => f.text); });
    ok(fl.length === 1 && fl[0] === '+12 kg', 'four quick picks show one float: ' + fl.join(', '));

    /* the moment card: a window the game would open by itself waits at the bottom of the map, one at a time, and opens on a tap */
    const mc = await g.evaluate(async () => { const T = window.__T, S = T.S; T.setTab('farm'); T.act('sheetmin'); for (let i = 0; i < 5 && !document.getElementById('guide').hidden; i++) { const gb = document.querySelector('#guide button'); if (!gb) break; gb.click(); T.refreshHud(); } T.laterQ.length = 0; T.toastQ.length = 0; document.getElementById('toast').hidden = true; document.getElementById('app').classList.remove('notice'); T.refreshHud();
      T.later('Contract complete!', 'Kenji: +9,000 coins', '<h2>Contract complete!</h2><button class="btn green" data-act="close">Great</button>');
      T.later('Free coffee earned!', 'A free 100 g sample', '<h2>Free coffee earned!</h2><button class="btn green" data-act="close">Wonderful</button>');
      const m = document.getElementById('moment'), q = m.getBoundingClientRect(), tabs = document.getElementById('tabs').getBoundingClientRect();
      const r = { cls: document.getElementById('app').className, guide: document.getElementById('guide').hidden ? '' : document.getElementById('guide').innerText.slice(0, 60), modal: !document.getElementById('modal').hidden, shown: !!m.offsetParent, text: m.innerText, gap: Math.round(tabs.top - q.bottom) };
      m.querySelector('[data-act="later:open"]').click(); r.opened = document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText; T.closeModal(); document.getElementById('modal').hidden = true;
      r.next = m.innerText; m.querySelector('[data-act="later:skip"]').click(); r.after = !!m.offsetParent; r.q = T.laterQ.length; return r; });
    ok(!mc.modal && mc.shown && /Contract complete!/.test(mc.text) && /\+1/.test(mc.text), 'a contract completing waits as a card, with one more behind it: ' + JSON.stringify(mc).slice(0, 160));
    ok(mc.gap >= 0 && mc.gap <= 12, 'the card sits just above the tabs (' + mc.gap + ' px)');
    ok(/Contract complete!/.test(mc.opened), 'Open shows the full window');
    ok(/Free coffee earned!/.test(mc.next) && !mc.after && mc.q === 0, 'then the next card, and the cross puts it away');
    const ns = await g.evaluate(() => { const T = window.__T; T.toast('Level 42! Hearts refilled.'); const t = document.getElementById('toast').getBoundingClientRect(), tabs = document.getElementById('tabs').getBoundingClientRect(), stage = document.getElementById('stage').getBoundingClientRect(); return { gap: Math.round(tabs.top - t.bottom), inMap: t.top > stage.top + stage.height / 2, h: Math.round(t.height) }; });
    ok(ns.gap >= 0 && ns.gap <= 12 && ns.inMap && ns.h <= 64, 'a notice is a card in the same place, at most two lines: ' + JSON.stringify(ns));
    const so = await g.evaluate(async () => { const T = window.__T; document.getElementById('toast').hidden = true; document.getElementById('app').classList.remove('notice'); T.setTab('mill'); T.later('Order delivered', 'Colombia arrived', '<h2>Order delivered</h2>'); T.refreshHud(); await new Promise((r) => setTimeout(r, 400)); const m = document.getElementById('moment').getBoundingClientRect(), sh = document.getElementById('sheet'); const r = { open: !sh.hidden, gap: Math.round(sh.getBoundingClientRect().top - m.bottom) }; T.laterQ.length = 0; T.laterShow(); return r; });
    ok(so.open && so.gap >= 0 && so.gap <= 12, 'with a sheet open the card sits just above it: ' + JSON.stringify(so));
    const cl = await g.evaluate(() => { const T = window.__T; T.act('hudmode:classic'); T.later('Order delivered', 'x', '<h2>Order delivered</h2>'); const r = !document.getElementById('modal').hidden && /Order delivered/.test(document.getElementById('modalCard').innerText); T.closeModal(); document.getElementById('modal').hidden = true; T.act('hudmode:new'); return r; });
    ok(cl, 'Classic opens the window as before');
    const day = await g.evaluate(() => { const T = window.__T, S = T.S; T.setTab('farm'); T.act('sheetmin'); S.checkin.n = 3; S.checkin.last = '2000-1-1'; T.checkIn(); return { modal: !document.getElementById('modal').hidden && document.getElementById('modalCard').innerText.slice(0, 40), card: document.getElementById('moment').innerText }; });
    ok(!day.modal && /Daily brew calendar/.test(day.card), 'the day\'s calendar comes as a card, not a window: ' + JSON.stringify(day));
    await g.evaluate(() => { const T = window.__T; T.laterQ.length = 0; T.laterShow(); });

    /* 7. a crack is never queued behind notices */
    const ck = await g.evaluate(async () => { const T = window.__T, S = T.S, R = S.roastery; T.setTab('farm');
      for (let i = 0; i < 4; i++) T.toast('Notice number ' + i + ' for the queue.');
      R.roasters = [{ key: 'caturra.washed', profile: 'medium', kg: 1, coins: 1, pts: 1, cup: 84, start: Date.now() - 750000, dur: 1e6, crack: 0, cw: 0.16 }];
      await new Promise((r) => setTimeout(r, 300)); return !document.getElementById('crackGo').hidden && !!document.getElementById('crackGo').offsetParent; });
    ok(ck, 'a crack shows at once with notices waiting');
    await g.evaluate(() => { window.__T.S.roastery.roasters = []; });
    await g.close();
  }

  /* 5. reduced motion: nothing on the HUD slides, bobs or pulses */
  {
    const g = await open(390, 844, { reducedMotion: 'reduce' });
    const moving = await g.evaluate(async () => { const T = window.__T, S = T.S; S.hearts = 1; S.xp = T.XP_AT(41) + 1; T.toast('Level up!'); T.refreshHud(); await new Promise((r) => setTimeout(r, 120));
      return document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return t && t.closest && t.closest('.top, .hud-l, .hud-r, #tabs, #guide'); }).map((a) => (a.effect.target.id || a.effect.target.className) + ':' + (a.animationName || a.transitionProperty)); });
    ok(moving.length === 0, 'with reduced motion nothing moves on the HUD: ' + moving.join(', '));
    const rise = await g.evaluate(() => { const T = window.__T; T.floats.length = 0; T.floatKg(50, 100, 3); return T.floats[0].y; });
    ok(rise === 100, 'floats stay where they are (they fade out instead)');
    await g.close();
  }

  /* 9. portrait only: a phone held sideways is asked to turn upright; upright, the card stays away */
  {
    const g = await open(844, 390, { isMobile: true });
    const turn = await g.evaluate(() => { const t = document.getElementById('turn'), q = t.getBoundingClientRect(); return { d: getComputedStyle(t).display, w: q.width, h: q.height, text: t.innerText }; });
    ok(turn.d === 'grid' && turn.w >= 844 && turn.h >= 390 && /upright/.test(turn.text), 'sideways: the "turn your phone upright" card fills the screen: ' + JSON.stringify(turn));
    if (shots) await g.screenshot({ path: shots + '/hud_sideways.png' });
    await g.close();
    const p = await open(390, 844, { isMobile: true });
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('turn')).display === 'none'), 'upright: no card');
    await p.close();
    const d = await open(844, 390, { hasTouch: false });
    ok(await d.evaluate(() => getComputedStyle(document.getElementById('turn')).display === 'none'), 'a short computer window keeps the game (no card)');
    await d.close();
  }

  ok(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'ALL ' + pass + ' PASS');
  process.exit(fail ? 1 : 0);
})();
