/* The seal: runs in the page before any game code. Chance comes from a seed; the clock, performance.now and every timer
   only move when __seal.advance(ms) is called; frames are never scheduled; the network always fails; there is no sound. Shared by the replay tools. */
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
  window.AudioContext = window.webkitAudioContext = undefined;   /* no sound: the synths draw their noise from Math.random, and an audio context starts in real time, so sound left on would use up the game's chance at moments no run can repeat */
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
module.exports = seal;
