/* Beju Farm roastery counter sounds, synthesised live on SFX's building blocks like every other game sound (build.py inlines this after event-sfx.js).
   Usage: ShopSFX.play('open'); ShopSFX.names lists them, ShopSFX.label(name) says what each is for. Follows the game's sound switch and volume. */
const ShopSFX = (function () {
  'use strict';
  const R = (a, b) => a + Math.random() * (b - a);
  let K = null;
  const kit = () => K || (typeof SFX !== 'undefined' && SFX.kit && (K = SFX.kit()));
  const hiss = (t, o) => K.hiss(t, o), tone = (t, o) => K.tone(t, o);
  function bell(t, f, gain, dur) { tone(t, { f, gain, dur: dur || 0.6, verb: true }); tone(t, { f: f * 2.76, gain: gain * 0.35, dur: (dur || 0.6) * 0.45, verb: true }); tone(t, { f: f * 5.4, gain: gain * 0.1, dur: (dur || 0.6) * 0.2 }); }
  function chime(t, gain) {   /* the shop door's brass chime: three little bells, a touch out of step */
    [1318, 1568, 1976].forEach((f, i) => bell(t + i * 0.07 + R(0, 0.015), f * R(0.995, 1.005), gain * (1 - i * 0.15), 0.9));
  }
  function voice(t, f, f2, dur, gain, o) {   /* a short sung syllable: a filtered saw gliding between two notes */
    const ac = K.ac, osc = ac.createOscillator(), flt = ac.createBiquadFilter(), g = ac.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.7);
    flt.type = 'bandpass'; flt.frequency.value = (o && o.bp) || 1100; flt.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.setValueAtTime(gain, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(flt); flt.connect(g); g.connect(K.out); osc.start(t); osc.stop(t + dur + 0.05);
  }
  const S = {
    open: ['Opening the counter: the shutter rolls up, the door chime, and a cheerful "irasshaimase"', (t) => {
      for (let i = 0; i < 9; i++) hiss(t + i * 0.035, { f: 900 + i * 120, q: 5, gain: 0.05, dur: 0.05 });   /* the shutter's slats */
      chime(t + 0.4, 0.09); [[523, 587], [659, 698], [784, 880], [659, 659]].forEach(([a, b], i) => voice(t + 0.75 + i * 0.13, a, b, 0.16, 0.05)); }],
    board: ['A new pre-order pinned to the board', (t) => { hiss(t, { f: 2400, q: 1.5, gain: 0.06, dur: 0.08 }); tone(t + 0.06, { f: 900, f2: 700, glide: 0.04, gain: 0.08, dur: 0.06, wave: 'triangle' }); }],
    arrive: ['A customer comes in: the door chime, softer', (t) => { chime(t, 0.05); hiss(t + 0.1, { type: 'lowpass', f: 500, gain: 0.03, dur: 0.25 }); }],
    regular: ['A regular comes in: the chime and a warm "ah, hello!"', (t) => { chime(t, 0.05); voice(t + 0.3, 392, 523, 0.18, 0.05, { bp: 900 }); voice(t + 0.5, 523, 494, 0.22, 0.045, { bp: 900 }); }],
    serve: ['Serving: the bag across the counter, the till, coins', (t) => {
      hiss(t, { f: 1800, q: 0.8, gain: 0.08, dur: 0.14, f2: 900 }); hiss(t + 0.12, { type: 'lowpass', f: 600, gain: 0.06, dur: 0.06 });   /* paper bag set down */
      tone(t + 0.22, { f: 2637, gain: 0.07, dur: 0.35, verb: true }); tone(t + 0.22, { f: 3951, gain: 0.03, dur: 0.2 });   /* the till's ding */
      [0, 0.06, 0.11].forEach((d) => tone(t + 0.36 + d, { f: R(3000, 4200), gain: 0.03, dur: 0.05, wave: 'triangle' })); }],
    wrong: ['Serving the wrong roast: accepted, but a polite "hmm"', (t) => { hiss(t, { f: 1800, q: 0.8, gain: 0.06, dur: 0.12 }); voice(t + 0.15, 330, 294, 0.28, 0.045, { bp: 700 }); tone(t + 0.3, { f: 1760, gain: 0.04, dur: 0.25, verb: true }); }],
    hurry: ['Patience running low: a foot tap and a sigh', (t) => { [0, 0.22, 0.44].forEach((d) => { hiss(t + d, { type: 'lowpass', f: 420, gain: 0.25, dur: 0.06 }); tone(t + d, { f: 140, f2: 90, glide: 0.04, gain: 0.12, dur: 0.07 }); }); voice(t + 0.6, 330, 220, 0.45, 0.05, { bp: 650 }); }],
    walkout: ['A walk-out: "hmph", footsteps and the door bumping shut', (t) => {
      voice(t, 260, 196, 0.3, 0.06, { bp: 600 }); [0.3, 0.5, 0.7].forEach((d) => hiss(t + d, { type: 'lowpass', f: 380, gain: 0.06, dur: 0.06 }));
      tone(t + 0.95, { f: 110, f2: 70, glide: 0.1, gain: 0.12, dur: 0.18 }); bell(t + 0.97, 1318, 0.025, 0.4); tone(t + 1.1, { f: 233, gain: 0.04, dur: 0.4, wave: 'triangle' }); tone(t + 1.3, { f: 196, gain: 0.04, dur: 0.6, wave: 'triangle' }); }],
    lastcall: ['A minute left: the hand bell for last orders', (t) => { [0, 0.18, 0.36].forEach((d) => bell(t + d, 1760 * R(0.99, 1.01), 0.06, 0.5)); }],
    close: ['Closing: the shutter rolls down and the day is totted up', (t) => {
      for (let i = 0; i < 9; i++) hiss(t + i * 0.035, { f: 1900 - i * 120, q: 5, gain: 0.05, dur: 0.05 });
      [523, 659, 784, 1047].forEach((f, i) => tone(t + 0.45 + i * 0.09, { f, gain: 0.06, dur: 0.4, wave: 'triangle', verb: true })); }],
    starup: ['The rating rises a star', (t) => { [1047, 1319, 1568, 2093].forEach((f, i) => bell(t + i * 0.06, f, 0.05, 0.6)); hiss(t, { type: 'highpass', f: 6000, gain: 0.04, dur: 0.5, attack: 0.2 }); }],
    stardown: ['The rating slips', (t) => { tone(t, { f: 659, gain: 0.05, dur: 0.25, wave: 'triangle' }); tone(t + 0.2, { f: 523, gain: 0.05, dur: 0.4, wave: 'triangle' }); }]
  };
  function play(name) {
    const s = S[name]; if (!s || !kit() || !SFX.isEnabled()) return;
    if (K.ac.state !== 'running') K.ac.resume();
    s[1](K.ac.currentTime + 0.02);
  }
  return { play, names: Object.keys(S), label: (n) => (S[n] || [''])[0] };
})();
