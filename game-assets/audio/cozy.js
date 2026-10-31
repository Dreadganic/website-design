/* Beju Farm cozy music: the same melodies, chords and form as music.js, re-voiced in a soft, spacious,
   Minecraft-like style: felt piano, warm pads, plucked strings, long reverb, loose human timing, almost no drums.
   Needs music.js loaded first (it reads the songs from it). Same controls as Music:
   Cozy.init(audioContext), Cozy.play(id), Cozy.stop(), Cozy.setNight(), Cozy.setVolume(), Cozy.setEnabled(), Cozy.duck(), Cozy.pause()/resume(). */
const Cozy = (function () {
'use strict';
const U = Music.util, hz = U.hz;
const R = (a, b) => a + Math.random() * (b - a);

/* how each farm's theme is re-voiced: slower, softer, with one regional colour kept */
const STYLE = {
  main:      { tempo: 0.78, lead: 'piano',      comp: 'broken', perc: null,       about: 'Felt piano carries the town tune over slow broken chords and a warm pad.' },
  mogiana:   { tempo: 0.8,  lead: 'epiano',     comp: 'bossa',  perc: 'shaker',   about: 'A soft electric piano sings the melody while a nylon guitar keeps a lazy bossa strum.' },
  huila:     { tempo: 0.82, lead: 'melodica',   comp: 'offbeat', perc: 'scrape',  about: 'A breathy melodica stands in for the accordion, with soft guitar upstrokes and a whisper of güiro.' },
  gedeo:     { tempo: 0.86, lead: 'krar',       comp: 'broken', perc: 'handdrum', about: 'A plucked krar lyre bends into each note over felt piano in a rolling 6/8 and a soft hand drum.' },
  toba:      { tempo: 0.88, lead: 'flute',      comp: 'hasapi', perc: 'gong',     about: 'A bamboo flute floats over the plucked hasapi lute, with a far-off gong every two bars.' },
  turrialba: { tempo: 0.82, lead: 'mallet',     comp: 'mallet', perc: null,       about: 'Soft marimba mallets roll the long notes, swaying between 6/8 and 3/4.' },
  osaka:     { tempo: 0.9,  lead: 'shakuhachi', comp: 'koto',   perc: 'taiko',    about: 'A breathy shakuhachi over rolled koto chords and strings, with taiko heard from across the valley.' },
  bluemtn:   { tempo: 0.82, lead: 'melodica',   comp: 'offbeat', perc: 'shaker',  about: 'A breathy melodica over soft guitar upstrokes on the off-beat and a shaker, slow as the mist lifting.' },
  kona:      { tempo: 0.84, lead: 'steel',      comp: 'uke',    perc: 'ipu',      swing: 0.18, about: 'A sliding steel guitar sings over a soft ukulele strum, with the knock of an ipu gourd and a shaker, a little swung.' },
  roastery:  { tempo: 0.86, lead: 'vibes',      comp: 'jazz',   perc: 'brush',    walk: true, swing: 0.32, about: 'Vibraphone over Rhodes shells, a walking upright bass and brushes, swung lazily like a kissaten record.' }
};

/* ---------------- arranging ---------------- */
const COMP = {
  broken(o, c, s0, part) { const pat = part >= 12 ? (part === 16 ? [[0, c.low + 12], [4, c.tones[2]], [8, c.tones[1] + 12], [12, c.tones[2]]] : [[0, c.low + 12], [4, c.tones[2]], [8, c.tones[1] + 12]]) : [[0, c.low + 12], [part / 2, c.tones[1] + 12]]; pat.forEach(([k, m]) => o.push({ s: s0 + k, d: 4, m, inst: 'piano', vel: 0.75 })); },
  bossa(o, c, s0, part) { (part === 16 ? [0, 3, 6, 10, 12] : [0, 3, 6]).forEach((k) => o.push({ s: s0 + k, d: 2, ms: c.tones.slice(1, 4), inst: 'guitar', vel: k ? 0.6 : 0.8 })); },
  offbeat(o, c, s0, part) { for (let k = 2; k < part; k += 4) o.push({ s: s0 + k, d: 1, ms: c.tones.slice(0, 3).map((t) => t + 12), inst: 'guitar', vel: 0.5, up: true }); },
  hasapi(o, c, s0, part) { const pat = part === 16 ? [0, 2, 3, 2, 1, 2, 3, 2] : [0, 2, 3, 2]; pat.forEach((k, i) => o.push({ s: s0 + i * 2, d: 2, m: c.tones[k] + 12, inst: 'hasapi', vel: i % 2 ? 0.5 : 0.7 })); },
  mallet(o, c, s0, part) { const pat = part === 12 ? [0, 2, 1, 2, 3, 2] : [0, 2, 1]; pat.forEach((k, i) => o.push({ s: s0 + i * 2, d: 2, m: c.tones[k], inst: 'mallet', vel: i ? 0.45 : 0.6 })); },
  jazz(o, c, s0, part) { const v = [c.tones[1], c.tones[3], c.tones[0] + 14]; (part === 16 ? [0, 10] : [0]).forEach((k, i) => o.push({ s: s0 + k, d: k ? 4 : 6, ms: v, inst: 'rhodes', vel: i ? 0.45 : 0.6 })); },
  uke(o, c, s0, part) { (part === 16 ? [[0, 0], [4, 0], [6, 1], [10, 1], [12, 0], [14, 1]] : [[0, 0], [4, 1], [6, 1]]).forEach(([k, up], i) => o.push({ s: s0 + k, d: 2, ms: c.tones.slice(0, 3).map((t) => t + 12).concat([c.tones[0] + 24]), inst: 'uke', vel: up ? 0.4 : i ? 0.55 : 0.7, up: !!up })); },
  koto(o, c, s0, part) { for (let h = 0; h < part; h += 8) o.push({ s: s0 + h, d: 6, ms: [c.tones[0], c.tones[1], c.tones[2], c.tones[0] + 12], inst: 'koto', vel: 0.6, roll: 0.07 }); }
};
const PERC = {
  shaker(o, t0, B) { for (let k = 2; k < B; k += 4) o.push({ s: t0 + k, kind: 'shaker', vel: 0.5 }); },
  scrape(o, t0, B) { for (let k = 0; k < B; k += 8) o.push({ s: t0 + k, kind: 'scrape', vel: 0.45 }); },
  handdrum(o, t0) { o.push({ s: t0, kind: 'drum', vel: 0.7 }); o.push({ s: t0 + 6, kind: 'drum', vel: 0.45 }); },
  gong(o, t0, B, bar) { if (bar % 2 === 0) o.push({ s: t0, kind: 'gong', vel: 0.6 }); },
  brush(o, t0) { [4, 12].forEach((k) => o.push({ s: t0 + k, kind: 'swish', vel: 0.6 })); [0, 4, 6, 8, 12, 14].forEach((k) => o.push({ s: t0 + k, kind: 'ride', vel: k % 4 ? 0.35 : 0.55 })); for (let i = 0; i < 3; i++) o.push({ s: t0 + Math.floor(Math.random() * 16), kind: 'vinyl', vel: 0.5 }); },
  ipu(o, t0, B) { o.push({ s: t0, kind: 'drum', vel: 0.55 }); o.push({ s: t0 + 6, kind: 'drum', vel: 0.3 }); o.push({ s: t0 + 8, kind: 'drum', vel: 0.4 }); for (let k = 2; k < B; k += 4) o.push({ s: t0 + k, kind: 'shaker', vel: 0.35 }); },
  taiko(o, t0, B, bar) { o.push({ s: t0, kind: 'taiko', vel: 0.8 }); if (bar % 4 === 3) [10, 12, 14].forEach((k, i) => o.push({ s: t0 + k, kind: 'taiko', vel: 0.3 + i * 0.12 })); }
};
function build(song) {
  const st = STYLE[song.id], B = song.bar, ev = { lead: [], comp: [], pad: [], bass: [], perc: [] }, marks = [];
  let step = 0, bar = 0;
  song.form.forEach((key, si) => {
    const sec = song.sections[key];
    marks.push({ step, si });
    sec.chords.forEach((chs, b) => {
      const t0 = step + b * B, first = key === 'intro' && b === 0;
      let p = t0;
      sec.lead[b].split(' ').forEach((tok) => { const [n, d] = tok.split(':'); if (n !== '-') ev.lead.push({ s: p, d: +d, m: U.midi(n), inst: st.lead, vel: R(0.78, 0.95) }); p += +d; });
      const part = B / chs.length;
      chs.forEach((name, ci) => {
        const c = U.chord(name), s0 = t0 + ci * part;
        ev.pad.push({ s: s0, d: part, ms: c.tones.slice(0, 3) });
        if (st.walk && !first) { const third = c.tones[1] - c.root, top = c.tones[3] - c.root; (part === 16 ? [0, third, 7, top > 11 ? 9 : top] : [0, 7]).forEach((iv, k) => ev.bass.push({ s: s0 + k * 4, d: 4, m: c.low + iv, walk: true })); }   /* a walking upright: one note a beat */
        else if (!first) ev.bass.push({ s: s0, d: part, m: c.low });
        COMP[st.comp](ev.comp, c, s0, part, bar);
      });
      if (st.perc && !first) PERC[st.perc](ev.perc, t0, B, bar);
      bar += 1;
    });
    step += sec.chords.length * B;
  });
  const by = {};
  Object.keys(ev).forEach((ch) => ev[ch].forEach((e) => { (by[e.s] = by[e.s] || []).push([ch, e]); }));
  return { ev, by, marks, total: step, loopStep: marks[1].step };
}
const SONGS = Music.songs.map((s) => Object.assign({}, s, { cozy: STYLE[s.id], cscore: build(s) }));

/* ---------------- instruments ---------------- */
let ac = null, bus, master, filter, verb, noise, night = false, song = SONGS[0], volume = 0.6, enabled = true;
const ks = {};
function setup(ctx) {
  ac = ctx;
  master = ac.createGain(); master.gain.value = 0;
  filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 6000; filter.Q.value = 0.2;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  bus = ac.createGain(); bus.connect(filter); filter.connect(master);
  verb = ac.createConvolver(); const wet = ac.createGain(); wet.gain.value = 0.42; bus.connect(verb); verb.connect(wet); wet.connect(filter);
  const len = Math.floor(ac.sampleRate * 3.4), ir = ac.createBuffer(2, len, ac.sampleRate);   /* a big soft hall */
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * (0.25 - 0.2 * i / len); d[i] = lp * Math.pow(1 - i / len, 2.4) * 2.2; } }
  verb.buffer = ir;
  master.connect(comp); comp.connect(ac.destination);
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}
function out(pan) { const g = ac.createGain(); if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(bus); } else g.connect(bus); return g; }
function partial(t, f, type, gain, decay, dest, detune) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + decay + 0.05); return o;
}
function piano(t, m, vel, pan) {   /* felt piano: warm partials through a closing filter, long natural decay */
  const f = hz(m), ring = Math.min(5, 2.2 + (72 - m) * 0.05), lp = ac.createBiquadFilter(), g = out(pan);
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600 + vel * 1200, t); lp.frequency.exponentialRampToValueAtTime(700, t + ring * 0.6); lp.connect(g);
  const v = 0.165 * vel;
  partial(t, f, 'triangle', v, ring, lp, R(-3, 3)); partial(t, f, 'sine', v * 0.9, ring * 1.1, lp, R(-4, 4)); partial(t, f * 2, 'sine', v * 0.32, ring * 0.45, lp); partial(t, f * 3, 'sine', v * 0.1, ring * 0.25, lp);
  const n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain(); n.buffer = noise; nf.type = 'bandpass'; nf.frequency.value = f * 4; ng.gain.setValueAtTime(v * 0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  n.connect(nf); nf.connect(ng); ng.connect(g); n.start(t, Math.random()); n.stop(t + 0.05);
}
function epiano(t, m, vel, pan) {   /* mellow electric piano: a sine with a soft bell on the attack */
  const f = hz(m), g = out(pan), c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), cg = ac.createGain(), ring = 2.6;
  c.frequency.value = f; mo.frequency.value = f; mg.gain.setValueAtTime(f * 1.4 * vel, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.5);
  mo.connect(mg); mg.connect(c.frequency); c.connect(cg); cg.connect(g);
  cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.17 * vel, t + 0.008); cg.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  c.start(t); mo.start(t); c.stop(t + ring + 0.05); mo.stop(t + ring + 0.05);
}
function blown(t, m, dur, vel, pan, o) {   /* flute, shakuhachi and melodica: a slow breath in, vibrato after a moment */
  const f = hz(m), g = out(pan), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.reed ? 1600 : 2400; lp.connect(g);
  const len = dur + 0.25, osc = ac.createOscillator(); osc.type = o.reed ? 'sawtooth' : 'sine'; osc.frequency.value = f;
  const osc2 = ac.createOscillator(); osc2.type = o.reed ? 'square' : 'triangle'; osc2.frequency.value = f * (o.reed ? 1 : 2); osc2.detune.value = o.reed ? 7 : 0;
  const ga = ac.createGain(), gb = ac.createGain(); ga.gain.value = 1; gb.gain.value = o.reed ? 0.35 : 0.12;
  osc.connect(ga); osc2.connect(gb); ga.connect(lp); gb.connect(lp);
  const v = (o.reed ? 0.12 : 0.15) * vel;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.09)); g.gain.setValueAtTime(v, t + Math.max(0.1, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  if (o.bend) [osc, osc2].forEach((x) => { x.detune.setValueAtTime(x.detune.value - o.bend, t); x.detune.linearRampToValueAtTime(x.detune.value, t + 0.18); });
  if (dur > 0.5) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vibRate || 4.6; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.45); lg.gain.linearRampToValueAtTime(o.vib || 9, t + 0.9); l.connect(lg); lg.connect(osc.detune); lg.connect(osc2.detune); l.start(t); l.stop(t + len); }
  [osc, osc2].forEach((x) => { x.start(t); x.stop(t + len + 0.05); });
  if (o.breath) { const n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = out(pan); n.buffer = noise; nf.type = 'bandpass'; nf.frequency.value = f * 2; nf.Q.value = 2; n.connect(nf); nf.connect(ng); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(v * o.breath, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); n.start(t, Math.random() * 0.5); n.stop(t + 0.4); }
}
function ksBuffer(m, bright, secs) {   /* plucked string by Karplus-Strong: a burst of noise ringing in a tuned loop */
  const key = m + '|' + bright; if (ks[key]) return ks[key];
  const sr = ac.sampleRate, f = hz(m), N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * secs), buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0);
  let prev = 0; for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev + (w - prev) * bright; d[i] = prev; }
  const loss = Math.pow(0.001, N / len);
  for (let i = N; i < len; i++) d[i] = (d[i - N] + d[i - N - 1 < 0 ? 0 : i - N - 1]) * 0.5 * loss;
  let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i])); for (let i = 0; i < len; i++) d[i] /= peak || 1;
  return (ks[key] = buf);
}
const PLUCK = { guitar: [0.35, 2.4, 0.12], steel: [0.55, 3.2, 0.12], uke: [0.5, 1.1, 0.09], krar: [0.75, 2.2, 0.12], hasapi: [0.6, 1.8, 0.11], koto: [0.8, 2.8, 0.13] };
function pluck(t, m, vel, pan, kind, bend) {
  const [bright, secs, gain] = PLUCK[kind], src = ac.createBufferSource(), g = out(pan), lp = ac.createBiquadFilter();
  src.buffer = ksBuffer(Math.round(m), bright, secs); lp.type = 'lowpass'; lp.frequency.value = kind === 'guitar' ? 2200 : 4200;
  if (bend) { src.playbackRate.setValueAtTime(Math.pow(2, -bend / 1200), t); src.playbackRate.linearRampToValueAtTime(1, t + 0.12); }
  g.gain.value = gain * vel; src.connect(lp); lp.connect(g); src.start(t); src.stop(t + secs);
}
function mallet(t, m, vel, pan) { const f = hz(m), g = out(pan); partial(t, f, 'sine', 0.2 * vel, 1.1, g); partial(t, f * 4, 'sine', 0.05 * vel, 0.12, g); partial(t, f * 9.8, 'sine', 0.012 * vel, 0.05, g); }
function pad(t, ms, dur) {   /* a warm bed of slightly detuned saws, swelling in slowly */
  const g = out(0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = night ? 600 : 850; lp.connect(g);
  const v = 0.018, len = dur + 1.6;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(1.4, dur * 0.6)); g.gain.setValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  ms.forEach((m, i) => [-6, 6].forEach((dt) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt + R(-2, 2); const pg = ac.createGain(); pg.gain.value = 1; o.connect(pg); pg.connect(lp); o.start(t + i * 0.01); o.stop(t + len + 0.05); }));
}
function vibes(t, m, vel, pan) {   /* vibraphone: a pure bar tone with a soft mallet tick, through a slow motor tremolo */
  const f = hz(m), g = out(pan), trem = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
  trem.gain.value = 0.75; l.frequency.value = 5.2; lg.gain.value = 0.25; l.connect(lg); lg.connect(trem.gain); trem.connect(g);
  partial(t, f, 'sine', 0.19 * vel, 2.6, trem); partial(t, f * 4, 'sine', 0.035 * vel, 0.25, trem); partial(t, f * 10, 'sine', 0.01 * vel, 0.04, trem);
  l.start(t); l.stop(t + 2.7);
}
function upright(t, m, vel) {   /* upright bass: a round plucked note with a woody thump */
  const f = hz(m), g = out(-0.05), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g);
  partial(t, f, 'sine', 0.2 * vel, 0.75, lp); partial(t, f * 2, 'triangle', 0.06 * vel, 0.3, lp); partial(t, f * 3, 'sine', 0.02 * vel, 0.12, lp);
}
function bass(t, m, dur) { const g = out(0), f = hz(m); partial(t, f, 'sine', 0.16, Math.min(dur + 0.6, 4), g); partial(t, f * 2, 'triangle', 0.03, Math.min(dur, 1.5), g); }
function perc(t, kind, vel) {
  const g = out(R(-0.2, 0.2));
  if (kind === 'swish' || kind === 'ride' || kind === 'vinyl') {   /* brushes on the snare, the ride cymbal, and dust on the record */
    const n = ac.createBufferSource(), f = ac.createBiquadFilter(); n.buffer = noise; n.connect(f); f.connect(g);
    const [type, fr, len, v, att] = { swish: ['bandpass', 3200, 0.2, 0.035, 0.07], ride: ['highpass', 7000, 0.16, 0.025, 0.003], vinyl: ['highpass', 4000, 0.006, 0.03, 0.001] }[kind];
    f.type = type; f.frequency.value = fr; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * vel, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.start(t, Math.random() * 0.5); n.stop(t + len + 0.02);
    if (kind === 'ride') partial(t, 5400, 'sine', 0.006 * vel, 0.3, g);
    return;
  }
  if (kind === 'shaker' || kind === 'scrape') {
    const n = ac.createBufferSource(), f = ac.createBiquadFilter(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = kind === 'shaker' ? 6000 : 3000; f.Q.value = 1.2; n.connect(f); f.connect(g);
    const len = kind === 'shaker' ? 0.07 : 0.22, v = 0.05 * vel; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + len * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + len); n.start(t, Math.random() * 0.5); n.stop(t + len + 0.02); return;
  }
  const o = ac.createOscillator(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'taiko' ? 260 : 500; o.connect(lp); lp.connect(g);
  const [f0, f1, len, v] = { drum: [150, 90, 0.35, 0.22], taiko: [90, 48, 0.9, 0.3], gong: [92, 90, 4.5, 0.1] }[kind];
  o.type = kind === 'gong' ? 'sine' : 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.6);
  if (kind === 'gong') { const o2 = ac.createOscillator(); o2.frequency.value = f0 * 2.02; const g2 = ac.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(lp); o2.start(t); o2.stop(t + len); }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * vel, t + (kind === 'gong' ? 0.05 : 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.start(t); o.stop(t + len + 0.05);
}
function lead(e, t, st) {
  const dur = e.d * st, v = e.vel * (night ? 0.8 : 1);
  switch (e.inst) {
    case 'piano': return piano(t, e.m, v, 0.12);
    case 'vibes': return vibes(t, e.m, v, 0.12);
    case 'epiano': return epiano(t, e.m, v, 0.12);
    case 'melodica': return blown(t, e.m, dur, v, 0.12, { reed: true, attack: 0.05, vib: 6, vibRate: 5.5 });
    case 'flute': return blown(t, e.m, dur, v, 0.12, { breath: 0.5, vib: 10 });
    case 'shakuhachi': return blown(t, e.m, dur, v, 0.12, { breath: 0.9, bend: 90, vib: 18, vibRate: 4.2, attack: 0.14 });
    case 'krar': return pluck(t, e.m, v, 0.12, 'krar', 60);
    case 'steel': return pluck(t, e.m, v, 0.12, 'steel', 150);   /* every note slides up into place, like a bar on the strings */
    case 'mallet': { if (e.d >= 4) for (let k = 0; k < e.d; k++) mallet(t + k * st, e.m, v * (k ? 0.55 : 1), 0.12); else mallet(t, e.m, v, 0.12); return; }
  }
}
function comp(e, t) {
  const v = e.vel * (night ? 0.75 : 1);
  if (e.inst === 'piano') return piano(t, e.m, v * 0.85, -0.2);
  if (e.inst === 'mallet') return mallet(t, e.m, v, -0.2);
  if (e.inst === 'rhodes') { e.ms.forEach((m, i) => epiano(t + i * 0.012, m, v * 0.5, -0.2 + i * 0.1)); return; }
  if (e.ms) { const gap = e.roll || (e.up ? 0.012 : 0.018), list = e.up ? e.ms.slice().reverse() : e.ms; list.forEach((m, i) => pluck(t + i * gap, m, v * 0.8, -0.25 + i * 0.12, e.inst)); return; }
  pluck(t, e.m, v, -0.2, e.inst);
}

/* ---------------- scheduler ---------------- */
let playing = false, paused = false, step = 0, nextT = 0, timer = null, startedAt = 0, pending = null, swapT = null;
const placed = [];
const bpm = () => song.bpm * song.cozy.tempo * (night ? 0.86 : 1);
const sixteenth = () => 60 / bpm() / song.beat;
function schedule() {
  const sc = song.cscore, st = sixteenth();
  while (nextT < ac.currentTime + 0.2) {
    (sc.by[step] || []).forEach(([ch, e]) => {
      const t = nextT + (ch === 'pad' || ch === 'bass' ? 0 : R(0, 0.018)) + (song.cozy.swing && step % 4 === 2 ? st * song.cozy.swing : 0);   /* a human hand is never exactly on the grid; jazz swings the off-beats */
      if (ch === 'lead') lead(e, t, st);
      else if (ch === 'comp') comp(e, t);
      else if (ch === 'pad') pad(t, e.ms, e.d * st);
      else if (ch === 'bass') { if (e.walk) upright(t, e.m, 0.9); else bass(t, e.m, e.d * st); }
      else if (!night || e.kind === 'gong') perc(t, e.kind, e.vel);
    });
    placed.push([nextT, step]); if (placed.length > 64) placed.shift();
    nextT += st; step += 1;
    if (step >= sc.total) step = sc.loopStep;
  }
}
function applyMix() { if (!ac) return; filter.frequency.setTargetAtTime(night ? 2800 : 6000, ac.currentTime, 0.4); master.gain.setTargetAtTime(enabled && playing && !paused ? volume : 0, ac.currentTime, 0.15); }
function run(from) { clearInterval(timer); step = from || 0; nextT = ac.currentTime + 0.1; startedAt = nextT; placed.length = 0; timer = setInterval(schedule, 30); schedule(); }
const byId = (id) => SONGS.find((s) => s.id === id) || SONGS[0];
function play(id) {
  if (!ac) return;
  const next = byId(id);
  if (playing && next === (pending || song)) return;
  if (playing) {   /* fade the old tune out, then start the new one from its intro */
    pending = next; clearTimeout(swapT);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.3); clearInterval(timer); timer = null;
    swapT = setTimeout(() => { song = pending; pending = null; if (playing && !paused && enabled) { run(0); applyMix(); } }, 1200);
    return;
  }
  song = next; playing = true;
  if (!enabled || paused) return;
  run(0); applyMix();
}
function stop() { playing = false; pending = null; clearTimeout(swapT); clearInterval(timer); timer = null; if (ac) applyMix(); }
return {
  songs: SONGS,
  init(ctx) { if (!ac && ctx) setup(ctx); return !!ac; },
  play, stop,
  current: () => (playing ? (pending || song).id : null),
  song: () => song,
  select(id) { song = byId(id); },
  isPlaying: () => playing && !!timer,
  setNight(v) { if (night === !!v) return; night = !!v; applyMix(); },
  isNight: () => night,
  setVolume(v) { volume = v; applyMix(); },
  setEnabled(v) { enabled = !!v; if (!ac) return; if (!enabled) { clearInterval(timer); timer = null; } else if (playing && !paused && !timer) run(step); applyMix(); },
  pause() { paused = true; if (timer) { clearInterval(timer); timer = null; } applyMix(); },
  resume() { paused = false; if (ac && playing && enabled && !timer) run(step); applyMix(); },
  duck(hold, depth) { if (!ac || !enabled || !playing) return; hold = hold || 0.5; depth = depth || 0.5; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(volume * depth, t + 0.06); master.gain.setValueAtTime(volume * depth, t + hold); master.gain.linearRampToValueAtTime(volume, t + hold + 0.8); },   /* lower the music under a big sound for `hold` seconds */
  bpm, placed,
  startedAt: () => startedAt,
  time: () => (ac ? ac.currentTime : 0),
  state: () => (ac ? ac.state : 'not started')
};
})();
