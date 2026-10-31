/* Currency-per-screen audit: open every tab, sub-page and Kona page on a late-game farm and list which currencies each one
   asks you to spend (button prices; rewards like "+60 know-how" or "Claim 10 cranes" don't count) and which it only mentions.
   The rule: one spend currency a screen, island money on the island. A mix that's there on purpose is listed in MIXED with its
   reason; anything else fails, so a new screen can't quietly add a second price.
   node currency_audit.js <test.html> [out.json] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const MIXED = {   /* screen: [currencies, why it's allowed] */
  farm_fields: [['coins', 'know-how'], 'estate stages cost both: the late-game sink for each'],
  shop_style: [['coins', 'cranes'], 'two sections, each with its own wallet line: building styles for cranes, decor for coins'],
  shop_roastery: [['coins', 'cranes'], 'two Beju brand pieces (the Beju label, the gold noren) for cranes, the rest for coins']
};
const CUR = { coins: /\bcoins?\b/i, 'know-how': /\bknow-how\b/i, cranes: /\bcranes?\b/i, stars: /\b(season )?stars?\b/i, shells: /\bshells?\b/i };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.goto('file://' + path.resolve(process.argv[2])); await g.waitForTimeout(900);
  const clean = () => g.evaluate(() => { const T = window.__T; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('pcer').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  await g.evaluate(() => {   /* a prestige 6 farm with every tab, both islands' worth of money, Kona open */
    const T = window.__T, S = T.S; S.guide = T.GUIDE.length; S.prestige = 6; S.coins = 5e7; S.points = 5e6; S.cranes = 500; S.season.stars = 40;
    Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); Object.assign(S.tabs, { ranks: true, shop: true, unlock: true, upgrades: true, orders: true });
    ['mogiana', 'huila', 'gedeo', 'toba', 'turrialba'].forEach((l) => { S.farms[l].unlocked = true; S.farms[l].mastery = 30; });
    T.konaFresh && T.konaFresh(); if (S.kona) S.kona.shells = 2000;
  });
  for (let k = 0; k < 3; k++) { await g.waitForTimeout(300); await clean(); }
  const read = () => g.evaluate((CURSRC) => {
    const CUR = Object.fromEntries(Object.entries(CURSRC).map(([k, s]) => [k, new RegExp(s, 'i')]));
    const P = document.getElementById('panel'), spend = {}, say = {};
    P.querySelectorAll('button, .btn').forEach((el) => {
      if (el.offsetParent === null) return;
      const t = el.innerText.replace(/\s+/g, ' ').trim(), sm = ((el.querySelector('small') || {}).innerText || '').trim();   /* the whole button: Kona puts the number in the label, "shells" under it */
      if (!/\d/.test(t) || /^\+/.test(sm) || /^(\+|claim\b)/i.test(t)) return;   /* a price has a number in it; a reward isn't a price */
      for (const k of Object.keys(CUR)) if (CUR[k].test(t)) (spend[k] = spend[k] || []).push(t.slice(0, 40));
    });
    const txt = P.innerText.replace(/\s+/g, ' ');
    for (const k of Object.keys(CUR)) { const m = txt.match(new RegExp('.{0,40}' + CUR[k].source + '.{0,20}', 'i')); if (m) say[k] = m[0]; }
    return { spend, say };
  }, Object.fromEntries(Object.entries(CUR).map(([k, r]) => [k, r.source])));
  const pages = [
    ['farm', { farmSub: 'fields', isle: false }, 'farm_fields'], ['farm', { farmSub: 'upgrades', isle: false }, 'farm_upgrades'], ['farm', { farmSub: 'build', isle: false }, 'farm_build'], ['farm', { farmSub: 'staff', isle: false }, 'farm_staff'],
    ['mill', {}, 'mill'], ['roast', { roastSub: 'roasting' }, 'roast'], ['roast', { roastSub: 'counter' }, 'roast_counter'],
    ['unlock', { unTab: 'coffees' }, 'unlock_coffees'], ['unlock', { unTab: 'processes' }, 'unlock_processes'], ['unlock', { unTab: 'farms' }, 'unlock_farms'], ['unlock', { unTab: 'research' }, 'unlock_research'], ['unlock', { unTab: 'notebook' }, 'unlock_notebook'],
    ['orders', { dailySub: 'today' }, 'daily'],
    ['ranks', { rankSub: 'board', rankTab: 'season' }, 'ranks_board'], ['ranks', { rankSub: 'season' }, 'ranks_season'], ['ranks', { rankSub: 'prestige' }, 'ranks_prestige'], ['ranks', { rankSub: 'records' }, 'ranks_records'],
    ['looks', {}, 'looks'],
    ['shop', { shopTab: 'cranes' }, 'shop_boosts'], ['shop', { shopTab: 'chars' }, 'shop_farmer'], ['shop', { shopTab: 'bskin' }, 'shop_style'], ['shop', { shopTab: 'roast' }, 'shop_roastery'], ['shop', { shopTab: 'beju' }, 'shop_real'],
    ['farm', { isle: true, konaSub: 'island' }, 'kona_island'], ['farm', { isle: true, konaSub: 'shop' }, 'kona_shop'], ['farm', { isle: true, konaSub: 'log' }, 'kona_log']
  ];
  const out = [];
  for (const [tab, set, name] of pages) {
    await clean();
    await g.evaluate(([tab, set]) => { const T = window.__T; Object.assign(T.S, set); T.setTab(tab); T.renderPanel(); }, [tab, set]);
    await g.waitForTimeout(250); await clean(); await g.evaluate(() => window.__T.renderPanel());
    const r = await read(), sp = Object.keys(r.spend), island = name.startsWith('kona_');
    const flags = [];
    const ok = MIXED[name] && sp.every((k) => MIXED[name][0].includes(k));
    if (sp.length > 1 && !ok) flags.push(sp.length + ' spend currencies');
    if (!island && (r.spend.shells || r.say.shells)) flags.push('shells off the island');
    if (island && sp.some((k) => k !== 'shells')) flags.push('mainland money on the island');
    out.push({ name, spend: r.spend, say: r.say, flags });
    console.log((flags.length ? '!! ' : '   ') + name.padEnd(17) + ' spend: ' + (sp.join(', ') || '-').padEnd(26) + ' mentions: ' + (Object.keys(r.say).filter((k) => !r.spend[k]).join(', ') || '-') + (flags.length ? '   <- ' + flags.join('; ') : ok && sp.length > 1 ? '   (allowed: ' + MIXED[name][1] + ')' : ''));
  }
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  const bad = out.filter((o) => o.flags.length).length;
  console.log('screens', out.length, 'flagged', bad, 'errors', errs.length ? errs : 0);
  if (bad || errs.length) process.exitCode = 1;
  await b.close();
})();
