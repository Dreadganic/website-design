/* Replay probe: is a play session repeatable?
   Plays the built game headless inside a sealed environment (seeded chance, a clock and timers that only move when told,
   no network), records a session of taps, then plays the same taps again in a fresh page and compares the save after every step.
   A difference means something in the game reads chance, time or the outside world in a way the seal does not cover.

   Usage:
     python3 game-assets/play/build.py /tmp/beju-farm.html
     node game-assets/rules/replay_probe.js /tmp/beju-farm.html [steps=400] [seed=1] [out.json]
   PW_MODULE names the Playwright module to use (default: playwright). Exits 1 when the two runs differ. */
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const src = process.argv[2], STEPS = +(process.argv[3] || 400), SEED = +(process.argv[4] || 1), out = process.argv[5] || '';
if (!src) { console.error('usage: node replay_probe.js <built.html> [steps] [seed] [out.json]'); process.exit(2); }

/* the page with its loop and save on window.__R, and the loop not started: the probe drives every frame */
function makePage() {
  let t = fs.readFileSync(src, 'utf8');
  const a = 'requestAnimationFrame(loop);\nif (needsName()';
  if (t.split(a).length !== 2) throw new Error('the loop start was not found once in ' + src);
  t = t.replace(a, 'window.__R = { loop, get S() { return S; } };\nif (needsName()');
  if (!t.includes('<meta charset')) t = '<meta charset="utf-8">' + t;
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'beju-replay-')), 'probe.html');
  fs.writeFileSync(f, t); return f;
}

/* runs in the page before any game code: the seal */
function seal(seed) {
  let s = seed >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const RD = Date, T0 = RD.parse('2026-10-17T09:00:00+09:00'); let now = T0;
  class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } }
  window.Date = FD;
  performance.now = () => now - T0;
  let id = 1; const timers = [];
  window.setTimeout = (fn, ms, ...a) => { timers.push({ id, at: now + (+ms || 0), fn, a }); return id++; };
  window.setInterval = (fn, ms, ...a) => { timers.push({ id, at: now + (+ms || 0), every: Math.max(1, +ms || 0), fn, a }); return id++; };
  window.clearTimeout = window.clearInterval = (k) => { const i = timers.findIndex((x) => x.id === k); if (i >= 0) timers.splice(i, 1); };
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
  window.fetch = () => Promise.reject(new Error('sealed'));
  try { navigator.sendBeacon = () => false; } catch (e) {}
  try { localStorage.clear(); } catch (e) {}
  window.__seal = {
    now: () => now,
    advance(ms) {   /* move the clock, running timers in order of time, then of creation */
      const end = now + ms;
      for (;;) {
        let k = -1;
        for (let i = 0; i < timers.length; i++) if (timers[i].at <= end && (k < 0 || timers[i].at < timers[k].at || (timers[i].at === timers[k].at && timers[i].id < timers[k].id))) k = i;
        if (k < 0) break;
        const x = timers[k]; now = Math.max(now, x.at);
        if (x.every) x.at = now + x.every; else timers.splice(k, 1);
        if (typeof x.fn === 'function') x.fn(...x.a);
      }
      now = end;
    }
  };
}

/* runs in the page: one step of the session. With no command it chooses one (recording); with one it repeats it (replaying). */
function step(arg) {
  const { n, cmd, pick } = arg, R = window.__R, Z = window.__seal;
  const frames = (k) => { for (let i = 0; i < k; i++) { Z.advance(50); R.loop(performance.now()); } };
  const acts = () => [...document.querySelectorAll('[data-act]')].filter((b) => !b.disabled && b.tagName !== 'A' && b.getClientRects().length && !b.closest('[hidden]'));
  let did = cmd;
  if (!did) {
    const r = pick;   /* three numbers from the probe's own seeded stream, never from the game's */
    if (r[0] < 0.15) did = { k: 'wait', f: 20 + Math.floor(r[1] * 200) };
    else if (r[0] < 0.45) { const c = document.querySelector('canvas').getBoundingClientRect(); did = { k: 'tap', x: Math.round(c.left + r[1] * c.width), y: Math.round(c.top + r[2] * c.height) }; }
    else { const a = acts(); if (!a.length) did = { k: 'wait', f: 20 }; else { const i = Math.floor(r[1] * a.length), b = a[i]; did = { k: 'act', i, act: b.dataset.act, v: b.dataset.v == null ? null : b.dataset.v, of: a.length }; } }
  }
  let miss = '';
  if (did.k === 'wait') frames(did.f);
  else if (did.k === 'tap') { const el = document.elementFromPoint(did.x, did.y); if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: did.x, clientY: did.y })); }
  else {
    const a = acts(), b = a[did.i];
    if (!b || b.dataset.act !== did.act || (b.dataset.v == null ? null : b.dataset.v) !== did.v || a.length !== did.of) miss = 'expected ' + did.act + (did.v == null ? '' : ':' + did.v) + ' at ' + did.i + ' of ' + did.of + ', found ' + (b ? b.dataset.act + (b.dataset.v == null ? '' : ':' + b.dataset.v) : 'nothing') + ' of ' + a.length;
    else b.click();
  }
  frames(4);
  return { n, did, miss, save: JSON.stringify(R.S, (k, v) => (k === 'target' || k === 'claim' || k === 'path' || typeof v === 'function') ? undefined : v) };
}

async function session(browser, file, log) {
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(seal, SEED);
  await p.goto('file://' + file);
  await p.waitForFunction(() => window.__R);
  let s = (SEED * 7919 + 13) >>> 0; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const steps = [];
  for (let n = 0; n < STEPS; n++) {
    let r;
    try { r = await p.evaluate(step, { n, cmd: log ? log[n] : null, pick: [rnd(), rnd(), rnd()] }); }
    catch (e) { steps.push({ n, did: log ? log[n] : null, miss: 'page error: ' + e.message.split('\n')[0], hash: '', save: '' }); break; }
    r.hash = crypto.createHash('sha1').update(r.save).digest('hex').slice(0, 12); steps.push(r);
  }
  await p.close();
  return { steps, errs };
}

/* the save fields that differ between two saves, as dotted paths */
function diff(a, b, at, acc) {
  if (acc.length > 40) return acc;
  if (a === b) return acc;
  if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => diff(a[k], b[k], at ? at + '.' + k : k, acc)); return acc; }
  acc.push(at + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); return acc;
}

(async () => {
  const file = makePage();
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const A = await session(browser, file, null);
  const log = A.steps.map((x) => x.did);
  const B = await session(browser, file, log);
  await browser.close();
  const kinds = {}; log.forEach((c) => { if (c) kinds[c.k] = (kinds[c.k] || 0) + 1; });
  const verbs = new Set(log.filter((c) => c && c.k === 'act').map((c) => c.act));
  let bad = -1;
  for (let n = 0; n < Math.max(A.steps.length, B.steps.length); n++) { const x = A.steps[n], y = B.steps[n]; if (!x || !y || x.hash !== y.hash || y.miss) { bad = n; break; } }
  const last = A.steps[A.steps.length - 1], S = last && last.save ? JSON.parse(last.save) : {};
  console.log('steps ' + A.steps.length + ' of ' + STEPS + ' (waits ' + (kinds.wait || 0) + ', canvas taps ' + (kinds.tap || 0) + ', commands ' + (kinds.act || 0) + ' using ' + verbs.size + ' verbs), seed ' + SEED);
  console.log('end of session: level ' + (S.level != null ? S.level : '?') + ', coins ' + (S.coins != null ? Math.round(S.coins) : '?') + ', page errors ' + A.errs.length + ' and ' + B.errs.length);
  [...new Set(A.errs.concat(B.errs))].slice(0, 5).forEach((e) => console.log('  error: ' + e));
  let fields = [];
  if (bad < 0) console.log('REPLAY MATCHES: the save is identical after every step');
  else {
    const x = A.steps[bad], y = B.steps[bad];
    console.log('REPLAY DIFFERS at step ' + bad + ': ' + JSON.stringify(log[bad]) + (y && y.miss ? ' (' + y.miss + ')' : ''));
    if (x && y && x.save && y.save) { fields = diff(JSON.parse(x.save), JSON.parse(y.save), '', []); fields.forEach((f) => console.log('  ' + f.slice(0, 200))); }
  }
  if (out) fs.writeFileSync(out, JSON.stringify({ seed: SEED, steps: STEPS, log, hashes: A.steps.map((x) => x.hash), firstDifference: bad, fields, errs: A.errs }));
  process.exit(bad < 0 ? 0 : 1);
})();
