/* Replay check with the pacing bot: does a whole run, played twice, land on the same save?
   The bot (sim/policy.js) plays the real game code the way the pacing runs do, here inside the seal (seal.js). Two fresh pages
   play the same run side by side; the save is compared after every 10 game minutes. The bot chooses from what it reads in the
   save, so any chance or time the seal misses shows up as a different save within a few minutes.

   Usage:
     python3 game-assets/play/build.py /tmp/beju-farm.html
     node game-assets/rules/replay_bot.js /tmp/beju-farm.html [active|casual] [target prestige=2] [seed=1] [max building level=5] [out.json]
   PW_MODULE names the Playwright module (default: playwright); MAXH caps game hours (default 80). Exits 1 when the runs differ. */
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), cp = require('child_process');
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const seal = require('./seal.js');
const src = process.argv[2], mode = process.argv[3] || 'active', target = +(process.argv[4] || 2), SEED = +(process.argv[5] || 1), maxBuild = +(process.argv[6] || 5), out = process.argv[7] || '';
const SIM = path.join(__dirname, '..', 'sim'), MAXH = +process.env.MAXH || 80;
if (!src) { console.error('usage: node replay_bot.js <built.html> [active|casual] [target prestige] [seed] [max building level] [out.json]'); process.exit(2); }

async function open(browser, file) {
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(seal, SEED);
  await p.addInitScript(() => {
    window.__SIM = true; window.__clock = (s) => window.__seal.advance(s * 1000);
    window.__verbs = {}; document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('[data-act]'); const k = b ? b.dataset.act.split(':')[0] : (e.target && e.target.id === 'cv' ? '(canvas tap)' : ''); if (k) window.__verbs[k] = (window.__verbs[k] || 0) + 1; }, true);
  });
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.__G);
  await p.addScriptTag({ path: path.join(SIM, 'policy.js') });
  await p.evaluate((m) => { BOT.cfg.mode = m.mode; BOT.cfg.maxBuild = m.maxBuild; BOT.G.S.sfx = false; BOT.G.S.music = false; }, { mode, maxBuild });
  return { p, errs };
}
const chunk = (x) => x.p.evaluate((casual) => {
  const r = BOT.run(600); if (casual) BOT.away(7.8);
  r.save = JSON.stringify(BOT.G.S, (k, v) => (k === 'target' || k === 'claim' || k === 'path' || typeof v === 'function') ? undefined : v); return r;
}, mode === 'casual');
function diff(a, b, at, acc) {
  if (acc.length > 40 || a === b) return acc;
  if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => diff(a[k], b[k], at ? at + '.' + k : k, acc)); return acc; }
  acc.push(at + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); return acc;
}

(async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'beju-replay-')), 'sim.html');
  cp.execFileSync('python3', [path.join(SIM, 'mk.py'), src, file]);
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const A = await open(browser, file), B = await open(browser, file);
  const hashes = []; let bad = -1, fields = [], r = { t: 0, lv: 0, p: 0 }, n = 0;
  for (;; n++) {
    let a, b;
    try { [a, b] = await Promise.all([chunk(A), chunk(B)]); } catch (e) { console.log('\npage error: ' + e.message.split('\n')[0]); bad = n; break; }
    r = a; hashes.push(crypto.createHash('sha1').update(a.save).digest('hex').slice(0, 12));
    if (a.save !== b.save) { bad = n; fields = diff(JSON.parse(a.save), JSON.parse(b.save), '', []); break; }
    process.stdout.write('\r' + mode + ' ' + (r.t / 3600).toFixed(1) + ' h played, level ' + r.lv + ', prestige ' + r.p + '   ');
    if (r.p >= target || r.t / 3600 > MAXH || A.errs.length > 5) break;
  }
  const verbs = await A.p.evaluate(() => window.__verbs), random = await A.p.evaluate(() => Math.random());
  await browser.close();
  const names = Object.keys(verbs).sort();
  console.log('\n' + mode + ' run, seed ' + SEED + ': ' + (r.t / 3600).toFixed(1) + ' game hours in ' + (n + 1) + ' checks, reached level ' + r.lv + ' and prestige ' + r.p + (r.p >= target ? '' : ' (target ' + target + ' not reached)'));
  console.log('commands used: ' + names.length + ' verbs, ' + names.reduce((s, k) => s + verbs[k], 0) + ' taps and commands; page errors ' + A.errs.length + ' and ' + B.errs.length);
  [...new Set(A.errs.concat(B.errs))].slice(0, 5).forEach((e) => console.log('  error: ' + e));
  if (bad < 0) console.log('REPLAY MATCHES: the two runs have the same save at every check');
  else { console.log('REPLAY DIFFERS at check ' + bad + ' (' + (bad * 10) + ' to ' + (bad * 10 + 10) + ' game minutes)'); fields.forEach((f) => console.log('  ' + f.slice(0, 200))); }
  if (out) fs.writeFileSync(out, JSON.stringify({ mode, seed: SEED, target, hours: r.t / 3600, level: r.lv, prestige: r.p, verbs, hashes, firstDifference: bad, fields, errs: A.errs, nextRandom: random }));
  process.exit(bad < 0 ? 0 : 1);
})();
