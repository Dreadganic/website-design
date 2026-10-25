/* Plays every counter sound in a headless browser and measures it, so a silent or broken one shows up.
   node game-assets/storefront/sound_levels.js   (exits 1 on a page error or a silent sound) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const A = path.join(__dirname, '../audio/'), page = path.join(os.tmpdir(), 'shop-sfx-levels.html');
fs.writeFileSync(page, '<!doctype html><meta charset="utf-8"><body><script>' + fs.readFileSync(A + 'sfx.js', 'utf8') + '\n' + fs.readFileSync(A + 'shop-sfx.js', 'utf8') + '</script>');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + page);
  const res = await p.evaluate(async () => {
    SFX.unlock(); const K = SFX.kit(), an = K.ac.createAnalyser(); an.fftSize = 2048; K.out.connect(an);
    const buf = new Float32Array(an.fftSize), wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    for (const n of ShopSFX.names) { ShopSFX.play(n); let peak = 0; const end = performance.now() + 1800; while (performance.now() < end) { an.getFloatTimeDomainData(buf); for (const v of buf) peak = Math.max(peak, Math.abs(v)); await wait(25); } out[n] = +peak.toFixed(3); await wait(200); }
    return out;
  });
  let bad = 0; Object.entries(res).forEach(([n, pk]) => { const q = pk < 0.02; bad += q; console.log(n.padEnd(10), pk, q ? 'SILENT' : ''); });
  console.log('page errors', errs.length ? errs : 'none'); if (bad || errs.length) process.exitCode = 1; await b.close();
})();
