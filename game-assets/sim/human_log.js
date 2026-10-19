/* human.js plus a log of everything the player is told: pop-ups, toasts, guide steps, unlock walks, tabs, and how much text each tab shows.
   node human_log.js <page.html> <out.json> [target prestige] [seed] */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const [html, out, target, seed] = [process.argv[2], process.argv[3], +(process.argv[4] || 3), +(process.argv[5] || 7)];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-11-02T19:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/' + html); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate((process_locks) => { BOT.cfg.human = true; BOT.cfg.active = true; BOT.cfg.maxBuild = 10; BOT.cfg.locks = process_locks; BOT.G.S.sfx = false; BOT.G.S.music = false; }, process.argv[6] !== 'nolocks');
  await p.evaluate(() => {
    const G = window.__G; window.__LOG = []; window.__TXT = [];
    const L = (k, x) => __LOG.push({ t: Math.round(BOT.t), lv: G.level(), p: G.S.prestige, k, x });
    const clean = (h) => { const d = document.createElement('div'); d.innerHTML = h; d.querySelectorAll('button').forEach((x) => x.remove()); return d.textContent.replace(/\s+/g, ' ').trim(); };
    __UI.wrap((html) => { const d = document.createElement('div'); d.innerHTML = html; const ti = (d.querySelector('h2, .coach-t small') || {}).textContent || ''; const tx = clean(html); L('modal', { ti, w: tx.split(' ').length, tx: tx.slice(0, 400) }); }, (m) => L('toast', m));
    let lastG = -1, lastNav = null, lastLv = 0, lastP = 0, tabs = {}, avail = {}, uiT = 0, golden = false;
    const words = () => { const el = document.getElementById('panel'); const all = el.innerText.replace(/\s+/g, ' ').trim(); const help = [...el.querySelectorAll('.help')].map((x) => x.innerText).join(' ').replace(/\s+/g, ' ').trim(); return [all ? all.split(' ').length : 0, help ? help.split(' ').length : 0]; };
    window.__snapTabs = (why) => { const S = G.S, row = { t: Math.round(BOT.t), lv: G.level(), p: S.prestige, why, tabs: {} };
      ['farm', 'mill', 'unlock', 'orders', 'shop', 'ranks', 'looks', 'roast'].forEach((k) => { const btn = document.querySelector('.tab[data-tab="' + k + '"]'); if (!btn || btn.classList.contains('locked')) return; G.setTab(k); row.tabs[k] = words(); });
      const hs = S.helpSeen; S.helpSeen = new Proxy({}, { get: () => true }); row.seen = {}; ['farm', 'mill', 'unlock', 'orders', 'shop', 'ranks', 'looks', 'roast'].forEach((k) => { if (row.tabs[k]) { G.setTab(k); row.seen[k] = words()[0]; } }); S.helpSeen = hs;
      G.setTab('farm'); __TXT.push(row); };
    const t0 = G.tick; G.tick = function (d) { const r = t0.apply(this, arguments); const S = G.S;
      if (S.guide !== lastG) { const g = G.GUIDE[S.guide]; L('guide', g ? { n: S.guide, ch: g.ch, text: g.text, say: g.say || '', when: !!g.when } : { n: S.guide, end: true }); lastG = S.guide; }
      if (S.nav !== lastNav) { if (S.nav) L('nav', S.nav); lastNav = S.nav; }
      if (G.level() !== lastLv) { lastLv = G.level(); L('level', lastLv); if (lastLv <= 14 || lastLv % 5 === 0) __snapTabs('lv' + lastLv); }
      if (S.prestige !== lastP) { lastP = S.prestige; L('prestige', lastP); __snapTabs('P' + lastP); }
      Object.keys(S.tabs).forEach((k) => { if (S.tabs[k] && !tabs[k]) { tabs[k] = true; L('tab', k); } });
      __UI.NAV.forEach((n) => { if (!avail[n.id] && n.when()) { avail[n.id] = true; L('avail', n.id); } });
      if (G.golden && !golden) { golden = true; L('golden', 1); }
      if ((uiT += d) >= 1) { uiT = 0; __UI.renderGuide(); }
      return r; };
  });
  let r = { p: 0 }, s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const sessions = []; let playH = 0;
  const save = async (partial) => { const d = await p.evaluate(() => ({ log: window.__LOG, txt: window.__TXT, events: BOT.events, buys: BOT.buys, snaps: BOT.snaps })); Object.assign(d, { sessions, playH, errs, partial }); fs.writeFileSync(out, JSON.stringify(d)); };
  while (r.p < target && playH < 30 && errs.length < 5) {
    const mins = 20 + Math.floor(rnd() * 26);
    for (let m = 0; m < mins; m += 5) { r = await p.evaluate(() => BOT.run(300, 6)); if (r.p >= target) break; }
    playH += mins / 60;
    const h = 2 + Math.floor(rnd() * 8), cap = await p.evaluate(() => (BOT.G.S.prestige >= 3 ? 18 : 12));
    sessions.push({ mins, away: Math.min(h, cap), at: await p.evaluate(() => Math.round(BOT.t)) });
    if (r.p < target) { await p.evaluate((x) => { window.__LOG.push({ t: Math.round(BOT.t), lv: BOT.G.level(), p: BOT.G.S.prestige, k: 'away', x }); BOT.away(x); }, Math.min(h, cap)); }
    await save(true);
  }
  await save(false); console.log('played', playH.toFixed(1), 'h, sessions', sessions.length, 'prestige', r.p, 'errors', errs.slice(0, 3));
  await b.close();
})();
