/* Beju Farm random-event sounds, synthesised live on SFX's building blocks (no audio files), like every other game sound.
   Each event has four parts:
     start  a sting that plays wherever you are (any map, any tab, sheet open or not), so you notice the trouble
     loop   the trouble's own voice, repeating until the event is cleared; on another map, or under the sheet, it plays
            at 70% and muffled, as if from the next room, so you know it's still going without it nagging
     hits   one sound for each thing you tap while stopping it
     clear  the resolve, as the loop fades out
   A rare variant adds a shimmer to the start, its own voice to the loop and its own sound when tapped.
   Usage: const ev = EventSFX.start('pigs', { rare: false, here: true }); ev.hit('tap'); ev.here(false); ev.clear();
          ev.leave() lets an ignored event go quietly. EventSFX.ids lists the events; EventSFX.hits(id) their interactions. */
const EventSFX = (function () {
  'use strict';
  const R = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
  let K = null, bus = null, muff = null, cur = null;
  const AWAY = 0.7;   /* the loop's volume on another map or under the sheet, muffled */

  function kit() {   /* the loop gets its own bus, so it can be muffled and faded without touching other sounds */
    if (K) return K;
    if (typeof SFX === 'undefined' || !SFX.kit) return null;
    K = SFX.kit(); if (!K) return null;
    bus = K.ac.createGain(); muff = K.ac.createBiquadFilter(); muff.type = 'lowpass'; muff.frequency.value = 16000; muff.Q.value = 0.5;
    bus.connect(muff); muff.connect(K.out);
    return K;
  }

  /* ---- voices: everything takes a time and a destination ---- */
  const hiss = (t, d, o) => K.hiss(t, Object.assign({ dest: d }, o));
  const tone = (t, d, o) => K.tone(t, Object.assign({ dest: d }, o));
  function voice(t, d, o) {   /* a pitched voice with a three-point glide, vibrato, a formant filter and a pan */
    const ac = K.ac, osc = ac.createOscillator(), g = ac.createGain(), end = t + o.dur;
    osc.type = o.wave || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur * (o.mid || 0.4));
    if (o.f3) osc.frequency.exponentialRampToValueAtTime(o.f3, end);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibD || 25; l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(end + 0.05); }
    let node = osc;
    if (o.bp) { const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 2; node.connect(f); node = f; }
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack || 0.012));
    g.gain.setValueAtTime(o.gain, t + Math.max(o.attack || 0.012, o.dur * (o.hold || 0.45))); g.gain.exponentialRampToValueAtTime(0.0001, end);
    node.connect(g); let last = g;
    if (o.pan != null && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.setValueAtTime(o.pan, t); if (o.pan2 != null) p.pan.linearRampToValueAtTime(o.pan2, end); g.connect(p); last = p; }
    last.connect(d); if (o.verb) last.connect(K.verb);
    osc.start(t); osc.stop(end + 0.05);
  }
  function bell(t, d, f, gain, dur) { tone(t, d, { f, gain, dur: dur || 0.5, verb: true }); tone(t, d, { f: f * 2.76, gain: gain * 0.35, dur: (dur || 0.5) * 0.45, verb: true }); }
  function lfo(rate, depth, param) { const ac = K.ac, l = ac.createOscillator(), g = ac.createGain(); l.frequency.value = rate; g.gain.value = depth; l.connect(g); g.connect(param); l.start(); return l; }
  function noiseBed(d, o) {   /* a continuous sound under the loop: wind, a fire's roar, a room's hum */
    const ac = K.ac, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lf = [];
    src.buffer = K.noise; src.loop = true; src.playbackRate.value = o.rate || 1;
    f.type = o.type || 'lowpass'; f.frequency.value = o.f; f.Q.value = o.q || 0.7;
    g.gain.value = 0.0001; g.gain.setTargetAtTime(o.gain, ac.currentTime, o.fade || 0.4);
    src.connect(f); f.connect(g); g.connect(d);
    if (o.trem) lf.push(lfo(o.trem[0], o.gain * o.trem[1], g.gain));
    if (o.sweep) lf.push(lfo(o.sweep[0], o.sweep[1], f.frequency));
    src.start();
    return { gain: g.gain, base: o.gain, stop(t) { g.gain.setTargetAtTime(0.0001, t, 0.35); src.stop(t + 2); lf.forEach((l) => l.stop(t + 2)); } };
  }
  function oscBed(d, o) {   /* a held chord of oscillators: a swarm's buzz, a hive's hum */
    const ac = K.ac, f = ac.createBiquadFilter(), g = ac.createGain(), lf = [], oscs = [];
    f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 1.2;
    g.gain.value = 0.0001; g.gain.setTargetAtTime(o.gain, ac.currentTime, o.fade || 0.4);
    o.f.forEach((fr) => { const x = ac.createOscillator(); x.type = o.wave || 'sawtooth'; x.frequency.value = fr; x.connect(f); x.start(); oscs.push(x); });
    f.connect(g); g.connect(d);
    if (o.trem) lf.push(lfo(o.trem[0], o.gain * o.trem[1], g.gain));
    if (o.wob) oscs.forEach((x, i) => lf.push(lfo(o.wob[0] + i * 0.37, o.wob[1], x.frequency)));
    if (o.sweep) lf.push(lfo(o.sweep[0], o.sweep[1], f.frequency));
    return { gain: g.gain, base: o.gain, oscs, stop(t, drop) { if (drop) oscs.forEach((x) => x.frequency.setTargetAtTime(x.frequency.value * drop, t, 0.4)); g.gain.setTargetAtTime(0.0001, t, 0.4); oscs.forEach((x) => x.stop(t + 2.5)); lf.forEach((l) => l.stop(t + 2.5)); } };
  }

  /* ---- shared pieces ---- */
  function shimmer(t, d) {   /* the rare sting: a rising run of little bells and a sparkle of air */
    [1568, 1976, 2349, 2794, 3136, 3951].forEach((f, i) => bell(t + i * 0.055, d, f, 0.07 - i * 0.006, 0.7));
    hiss(t, d, { type: 'highpass', f: 6000, gain: 0.08, dur: 0.6, attack: 0.25 });
  }
  function cleared(t, d) { bell(t, d, 1046, 0.09, 0.6); bell(t + 0.11, d, 1568, 0.08, 0.9); }
  function wood(t, d, f, g) { hiss(t, d, { f: f || 900, q: 6, gain: g || 0.22, dur: 0.06 }); tone(t, d, { f: (f || 900) / 4.3, f2: (f || 900) / 5.3, gain: (g || 0.22) * 0.8, dur: 0.07, wave: 'triangle' }); }
  function patter(t, d, n, f, g) { for (let i = 0; i < n; i++) hiss(t + i * R(0.045, 0.06), d, { f: f * R(0.9, 1.1), q: 4, gain: g * (1 - i / (n + 1)), dur: 0.03 }); }
  function plop(t, d, p) { tone(t, d, { f: 720 * p, f2: 380 * p, glide: 0.03, gain: 0.1, dur: 0.06, wave: 'triangle' }); hiss(t, d, { f: 1500 * p, q: 3, gain: 0.05, dur: 0.025 }); }

  /* pigs */
  const grunt = (t, d, p, pan) => { voice(t, d, { f: 150 * p, f2: 118 * p, dur: 0.17, wave: 'sawtooth', bp: 620 * p, q: 3, vib: 32, vibD: 70, gain: 0.2, pan }); hiss(t, d, { type: 'lowpass', f: 520, gain: 0.05, dur: 0.12 }); };
  const squeal = (t, d, p, len, pan) => voice(t, d, { f: 720 * p, f2: 1450 * p, f3: 880 * p, dur: len || 0.42, wave: 'sawtooth', bp: 1500 * p, q: 2, vib: 9, vibD: 45, gain: 0.16, pan });
  const root = (t, d) => { for (let i = 0; i < 3; i++) hiss(t + i * 0.05, d, { type: 'lowpass', f: R(480, 820), gain: R(0.08, 0.13), dur: 0.06 }); };
  const jingle = (t, d) => [3520, 4186, 3951].forEach((f, i) => tone(t + i * 0.04, d, { f, gain: 0.035, dur: 0.18, verb: true }));
  /* leaf rust */
  const crackle = (t, d, n, g) => { for (let i = 0; i < n; i++) hiss(t + R(0, 0.35), d, { type: 'highpass', f: R(3000, 6500), gain: R(0.03, g), dur: R(0.01, 0.025) }); };
  const snip = (t, d) => { [0, 0.07].forEach((x) => { hiss(t + x, d, { type: 'highpass', f: 5200, gain: 0.2, dur: 0.012 }); tone(t + x, d, { f: 2500, f2: 1800, glide: 0.02, gain: 0.08, dur: 0.035, wave: 'triangle' }); }); hiss(t + 0.09, d, { f: 2200, q: 0.8, gain: 0.1, dur: 0.22 }); };
  /* monkeys */
  const hoot = (t, d, p, pan) => voice(t, d, { f: 480 * p, f2: 920 * p, f3: 620 * p, dur: 0.2, wave: 'triangle', bp: 1000 * p, q: 1.6, vib: 6, vibD: 35, gain: 0.15, pan });
  const chatter = (t, d, n, p, pan) => { for (let i = 0; i < n; i++) hoot(t + i * 0.1, d, p * (1 + i * 0.07), pan); };
  const peep = (t, d) => [0, 0.11].forEach((x) => voice(t + x, d, { f: 2200, f2: 2700, dur: 0.08, gain: 0.07 }));
  /* crows */
  const caw = (t, d, p, pan) => { voice(t, d, { f: 640 * p, f2: 540 * p, f3: 440 * p, dur: 0.28, wave: 'sawtooth', bp: 1150 * p, q: 3, vib: 46, vibD: 90, gain: 0.26, pan }); hiss(t, d, { f: 1500 * p, q: 2, gain: 0.04, dur: 0.2 }); };
  const flap = (t, d, n, g) => { for (let i = 0; i < n; i++) hiss(t + i * 0.08, d, { type: 'lowpass', f: R(700, 1100), gain: (g || 0.12) * (1 - i / (n + 2)), dur: 0.06 }); };
  const peck = (t, d) => { for (let i = 0; i < 3; i++) hiss(t + i * 0.07, d, { type: 'highpass', f: 2600, gain: 0.07, dur: 0.01 }); };
  const chak = (t, d) => { for (let i = 0; i < 5; i++) voice(t + i * 0.06, d, { f: 1450, dur: 0.035, wave: 'square', bp: 1800, q: 3, gain: 0.07 }); };
  const glint = (t, d) => { tone(t, d, { f: 4186, gain: 0.05, dur: 0.35, verb: true }); tone(t + 0.05, d, { f: 5274, gain: 0.03, dur: 0.3, verb: true }); };
  /* hornets */
  const flyby = (t, d, f, g) => { const s = Math.random() < 0.5 ? -1 : 1; voice(t, d, { f: f * 0.9, f2: f * 1.3, f3: f * 0.85, mid: 0.5, dur: 0.9, wave: 'sawtooth', bp: f * 5, q: 2, gain: g, attack: 0.3, hold: 0.5, pan: -0.9 * s, pan2: 0.9 * s }); };
  const drip = (t, d) => { voice(t, d, { f: 900, f2: 1500, dur: 0.07, gain: 0.07, verb: true }); };
  /* rats */
  const squeak = (t, d, p) => voice(t, d, { f: 3200 * p, f2: 4300 * p, f3: 3000 * p, dur: 0.07, gain: 0.09 });
  const gnaw = (t, d) => { for (let i = 0; i < 10; i++) hiss(t + i * 0.045, d, { f: R(3000, 4200), q: 3, gain: R(0.07, 0.12), dur: 0.014 }); };
  const scurry = (t, d) => patter(t, d, 8, 2600, 0.1);
  const kingSqueak = (t, d) => voice(t, d, { f: 1300, f2: 1900, f3: 1150, dur: 0.18, wave: 'triangle', bp: 1600, q: 2, vib: 7, vibD: 40, gain: 0.13 });   /* the king rat: bigger, so lower and grander */
  const fanfare = (t, d, g) => [[392, 0, 0.11], [523, 0.12, 0.11], [659, 0.24, 0.36]].forEach(([f, x, len]) => voice(t + x, d, { f, dur: len, wave: 'sawtooth', lp: f * 3, gain: g || 0.06, attack: 0.02, hold: 0.7, verb: true }));   /* a tiny trumpet: ta-ta-daa */
  /* Karen: a little babble, the way games give characters a voice without words */
  function babble(t, d, n, base, rise, g) {
    for (let i = 0; i < n; i++) { const f = base * Math.pow(2, (R(-3, 4) + rise * i / n) / 12); voice(t + i * 0.075, d, { f, f2: f * R(0.94, 1.06), dur: 0.06, wave: 'square', bp: pick([700, 1100, 1600]), q: 4, gain: g || 0.11 }); }
  }
  const ding = (t, d, g) => { bell(t, d, 2349, g || 0.12, 0.5); tone(t, d, { f: 4700, gain: 0.02, dur: 0.15 }); };
  const yip = (t, d) => [0, 0.12].forEach((x) => voice(t + x, d, { f: 1150, f2: 760, dur: 0.07, wave: 'sawtooth', bp: 1600, q: 2, gain: 0.13 }));
  /* power cut */
  const zap = (t, d) => { voice(t, d, { f: 120, f2: 118, dur: R(0.1, 0.3), wave: 'square', lp: 1400, gain: 0.03 }); hiss(t, d, { type: 'highpass', f: 6000, gain: 0.015, dur: 0.12 }); };
  const chug = (t, d) => hiss(t, d, { type: 'lowpass', f: 210, gain: 0.07, dur: 0.22, attack: 0.05 });
  const MUSICBOX = [[1568, 1976, 2349, 1976], [2349, 2093, 1760, 1568], [1760, 2349, 2637, 2349]];
  /* fire */
  const pops = (t, d, n) => { for (let i = 0; i < n; i++) { const x = R(0, 0.5); hiss(t + x, d, { type: 'highpass', f: R(2000, 4200), gain: R(0.05, 0.14), dur: 0.008 }); tone(t + x, d, { f: R(1200, 2600), f2: R(500, 900), glide: 0.015, gain: 0.04, dur: 0.02, wave: 'triangle' }); } };
  const spray = (t, d) => { hiss(t, d, { type: 'highpass', f: 1500, gain: 0.22, dur: 0.32, attack: 0.02 }); hiss(t + 0.05, d, { f: 5000, q: 1, gain: 0.08, dur: 0.4 }); };
  /* typhoon */
  const thunder = (t, d, g) => { hiss(t, d, { type: 'lowpass', f: 170, gain: g, dur: 2.2, attack: 0.25 }); tone(t, d, { f: 52, f2: 40, gain: g * 0.4, dur: 1.6 }); };
  const gust = (t, d, g) => hiss(t, d, { f: 320, f2: 820, q: 0.6, gain: g, dur: 1.7, attack: 0.8 });

  /* ---- the ten events ---- */
  const EV = {
    pigs: {
      start(t, d) { squeal(t, d, 1); squeal(t + 0.34, d, 1.12); wood(t + 0.12, d, 950); wood(t + 0.24, d, 820); grunt(t + 0.7, d, 1); grunt(t + 0.95, d, 0.9); },
      every: [0.55, 1.35],
      call(t, d, rare) { const p = R(0.82, 1.2), pan = R(-0.6, 0.6); grunt(t, d, p, pan); if (Math.random() < 0.22) grunt(t + 0.2, d, p * 1.05, pan); if (Math.random() < 0.35) root(t + R(0.1, 0.3), d); if (rare && Math.random() < 0.5) jingle(t + 0.06, d); },
      hits: {
        tap: { label: 'Tap a pig', play(t, d) { squeal(t, d, R(1.1, 1.3), 0.3); patter(t + 0.12, d, 6, 1300, 0.12); } },
        rare: { label: 'Tap the truffle pig', rare: true, play(t, d) { squeal(t, d, 1.35, 0.32); jingle(t + 0.05, d); shimmer(t + 0.2, d); } }
      },
      clear(t, d) { patter(t, d, 8, 1300, 0.09); voice(t + 0.2, d, { f: 900, f2: 1500, f3: 1000, dur: 0.4, wave: 'sawtooth', bp: 1400, lp: 1200, gain: 0.07 }); wood(t + 0.5, d, 1600, 0.12); cleared(t + 0.65, d); }
    },
    rust: {
      start(t, d) { hiss(t, d, { f: 2400, f2: 5200, q: 0.7, gain: 0.2, dur: 0.95, attack: 0.4 }); voice(t + 0.1, d, { f: 92, f2: 70, dur: 0.55, wave: 'sawtooth', bp: 420, q: 8, gain: 0.07 }); tone(t + 0.45, d, { f: 220, gain: 0.14, dur: 0.6, wave: 'triangle', verb: true }); tone(t + 0.7, d, { f: 233, gain: 0.13, dur: 0.7, wave: 'triangle', verb: true }); },
      every: [1.1, 2.3],
      call(t, d, rare) {
        crackle(t, d, 4 + Math.floor(R(0, 4)), 0.15);
        if (Math.random() < 0.3) { tone(t + 0.3, d, { f: 1800, f2: 1200, glide: 0.03, gain: 0.04, dur: 0.035, wave: 'triangle' }); hiss(t + 0.32, d, { f: 3000, q: 2, gain: 0.03, dur: 0.3 }); }
        if (Math.random() < 0.18) { hiss(t, d, { f: 800, f2: 3000, q: 1, gain: 0.06, dur: 0.5, attack: 0.3 }); tone(t + 0.4, d, { f: 196, gain: 0.05, dur: 0.4, wave: 'triangle' }); }   /* it spreads */
        if (rare && Math.random() < 0.45) bell(t + R(0, 0.4), d, pick([1046, 1175, 1318, 1568, 1760]) * 2, 0.035, 0.9);   /* wind chimes round the silver bush */
      },
      hits: {
        prune: { label: 'Prune a bush', play(t, d) { snip(t, d); } },
        rare: { label: 'Find the silver bush', rare: true, play(t, d) { bell(t, d, 2093, 0.06, 0.9); bell(t + 0.09, d, 2637, 0.05, 0.9); shimmer(t + 0.18, d); } }
      },
      clear(t, d) { hiss(t, d, { f: 1800, q: 0.6, gain: 0.08, dur: 0.4, attack: 0.1 }); tone(t + 0.1, d, { f: 392, f2: 587, glide: 0.15, gain: 0.08, dur: 0.35, wave: 'triangle', verb: true }); cleared(t + 0.4, d); }
    },
    monkeys: {
      start(t, d) { voice(t, d, { f: 110, f2: 165, dur: 0.6, wave: 'sawtooth', bp: 700, q: 10, gain: 0.06 }); chatter(t + 0.3, d, 4, 1); chatter(t + 0.75, d, 3, 1.15); },
      every: [0.7, 1.6],
      call(t, d, rare) { const pan = R(-0.7, 0.7), x = Math.random(); if (x < 0.55) chatter(t, d, 2 + Math.floor(R(0, 2)), R(0.9, 1.2), pan); else if (x < 0.9) patter(t, d, 5, 1500, 0.07); else plop(t, d, R(0.9, 1.1)); if (rare && Math.random() < 0.4) peep(t + 0.25, d); },
      hits: {
        tap: { label: 'Tap a loaded monkey', play(t, d) { voice(t, d, { f: 1200, f2: 2100, f3: 1500, dur: 0.18, wave: 'sawtooth', bp: 2000, q: 2, gain: 0.13 }); for (let i = 0; i < 3; i++) plop(t + 0.18 + i * 0.07, d, 1 - i * 0.05); } },
        miss: { label: 'Tap an empty one', play(t, d) { hiss(t, d, { type: 'lowpass', f: 420, gain: 0.08, dur: 0.05 }); hoot(t + 0.03, d, 0.8); } },
        rare: { label: 'Tap the baby capuchin', rare: true, play(t, d) { peep(t, d); peep(t + 0.25, d); shimmer(t + 0.3, d); } }
      },
      clear(t, d) { [0, 0.28, 0.56].forEach((x, i) => voice(t + x, d, { f: 460, f2: 880, f3: 600, dur: 0.22, wave: 'triangle', lp: 900 - i * 200, gain: 0.09 - i * 0.025 })); cleared(t + 0.8, d); }
    },
    crows: {
      start(t, d) { flap(t, d, 6); caw(t + 0.1, d, 1); caw(t + 0.42, d, 1.08); caw(t + 0.72, d, 0.95); },
      every: [0.9, 2.0],
      call(t, d, rare) { const x = Math.random(); if (x < 0.5) caw(t, d, R(0.9, 1.12), R(-0.7, 0.7)); else if (x < 0.8) peck(t, d); else flap(t, d, 3, 0.09); if (rare) { if (Math.random() < 0.35) chak(t + 0.3, d); if (Math.random() < 0.15) glint(t + 0.6, d); } },
      hits: {
        wave: { label: 'Wave the scarecrow', play(t, d) { hiss(t, d, { f: 3000, q: 0.6, gain: 0.13, dur: 0.3 }); voice(t, d, { f: 125, f2: 92, dur: 0.3, wave: 'sawtooth', bp: 520, q: 8, gain: 0.06 }); hiss(t + 0.05, d, { type: 'lowpass', f: 600, f2: 1800, gain: 0.1, dur: 0.25 }); flap(t + 0.3, d, 8, 0.11); caw(t + 0.45, d, 1.05); } },
        shoo: { label: 'Shoo a crow', play(t, d) { caw(t, d, 1.15); flap(t + 0.1, d, 4); } },
        rare: { label: 'Shoo the magpie', rare: true, play(t, d) { chak(t, d); glint(t + 0.3, d); flap(t + 0.2, d, 4); shimmer(t + 0.45, d); } }
      },
      clear(t, d) { flap(t, d, 10, 0.1); voice(t + 0.5, d, { f: 620, f2: 520, f3: 430, dur: 0.28, wave: 'sawtooth', bp: 1100, lp: 900, gain: 0.06 }); cleared(t + 0.8, d); }
    },
    hornets: {
      start(t, d) { hiss(t, d, { type: 'lowpass', f: 620, gain: 0.2, dur: 0.08 }); tone(t, d, { f: 120, f2: 80, gain: 0.2, dur: 0.1 }); voice(t + 0.05, d, { f: 150, f2: 215, dur: 1.0, wave: 'sawtooth', bp: 900, q: 1.5, vib: 14, vibD: 55, gain: 0.11, attack: 0.5 }); },
      beds(d, rare) { return rare ? [oscBed(d, { f: [220, 221.5, 330], wave: 'triangle', bp: 700, gain: 0.05, trem: [9, 0.3], wob: [3, 2] })] : [oscBed(d, { f: [168, 176, 231], bp: 950, q: 1.1, gain: 0.05, trem: [13, 0.35], wob: [4, 4], sweep: [0.4, 250] })]; },
      every: [1.4, 2.8],
      call(t, d, rare) { if (rare) { if (Math.random() < 0.6) drip(t, d); if (Math.random() < 0.3) flyby(t + 0.3, d, 230, 0.03); } else flyby(t, d, R(210, 260), 0.06); },
      hits: {
        smoke: { label: 'Smoke the nest', play(t, d, n) { hiss(t, d, { type: 'lowpass', f: 400, f2: 1200, gain: 0.18, dur: 0.35, attack: 0.05 }); hiss(t, d, { f: 2000, q: 0.7, gain: 0.05, dur: 0.4 }); voice(t + 0.25, d, { f: 600 * (1 + (n || 0) * 0.15), dur: 0.06, wave: 'triangle', gain: 0.08 }); } },
        rare: { label: 'Smoke the golden hive', rare: true, play(t, d) { hiss(t, d, { type: 'lowpass', f: 400, f2: 1200, gain: 0.15, dur: 0.35, attack: 0.05 }); drip(t + 0.2, d); drip(t + 0.35, d); shimmer(t + 0.3, d); } }
      },
      clear(t, d) { cleared(t + 0.6, d); },
      dropOnClear: 0.55
    },
    rats: {
      start(t, d) { hiss(t, d, { f: 1200, f2: 3000, q: 1, gain: 0.22, dur: 0.3 }); squeak(t + 0.25, d, 1); squeak(t + 0.36, d, 1.1); squeak(t + 0.55, d, 0.95); scurry(t + 0.6, d); },
      every: [0.6, 1.5],
      rareStart(t, d) { fanfare(t, d, 0.07); kingSqueak(t + 0.5, d); },   /* the king announces himself */
      call(t, d, rare) { const x = Math.random(); if (x < 0.5) gnaw(t, d); else if (x < 0.8) { const p = R(0.9, 1.15); squeak(t, d, p); if (Math.random() < 0.4) squeak(t + 0.1, d, p * 1.06); } else scurry(t, d); if (rare) { if (Math.random() < 0.4) kingSqueak(t + 0.25, d); if (Math.random() < 0.12) fanfare(t + 0.5, d, 0.035); } },
      hits: {
        trap: { label: 'Set a trap', play(t, d) { hiss(t, d, { type: 'highpass', f: 3500, gain: 0.28, dur: 0.015 }); tone(t, d, { f: 900, f2: 300, glide: 0.04, gain: 0.1, dur: 0.05, wave: 'square' }); bell(t + 0.01, d, 2093, 0.035, 0.3); voice(t + 0.08, d, { f: 3000, f2: 3600, dur: 0.07, lp: 1800, gain: 0.05 }); } },
        miss: { label: 'Tap an empty hole', play(t, d) { tone(t, d, { f: 300, f2: 250, gain: 0.08, dur: 0.05, wave: 'triangle' }); hiss(t, d, { type: 'lowpass', f: 500, gain: 0.05, dur: 0.05 }); } },
        rare: { label: 'Trap the king rat', rare: true, play(t, d) { hiss(t, d, { type: 'highpass', f: 3000, gain: 0.3, dur: 0.02 }); tone(t, d, { f: 700, f2: 220, glide: 0.05, gain: 0.12, dur: 0.07, wave: 'square' }); kingSqueak(t + 0.08, d); fanfare(t + 0.35, d, 0.07); shimmer(t + 0.7, d); } }
      },
      clear(t, d) { scurry(t, d); wood(t + 0.4, d, 1400, 0.1); cleared(t + 0.55, d); }
    },
    karen: {
      start(t, d) { ding(t, d); ding(t + 0.12, d); ding(t + 0.24, d, 0.14); babble(t + 0.45, d, 8, 420, 4); voice(t + 1.15, d, { f: 260, f2: 190, dur: 0.25, wave: 'sawtooth', bp: 900, q: 3, gain: 0.08 }); },
      every: [1.4, 2.8],
      call(t, d, rare) { const x = Math.random(); if (x < 0.6) babble(t, d, 5 + Math.floor(R(0, 3)), R(360, 430), R(0, 4)); else if (x < 0.85) [0, 0.25, 0.5].forEach((s) => hiss(t + s, d, { type: 'lowpass', f: 300, gain: 0.08, dur: 0.04 })); else ding(t, d, 0.08); if (rare && Math.random() < 0.35) yip(t + 0.5, d); },
      hits: {
        right: { label: 'The right reply', play(t, d) { babble(t, d, 5, 330, -5, 0.08); bell(t + 0.45, d, 1568, 0.08, 0.5); bell(t + 0.55, d, 2093, 0.07, 0.6); } },
        wrong: { label: 'A wrong reply', play(t, d) { babble(t, d, 10, 520, 5, 0.17); ding(t + 0.8, d); ding(t + 0.9, d); } },
        rare: { label: 'Calm the regular', rare: true, play(t, d) { babble(t, d, 5, 330, -5, 0.08); yip(t + 0.4, d); shimmer(t + 0.6, d); } }
      },
      clear(t, d) { for (let i = 0; i < 4; i++) { tone(t + i * 0.07, d, { f: 2637 * R(0.98, 1.02), gain: 0.05, dur: 0.3, verb: true }); tone(t + i * 0.07 + 0.03, d, { f: 3136, gain: 0.03, dur: 0.25 }); } cleared(t + 0.45, d); }
    },
    power: {
      start(t, d) { hiss(t, d, { type: 'lowpass', f: 300, gain: 0.28, dur: 0.12 }); tone(t, d, { f: 80, f2: 50, gain: 0.24, dur: 0.15 }); voice(t + 0.05, d, { f: 420, f2: 120, f3: 60, dur: 1.4, gain: 0.07 }); voice(t + 0.05, d, { f: 210, f2: 60, f3: 30, dur: 1.4, wave: 'sawtooth', lp: 600, gain: 0.04 }); [0.3, 0.42, 0.7].forEach((x) => zap(t + x, d)); },
      beds(d) { return [noiseBed(d, { type: 'lowpass', f: 130, gain: 0.025 })]; },
      every: [1.1, 2.4],
      call(t, d, rare) { if (Math.random() < 0.45) zap(t, d); else chug(t, d); if (rare && Math.random() < 0.4) { pick(MUSICBOX).forEach((f, i) => bell(t + 0.2 + i * 0.26, d, f, 0.035, 0.8)); hiss(t, d, { f: 700, q: 0.5, gain: 0.015, dur: 0.3 }); } },
      hits: {
        open: { label: 'Open the fuse box', play(t, d) { voice(t, d, { f: 300, f2: 430, dur: 0.3, wave: 'sawtooth', bp: 1200, q: 10, gain: 0.05 }); hiss(t + 0.3, d, { type: 'highpass', f: 3000, gain: 0.12, dur: 0.012 }); } },
        flip: { label: 'Flip a switch', play(t, d, n) { hiss(t, d, { type: 'highpass', f: 2500, gain: 0.24, dur: 0.015 }); tone(t, d, { f: 180, f2: 120, gain: 0.12, dur: 0.06, wave: 'square' }); voice(t + 0.05, d, { f: 440 * [1, 1.25, 1.5, 2][(n || 0) % 4], dur: 0.1, wave: 'triangle', gain: 0.06 }); } },
        wrong: { label: 'Wrong order', play(t, d) { voice(t, d, { f: 90, dur: 0.35, wave: 'square', lp: 900, gain: 0.08 }); [0.4, 0.48, 0.56].forEach((x) => hiss(t + x, d, { type: 'highpass', f: 2500, gain: 0.12, dur: 0.012 })); } },
        rare: { label: 'Throw the brass switch', rare: true, play(t, d) { hiss(t, d, { type: 'highpass', f: 2000, gain: 0.2, dur: 0.02 }); bell(t + 0.04, d, 880, 0.08, 0.8); MUSICBOX[0].forEach((f, i) => bell(t + 0.2 + i * 0.12, d, f, 0.04, 0.7)); shimmer(t + 0.6, d); } }
      },
      clear(t, d) { voice(t, d, { f: 60, f2: 120, mid: 0.9, dur: 1.0, gain: 0.08 }); hiss(t, d, { type: 'lowpass', f: 200, f2: 500, gain: 0.08, dur: 1.0, attack: 0.6 }); [0.3, 0.45, 0.62].forEach((x) => tone(t + x, d, { f: R(2800, 3400), gain: 0.03, dur: 0.15 })); cleared(t + 0.9, d); }
    },
    fire: {
      start(t, d) { hiss(t, d, { type: 'lowpass', f: 200, f2: 2400, gain: 0.25, dur: 0.6, attack: 0.05 }); bell(t + 0.15, d, 880, 0.14, 1.2); bell(t + 0.15, d, 1318, 0.08, 1.0); bell(t + 0.55, d, 880, 0.12, 1.2); pops(t + 0.3, d, 6); },
      beds(d, rare) { const b = [noiseBed(d, { type: 'lowpass', f: 380, gain: 0.07, trem: [7, 0.35] })]; if (rare) b.push(noiseBed(d, { type: 'lowpass', f: 150, gain: 0.05, trem: [3, 0.3] })); return b; },
      every: [0.25, 0.6],
      call(t, d, rare) { pops(t, d, 3 + Math.floor(R(0, 4))); if (rare && Math.random() < 0.5) tone(t + R(0, 0.3), d, { f: R(3000, 5200), gain: 0.03, dur: 0.05, verb: true }); },
      ticker: 1,   /* the batch's 60 s: a quiet tick each second */
      hits: {
        grab: { label: 'Grab the extinguisher', play(t, d) { bell(t, d, 1200, 0.06, 0.25); hiss(t, d, { f: 3000, q: 8, gain: 0.1, dur: 0.05 }); voice(t + 0.12, d, { f: 2000, f2: 3000, dur: 0.05, gain: 0.04 }); } },
        spray: { label: 'Spray the roaster', play(t, d) { spray(t, d); }, damp: 0.25 },
        rare: { label: 'Spray the blue fire', rare: true, play(t, d) { spray(t, d); tone(t + 0.1, d, { f: 4186, gain: 0.04, dur: 0.4, verb: true }); shimmer(t + 0.3, d); }, damp: 0.25 }
      },
      clear(t, d) { hiss(t, d, { type: 'highpass', f: 1500, gain: 0.2, dur: 0.5 }); hiss(t + 0.2, d, { f: 1500, f2: 600, q: 0.8, gain: 0.12, dur: 1.2, attack: 0.1 }); cleared(t + 0.9, d); }
    },
    typhoon: {
      everywhere: true,   /* the storm is on every map, so it never sounds far away */
      start(t, d) { [0, 0.55, 1.1].forEach((x, i) => voice(t + x, d, { f: i % 2 ? 311 : 233, dur: 0.5, wave: 'sawtooth', lp: 1200, gain: 0.07, attack: 0.05 })); thunder(t + 0.4, d, 0.24); gust(t + 0.8, d, 0.12); },
      beds(d) { return [noiseBed(d, { type: 'bandpass', f: 420, q: 0.6, gain: 0.07, trem: [0.2, 0.4], sweep: [0.13, 260] }), noiseBed(d, { type: 'highpass', f: 4200, gain: 0.025, rate: 1.3 })]; },
      every: [2.0, 4.5],
      call(t, d) { if (Math.random() < 0.3) thunder(t, d, 0.14); else gust(t, d, 0.08); },
      hits: {
        stake: { label: 'Stake a bush', play(t, d) { wood(t, d, 800); wood(t + 0.16, d, 760); } },
        tarp: { label: 'Tarp a rack', play(t, d) { hiss(t, d, { f: 900, q: 0.7, gain: 0.24, dur: 0.22 }); hiss(t + 0.2, d, { f: 900, q: 0.7, gain: 0.2, dur: 0.2 }); voice(t + 0.4, d, { f: 160, f2: 130, dur: 0.25, wave: 'sawtooth', bp: 600, q: 8, gain: 0.05 }); } },
        plants: { label: 'Bring in the plants', play(t, d) { tone(t, d, { f: 300, f2: 200, gain: 0.1, dur: 0.1, wave: 'triangle' }); hiss(t, d, { type: 'lowpass', f: 500, gain: 0.08, dur: 0.06 }); hiss(t + 0.05, d, { f: 2500, q: 0.8, gain: 0.05, dur: 0.15 }); } },
        done: { label: 'A map battened down', play(t, d) { bell(t, d, 1318, 0.1, 0.7); } }
      },
      clear(t, d) { cleared(t + 0.3, d); [1.4, 1.62, 1.8].forEach((x) => voice(t + x, d, { f: 3000, f2: 3800, dur: 0.08, gain: 0.05 })); }
    }
  };

  /* ---- running an event ---- */
  const NONE = { hit() {}, here() {}, clear() {}, leave() {}, stop() {} };
  function start(id, opt) {
    const E = EV[id]; opt = opt || {};
    if (!E || !kit()) return NONE;
    if (cur) cur.stop();
    const ac = K.ac, rare = !!opt.rare;
    if (ac.state !== 'running') ac.resume();
    const t0 = ac.currentTime + 0.02;
    let here = E.everywhere || opt.here !== false, alive = true, timer = 0, tickT = 0, muted = !SFX.isEnabled();
    if (!muted) { E.start(t0, K.out, rare); if (rare) { shimmer(t0 + 0.15, K.out); if (E.rareStart) E.rareStart(t0 + 0.9, K.out); } }   /* the sting: full volume, wherever you are */
    bus.gain.cancelScheduledValues(t0); bus.gain.setValueAtTime(0.0001, t0); if (!muted) bus.gain.setTargetAtTime(1, t0 + 0.9, 0.35);
    const setHere = (on, fast) => { const now = ac.currentTime, k = fast ? 0.01 : 0.18; muff.frequency.setTargetAtTime(on ? 16000 : 1000, now, k); if (alive && !muted) bus.gain.setTargetAtTime(on ? 1 : AWAY, now, k); };
    setHere(here, true);
    const beds = E.beds ? E.beds(bus, rare) : [];
    const tick = () => {
      if (!alive) return;
      const off = !SFX.isEnabled();
      if (off !== muted) { muted = off; bus.gain.setTargetAtTime(off ? 0.0001 : here ? 1 : AWAY, ac.currentTime, 0.1); }   /* follows the sound switch */
      if (!off) E.call(ac.currentTime + 0.03, bus, rare);
      timer = setTimeout(tick, R(E.every[0], E.every[1]) * 1000);
    };
    timer = setTimeout(tick, 1100);
    if (E.ticker) tickT = setInterval(() => { if (alive && SFX.isEnabled()) voice(ac.currentTime + 0.01, bus, { f: 1000, dur: 0.025, wave: 'square', gain: 0.025 }); }, E.ticker * 1000);
    const end = (sound) => {
      if (!alive) return; alive = false; clearTimeout(timer); clearInterval(tickT);
      const now = ac.currentTime;
      if (sound && SFX.isEnabled() && E.clear) E.clear(now + 0.02, K.out, rare);
      bus.gain.setTargetAtTime(0.0001, now, sound ? 0.3 : 0.6);
      beds.forEach((b) => (b.oscs ? b.stop(now, E.dropOnClear) : b.stop(now)));
      if (cur === h) cur = null;
    };
    const h = {
      id, rare,
      hit(name, n) {   /* n: which tap this is (the hornet bar, the fuse box order) */
        const x = E.hits[name]; if (!x || !alive || !SFX.isEnabled()) return;
        x.play(ac.currentTime + 0.005, K.out, n || 0);
        if (x.damp) beds.forEach((b) => b.gain.setTargetAtTime(Math.max(0.0001, b.gain.value * (1 - x.damp)), ac.currentTime, 0.2));   /* each spray knocks the fire down */
      },
      here(on) { if (E.everywhere) return; here = !!on; setHere(here); },   /* false: another map is showing, or the sheet hides the event */
      clear() { end(true); },
      leave() { end(false); },   /* ignored for 10 minutes: it goes quietly */
      stop() { end(false); }
    };
    cur = h;
    return h;
  }
  document.addEventListener('visibilitychange', () => { if (cur && K && document.hidden) cur.here(false); });   /* the game pauses events while you're away */
  return {
    start, ids: Object.keys(EV),
    hits: (id) => Object.keys(EV[id].hits).map((k) => ({ name: k, label: EV[id].hits[k].label, rare: !!EV[id].hits[k].rare })),
    current: () => cur
  };
})();
