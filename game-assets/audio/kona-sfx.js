/* Beju Farm Kona Ridge sounds, synthesised live on SFX's building blocks like every other game sound (build.py inlines this after shop-sfx.js).
   Usage: KonaSFX.play('puff'); KonaSFX.names lists them, KonaSFX.label(name) says what each is for. Follows the game's sound switch and volume. */
const KonaSFX = (function () {
  'use strict';
  const R = (a, b) => a + Math.random() * (b - a);
  let K = null;
  const kit = () => K || (typeof SFX !== 'undefined' && SFX.kit && (K = SFX.kit()));
  const hiss = (t, o) => K.hiss(t, o), tone = (t, o) => K.tone(t, o);
  const S = {
    puff: ['The volcano puffs: a low rumble and a soft whoosh of ash', (t) => {
      tone(t, { f: 55, f2: 38, glide: 0.8, gain: 0.16, dur: 0.9 }); tone(t + 0.05, { f: 82, f2: 50, glide: 0.6, gain: 0.08, dur: 0.7, wave: 'triangle' });
      hiss(t + 0.1, { type: 'lowpass', f: 700, f2: 300, gain: 0.07, dur: 1.2, attack: 0.3 }); }],
    erupt: ['An eruption: a deep boom, rumbling, and ash pattering down', (t) => {
      tone(t, { f: 48, f2: 30, glide: 1.2, gain: 0.22, dur: 1.4 }); hiss(t, { type: 'lowpass', f: 400, gain: 0.18, dur: 0.5 });
      hiss(t + 0.2, { type: 'lowpass', f: 900, f2: 250, gain: 0.1, dur: 2, attack: 0.4 });
      for (let i = 0; i < 14; i++) hiss(t + 1 + i * R(0.06, 0.12), { f: R(2500, 4500), q: 3, gain: 0.025, dur: 0.03 }); }],
    gather: ['Scooping up a pile of ash', (t) => { hiss(t, { type: 'lowpass', f: 1200, f2: 500, gain: 0.08, dur: 0.18 }); tone(t + 0.12, { f: 660, gain: 0.04, dur: 0.12, wave: 'triangle' }); }],
    mix: ['Mixing fertiliser at the shed: a shovel scrape and a sack tied off', (t) => {
      [0, 0.16].forEach((d) => hiss(t + d, { f: 1400, q: 1.2, gain: 0.07, dur: 0.12, f2: 700 })); tone(t + 0.36, { f: 330, f2: 260, glide: 0.05, gain: 0.07, dur: 0.1 }); }],
    feed: ['Spreading fertiliser on a plot', (t) => { for (let i = 0; i < 6; i++) hiss(t + i * 0.04, { f: R(1800, 3000), q: 2, gain: 0.035, dur: 0.05 }); tone(t + 0.28, { f: 784, gain: 0.04, dur: 0.2, wave: 'triangle', verb: true }); }],
    plant: ['Planting: a trowel in soft soil', (t) => { hiss(t, { type: 'lowpass', f: 600, gain: 0.1, dur: 0.12 }); hiss(t + 0.14, { type: 'lowpass', f: 450, gain: 0.08, dur: 0.1 }); tone(t + 0.26, { f: 523, f2: 659, glide: 0.08, gain: 0.05, dur: 0.18, wave: 'triangle' }); }],
    fruit: ['Picking fruit off a tree', (t) => { hiss(t, { f: 2200, q: 1, gain: 0.05, dur: 0.1 }); tone(t + 0.06, { f: 392, f2: 330, glide: 0.04, gain: 0.08, dur: 0.08 }); tone(t + 0.16, { f: 330, gain: 0.05, dur: 0.06 }); }],
    load: ['Loading a tank: cherries and fruit tumbling in, the lid clanks shut', (t) => {
      for (let i = 0; i < 10; i++) tone(t + i * R(0.03, 0.05), { f: R(180, 320), gain: 0.04, dur: 0.05 });
      tone(t + 0.5, { f: 1400, gain: 0.05, dur: 0.25, verb: true }); tone(t + 0.5, { f: 2100, gain: 0.02, dur: 0.15 }); }],
    vent: ['Venting a tank: a sharp hiss of pressure', (t) => { hiss(t, { type: 'highpass', f: 2500, gain: 0.12, dur: 0.6, attack: 0.02 }); tone(t + 0.6, { f: 988, gain: 0.04, dur: 0.15, verb: true }); }],
    alarm: ['Pressure in the red: the gauge rattles', (t) => { [0, 0.1, 0.2].forEach((d) => tone(t + d, { f: 1760, gain: 0.04, dur: 0.05, wave: 'square' })); }],
    pull: ['Pulling a tank in its gold window: the tap opens and it pours, with a bright chime', (t) => {
      hiss(t, { type: 'lowpass', f: 900, gain: 0.08, dur: 0.6 }); for (let i = 0; i < 6; i++) tone(t + i * 0.07, { f: R(300, 520), gain: 0.03, dur: 0.06 });
      [784, 988, 1175].forEach((f, i) => tone(t + 0.5 + i * 0.07, { f, gain: 0.05, dur: 0.4, wave: 'triangle', verb: true })); }],
    sour: ['Pulling an over-fermented tank: a flat pour and a sour note', (t) => { hiss(t, { type: 'lowpass', f: 700, gain: 0.07, dur: 0.5 }); tone(t + 0.45, { f: 311, f2: 277, glide: 0.2, gain: 0.05, dur: 0.4, wave: 'triangle' }); }],
    shells: ['Selling to the island co-op: shells clatter into the till', (t) => { for (let i = 0; i < 5; i++) tone(t + i * R(0.04, 0.07), { f: R(1800, 2800), gain: 0.04, dur: 0.06, wave: 'triangle' }); tone(t + 0.35, { f: 1319, gain: 0.05, dur: 0.3, verb: true }); }],
    level: ['Kona Ridge levels up: a slack-key flourish', (t) => { [392, 494, 587, 784, 988].forEach((f, i) => tone(t + i * 0.08, { f, gain: 0.05, dur: 0.5, wave: 'triangle', verb: true })); }]
  };
  function play(name) {
    const s = S[name]; if (!s || !kit() || !SFX.isEnabled()) return;
    if (K.ac.state !== 'running') K.ac.resume();
    s[1](K.ac.currentTime + 0.02);
  }
  return { play, names: Object.keys(S), label: (n) => (S[n] || [''])[0] };
})();
