/* Plays every event sound in a headless browser (start, loop here and from another map, each tap, clear; usual and rare) and
   measures the output, so a silent, missing or clipping sound shows up. Takes about four minutes.
   node game-assets/events/sound_levels.js   (exits 1 on a page error or a silent part) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const A = path.join(__dirname, '../audio/');
const page = path.join(os.tmpdir(), 'event-sfx-levels.html');
fs.writeFileSync(page, '<!doctype html><meta charset="utf-8"><body><script>' + fs.readFileSync(A + 'sfx.js', 'utf8') + '\n' + fs.readFileSync(A + 'event-sfx.js', 'utf8') + '</script>');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + page);
  const res = await p.evaluate(async () => {
    SFX.unlock(); const K = SFX.kit(), an = K.ac.createAnalyser(); an.fftSize = 2048; K.out.connect(an);
    const buf = new Float32Array(an.fftSize), wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const level = async (ms) => { let peak = 0, sum = 0, n = 0; const end = performance.now() + ms; while (performance.now() < end) { an.getFloatTimeDomainData(buf); for (const v of buf) { peak = Math.max(peak, Math.abs(v)); sum += v * v; n++; } await wait(30); } return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / n).toFixed(4) }; };
    const out = [];
    for (const id of EventSFX.ids) for (const rare of [false, true]) {
      if (rare && !EventSFX.hits(id).some((x) => x.rare)) continue;
      const row = { id: id + (rare ? ' (rare)' : '') }, h = EventSFX.start(id, { rare });
      row.start = await level(1300); row.loop = await level(3500);
      h.here(false); row.away = await level(3000); h.here(true);
      row.hits = {};
      for (const x of EventSFX.hits(id)) { if (x.rare && !rare) continue; await wait(150); h.hit(x.name, 1); row.hits[x.name] = (await level(700)).peak; }
      h.clear(); row.clear = await level(1600);
      out.push(row);
    }
    return out;
  });
  let silent = 0;
  res.forEach((r) => {
    const quiet = [r.start.peak < 0.03 && 'start', r.loop.rms < 0.0005 && 'loop', r.clear.peak < 0.03 && 'clear'].concat(Object.keys(r.hits).filter((k) => r.hits[k] < 0.02)).filter(Boolean);
    silent += quiet.length;
    console.log(r.id.padEnd(22), 'start', r.start.peak, '| loop', r.loop.rms, 'away', r.away.rms, '| clear', r.clear.peak, '| taps', JSON.stringify(r.hits), quiet.length ? ' SILENT: ' + quiet.join(', ') : '');
  });
  console.log('page errors', errs.length ? errs : 'none');
  if (errs.length || silent) process.exitCode = 1;
  await b.close();
})();
