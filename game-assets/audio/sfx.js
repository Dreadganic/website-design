/* Beju Farm sound effects: soft, natural, synthesised live (no audio files).
   Every sound gets a small random pitch and timing change so repeats never sound identical.
   Usage: SFX.play('harvest'); SFX.setEnabled(false); SFX.setVolume(0.7); SFX.unlock() inside the first tap. */
const SFX = (function () {
  'use strict';
  let ac = null, out = null, verb = null, noise = null, enabled = true, volume = 0.7, unlockEl = null;
  const last = {};
  const R = (a, b) => a + Math.random() * (b - a);

  function init() {
    if (ac) return true;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    ac = new C();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    out = ac.createGain(); out.gain.value = volume; out.connect(comp); comp.connect(ac.destination);
    verb = ac.createConvolver(); const vg = ac.createGain(); vg.gain.value = 0.22; verb.connect(vg); vg.connect(out);
    const len = Math.floor(ac.sampleRate * 0.9), ir = ac.createBuffer(2, len, ac.sampleRate);   /* a small wooden room */
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }
  function silentWavUrl() {
    const n = 4000, b = new Uint8Array(44 + n), dv = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, 'data'); dv.setUint32(40, n, true); b.fill(128, 44);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }
  function unlock() {   /* iPhone: call inside a tap. Asks for media playback so the silent switch doesn't mute the game */
    if (!init()) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS: the silent clip does the same job */ }
    try { if (!unlockEl) { unlockEl = new Audio(silentWavUrl()); unlockEl.loop = true; unlockEl.setAttribute('playsinline', ''); } const p = unlockEl.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* web audio alone */ }
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start(0);
    if (ac.state !== 'running') ac.resume();
  }

  /* building blocks */
  function hiss(t, o) {   /* filtered noise: rustles, clicks, thumps, scrapes */
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noise; src.playbackRate.value = o.rate || 1;
    f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur); f.Q.value = o.q || 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(out); if (o.verb) g.connect(verb);
    src.start(t, Math.random() * 0.8); src.stop(t + o.dur + 0.02);
  }
  function tone(t, o) {   /* pitched body: pops, knocks, chimes */
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.wave || 'sine'; osc.frequency.setValueAtTime(o.f, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.dur));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(out); if (o.verb) g.connect(verb);
    osc.start(t); osc.stop(t + o.dur + 0.02);
  }
  function bell(t, f, gain, dur) { tone(t, { f, gain, dur: dur || 0.5, verb: true }); tone(t, { f: f * 2.76, gain: gain * 0.35, dur: (dur || 0.5) * 0.45, verb: true }); tone(t, { f: f * 5.4, gain: gain * 0.12, dur: (dur || 0.5) * 0.2 }); }
  const XP = [1568, 1760, 2093, 2349, 2637];

  const S = {
    harvest(t, p) {   /* leaves rustle, then the cherries pop into your basket */
      for (let i = 0; i < 3; i++) hiss(t + R(0, 0.04), { f: R(2400, 4200) * p, q: 0.9, gain: R(0.12, 0.2), dur: R(0.06, 0.11) });
      tone(t + 0.05, { f: 520 * p, f2: 1100 * p, glide: 0.05, gain: 0.22, dur: 0.09 });
    },
    brush(t, p) { hiss(t, { f: 1800 * p, q: 0.8, gain: 0.18, dur: 0.09 }); hiss(t + 0.03, { f: 2600 * p, q: 1, gain: 0.1, dur: 0.06 }); },
    pop(t, p) { tone(t, { f: 700 * p, f2: 1250 * p, glide: 0.04, gain: 0.22, dur: 0.07 }); },
    click(t, p) { hiss(t, { type: 'highpass', f: 3000, gain: 0.12, dur: 0.012 }); tone(t, { f: 1150 * p, f2: 760 * p, glide: 0.02, gain: 0.16, dur: 0.035, wave: 'triangle' }); },
    tick(t, p) { tone(t, { f: 1700 * p, f2: 1300 * p, glide: 0.015, gain: 0.09, dur: 0.025, wave: 'triangle' }); },
    page(t, p) { hiss(t, { f: 1400 * p, f2: 4200 * p, q: 0.7, gain: 0.18, dur: 0.18, attack: 0.04 }); },
    close(t, p) { hiss(t, { f: 3800 * p, f2: 1500 * p, q: 0.7, gain: 0.06, dur: 0.12, attack: 0.02 }); S.tick(t + 0.05, p * 0.9); },
    thud(t, p) { hiss(t, { type: 'lowpass', f: 420 * p, gain: 0.22, dur: 0.14 }); tone(t, { f: 95 * p, f2: 60 * p, gain: 0.25, dur: 0.14 }); hiss(t + 0.02, { f: 2200 * p, gain: 0.05, dur: 0.06 }); },
    knock(t, p) { [0, 0.13].forEach((d) => { hiss(t + d, { f: 900 * p, q: 6, gain: 0.25, dur: 0.06 }); tone(t + d, { f: 210 * p, f2: 170 * p, gain: 0.2, dur: 0.07, wave: 'triangle' }); }); },
    nope(t, p) { tone(t, { f: 170 * p, f2: 115 * p, gain: 0.22, dur: 0.16, wave: 'triangle' }); hiss(t, { type: 'lowpass', f: 600, gain: 0.08, dur: 0.1 }); },
    wood(t, p) { hiss(t, { f: R(700, 1100) * p, q: 3, gain: 0.3, dur: 0.08 }); tone(t, { f: 190 * p, f2: 120 * p, gain: 0.22, dur: 0.09, wave: 'triangle' }); },
    build(t, p) { [0, 0.24, 0.48].forEach((d, i) => S.wood(t + d, p * R(0.94, 1.08) * (i === 2 ? 0.92 : 1))); bell(t + 0.62, 1046 * p, 0.12, 0.45); },
    buy(t, p) { S.wood(t, p * 0.9); S.coins(t + 0.08, p, 2); },
    xp(t, p) { bell(t, XP[Math.floor(Math.random() * XP.length)] * p, 0.12, 0.35); },
    coins(t, p, n) { for (let i = 0; i < (n || 5); i++) S.xp(t + i * R(0.055, 0.09), p * R(0.97, 1.03)); },
    levelup(t, p) { [1046, 1318, 1568, 2093].forEach((f, i) => bell(t + i * 0.1, f * p, 0.14, 0.7)); [0.45, 0.55].forEach((d) => bell(t + d, 2637 * p, 0.06, 0.6)); },
    achieve(t, p) { bell(t, 1318 * p, 0.12, 0.6); bell(t + 0.12, 1975 * p, 0.12, 0.9); tone(t, { f: 659 * p, gain: 0.05, dur: 1.0, attack: 0.08, verb: true }); },
    pour(t, p) { for (let i = 0; i < 34; i++) { const d = Math.pow(Math.random(), 0.8) * 0.55; hiss(t + d, { f: R(2500, 5000) * p, q: 4, gain: R(0.12, 0.26) * (1 - d), dur: 0.012 }); } hiss(t, { f: 1500 * p, q: 0.6, gain: 0.08, dur: 0.5, attack: 0.05 }); },
    ding(t, p) { bell(t, 1318 * p, 0.14, 0.8); },
    dig(t, p) { [0, 0.2].forEach((d) => { for (let i = 0; i < 4; i++) hiss(t + d + i * 0.018, { type: 'lowpass', f: R(600, 1100) * p, gain: R(0.12, 0.2), dur: 0.05 }); tone(t + d, { f: 110 * p, f2: 80 * p, gain: 0.12, dur: 0.07 }); }); },
    steps(t, p) { [0, 0.26, 0.52].forEach((d) => hiss(t + d + R(0, 0.02), { f: R(1000, 1500) * p, q: 0.8, gain: 0.24, dur: 0.08 })); },
    hire(t, p) { S.steps(t, p); tone(t + 0.8, { f: 1250 * p, f2: 1600 * p, glide: 0.08, gain: 0.07, dur: 0.12, verb: true }); tone(t + 0.95, { f: 1600 * p, f2: 1300 * p, glide: 0.1, gain: 0.07, dur: 0.14, verb: true }); },
    stamp(t, p) { hiss(t, { type: 'lowpass', f: 700 * p, gain: 0.28, dur: 0.07 }); tone(t, { f: 130 * p, f2: 90 * p, gain: 0.22, dur: 0.08 }); hiss(t + 0.01, { f: 3000, q: 0.7, gain: 0.05, dur: 0.05 }); },
    contract(t, p) { S.page(t, p); S.stamp(t + 0.2, p); S.coins(t + 0.35, p, 4); },
    crane(t, p) { for (let i = 0; i < 6; i++) hiss(t + i * 0.035, { f: R(700, 1000) * p, q: 1.5, gain: 0.08 * (1 - i / 7), dur: 0.03 }); bell(t + 0.25, 1760 * p, 0.12, 0.6); },
    woof(t, p) { [0, 0.19].forEach((d, i) => { const q = p * (i ? 0.94 : 1); tone(t + d, { f: 430 * q, f2: 250 * q, glide: 0.1, gain: 0.2, dur: 0.12, wave: 'sawtooth' }); hiss(t + d, { f: 900 * q, q: 2, gain: 0.15, dur: 0.1 }); }); },
    splash(t, p) { hiss(t, { f: 1200 * p, f2: 500 * p, q: 0.6, gain: 0.18, dur: 0.35, attack: 0.01 }); for (let i = 0; i < 6; i++) tone(t + R(0.05, 0.3), { f: R(900, 1800) * p, f2: R(1800, 2600) * p, glide: 0.03, gain: 0.04, dur: 0.05 }); }
  };
  const GAP = { thud: 0.18, xp: 0.05, ding: 0.4, brush: 0.05, harvest: 0.03 };   /* don't let busy sounds pile up */

  function play(name, opt) {
    if (!enabled || !S[name] || !init()) return;
    if (ac.state !== 'running') ac.resume();
    const now = ac.currentTime;
    if (GAP[name] && last[name] && now - last[name] < GAP[name]) return;
    last[name] = now;
    const p = (opt && opt.pitch) || R(0.92, 1.08);
    S[name](now + 0.005, p, opt && opt.n);
  }
  return {
    play, unlock, names: Object.keys(S),
    setEnabled(v) { enabled = !!v; }, isEnabled: () => enabled,
    setVolume(v) { volume = v; if (out) out.gain.setTargetAtTime(v, ac.currentTime, 0.03); },
    state: () => (ac ? ac.state : 'not started')
  };
})();
