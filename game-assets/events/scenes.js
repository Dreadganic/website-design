/* The event scenes: sprite painting, map helpers and each event drawn in map pixels (x2) on a 384 x 704 canvas, the same
   size and scale as the game's own map canvas, so the page and the game screenshots share this file. */
const GUEST = { cafe: { c: '#F2C04A', C: '#D8A030', D: '#A87818', h: '#5A4A8A', H: '#463A70', k: '#2E2650' }, konbini: { c: '#78A8E8', C: '#4878C8', D: '#305898', h: '#4878C8', H: '#305898', k: '#203C68' }, guest: { c: '#E86A3A', C: '#C84E28', D: '#963A1C', h: '#F4DE9C', H: '#D8BC70', k: '#A88C48' } };
const Z = 2, CW = 192, CH = 216;
let animOn = true;

/* sprites: the game's own format, painted once into small canvases */
const cache = {};
function hexA(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length > 6 ? parseInt(h.slice(6, 8), 16) : 255]; }
function sprite(name, over) {
  const k = name + (over ? JSON.stringify(over) : '');
  if (cache[k]) return cache[k];
  const s = SP[name], c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
  const x = c.getContext('2d'), im = x.createImageData(s.w, s.h), pal = Object.assign({}, s.pal, over || {});
  s.rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; const [R, G, B, A] = hexA(pal[ch]); const o = (y * s.w + i) * 4; im.data[o] = R; im.data[o + 1] = G; im.data[o + 2] = B; im.data[o + 3] = A; } });
  x.putImageData(im, 0, 0); return (cache[k] = c);
}
function put(c, name, x, y, o = {}) {
  const s = sprite(name, o.pal), sc = (o.scale || 1) * Z, X = Math.round(x) * Z, Y = Math.round(y) * Z;
  c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.flip) { c.translate(X + s.width * sc, Y); c.scale(-1, 1); c.drawImage(s, 0, 0, s.width * sc, s.height * sc); }
  else c.drawImage(s, X, Y, s.width * sc, s.height * sc);
  c.restore();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function tag(c, x, y, text, o = {}) {   /* a pill centred on a map point (native px) */
  const size = o.size || 12; c.font = '600 ' + size + 'px "Pixelify Sans", monospace';
  const w = Math.ceil(c.measureText(text).width) + 12, h = size + 8, X = Math.round(x * Z - w / 2), Y = Math.round(y * Z - h / 2);
  c.fillStyle = o.edge || '#1E140C'; rr(c, X - 2, Y - 2, w + 4, h + 4, 6); c.fill();
  c.fillStyle = o.bg || '#3E2A1C'; rr(c, X, Y, w, h, 5); c.fill();
  c.fillStyle = o.fg || '#FFB4A0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, X + w / 2, Y + h / 2 + 1);
  return w;
}
function cost(c, x, y, n) { tag(c, x, y, '−' + n.toLocaleString('en-US') + ' coins', { fg: '#FFB4A0' }); }
function arrow(c, x, y, t) {   /* the game's own yellow hint arrow */
  const X = Math.round(x) * Z, Y = Math.round(y) * Z - 8 + (animOn ? Math.round(Math.sin(t * 7.8) * 3) : 0);
  c.fillStyle = '#3E2A1C'; c.beginPath(); c.moveTo(X - 13, Y - 24); c.lineTo(X + 13, Y - 24); c.lineTo(X, Y + 3); c.closePath(); c.fill();
  c.fillStyle = '#F2C04A'; c.beginPath(); c.moveTo(X - 9, Y - 21); c.lineTo(X + 9, Y - 21); c.lineTo(X, Y - 3); c.closePath(); c.fill();
}
function ring(c, x, y, r, t, col) { const k = animOn ? (t * 1.4) % 1 : 0.3; c.save(); c.strokeStyle = col || '#FFFFFF'; c.globalAlpha = 1 - k; c.lineWidth = 2; c.beginPath(); c.arc(x * Z, y * Z, (r + k * 6) * Z, 0, Math.PI * 2); c.stroke(); c.restore(); }
function tint(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x * Z, y * Z, w * Z, h * Z); }
function frame(t, fps, n, off = 0) { return animOn ? Math.floor(t * fps + off) % n : off % n; }

/* ---- scenes: native coordinates on the 192 x 352 map ---- */
const HUILA_RIPE = [[16, 112], [70, 112], [52, 129], [110, 160], [164, 160], [146, 177]];
function pigs(c, t, list, gold) {
  list.forEach(([bx, by], i) => put(c, 'dirt', bx - 2, by + 7, { alpha: 0.9 }));
  list.forEach(([bx, by], i) => {
    const ph = (animOn ? t : 0.6) * 1.1 + i * 1.9, dx = Math.sin(ph) * 7, flip = Math.cos(ph) > 0;
    put(c, gold === i ? 'pig_gold' : 'pig_' + frame(t, 6, 2, i), bx + dx, by, { flip });
    if (gold === i) { const k = frame(t, 3, 3, i); put(c, 'sparkle', bx + dx + [2, 11, 6][k], by - 6 + [0, 2, -2][k]); put(c, 'truffle', bx - 6, by + 7); }
  });
}
const PIG_SPOTS = [[14, 183], [38, 170], [60, 187], [72, 165]];
const SCENES = {
  hero: { bg: 'huila', crop: [0, 0, 192, 352], draw(c, t) { tint(c, 10, 156, 82, 46, 'rgba(122,74,40,0.16)'); pigs(c, t, PIG_SPOTS); cost(c, 50, 150, 14400); arrow(c, 46, 168, t); } },
  b1: { bg: 'huila', crop: [0, 140, 120, 75], draw(c, t) { const k = animOn ? (t * 0.35) % 1 : 0.5; [[-10, 176], [-24, 186], [-6, 194]].forEach(([x, y], i) => put(c, 'pig_' + frame(t, 6, 2, i), x + k * 34, y, { flip: true })); } },
  b2: { bg: 'huila', crop: [0, 140, 120, 75], draw(c, t) { tint(c, 10, 156, 82, 46, 'rgba(122,74,40,0.18)'); pigs(c, t, PIG_SPOTS); cost(c, 54, 152, 4800); } },
  b3: { bg: 'huila', crop: [0, 140, 120, 75], draw(c, t) { tint(c, 10, 156, 82, 46, 'rgba(122,74,40,0.18)'); pigs(c, t, PIG_SPOTS.slice(1, 4)); const k = animOn ? (t * 0.8) % 1 : 0.4; put(c, 'pig_' + frame(t, 10, 2), 14 - k * 30, 183 - k * 6, { flip: false }); c.fillStyle = '#FFFFFF'; [0, 4, 8].forEach((d) => c.fillRect((30 - k * 30 + d) * Z, (188 - k * 6 + d / 2) * Z, 4 * Z, Z)); arrow(c, 46, 168, t); tag(c, 96, 152, '2 of 4', { fg: '#F2C04A' }); } },
  b4: { bg: 'huila', crop: [0, 140, 120, 75], draw(c, t) { const k = animOn ? (t * 0.5) % 1 : 0.35; put(c, 'weathervane', 22, 166 - k * 10, { alpha: 1 - k * 0.5 }); tag(c, 72, 176 - k * 10, 'Pig raid 3 / 5', { fg: '#F2C04A' }); tag(c, 72, 194 - k * 4, '2 more for the weathervane', { fg: '#FFF4E4', size: 10 }); } },

  pigs: { bg: 'huila', crop: [0, 104, CW, CH], draw(c, t, rare) { tint(c, 10, 156, 82, 46, 'rgba(122,74,40,0.16)'); pigs(c, t, PIG_SPOTS, rare ? 2 : -1); cost(c, 50, 150, 14400); if (rare) tag(c, 140, 214, 'rare: the truffle pig', { fg: '#F2C04A', size: 11 }); } },
  rust: { bg: 'mogiana', crop: [0, 92, CW, CH], draw(c, t, rare) {
    if (rare) { put(c, 'bush_silver', 128, 112); const k = frame(t, 3, 3); put(c, 'sparkle', 128 + [3, 11, 7][k], 112 + [4, 8, 1][k]); tag(c, 60, 210, 'rare: a rust-proof seedling', { fg: '#F2C04A', size: 11 }); }
    const sick = [[110, 112], [146, 112], [110, 129], [146, 129], [164, 129]];
    sick.forEach(([x, y], i) => { put(c, 'rust', x, y); const k = animOn ? ((t * 0.6 + i * 0.37) % 1) : 0.4; put(c, 'leaf_drop', x + 5, y + 12 + k * 10, { alpha: 1 - k }); });
    ring(c, 137, 140, 7, t, '#F8B848'); ring(c, 173, 123, 7, t + 0.4, '#F8B848');
    tag(c, 146, 157, 'next spreads in 4 s', { fg: '#F8B848', size: 11 }); arrow(c, 119, 116, t); cost(c, 52, 101, 9600); } },
  monkeys: { bg: 'mogiana', crop: [0, 22, CW, CH], draw(c, t, rare) {
    for (let i = 0; i < 3; i++) {
      const ph = ((animOn ? t * 0.22 : 0.3) + i / 3) % 1, out = ph < 0.5, u = out ? ph * 2 : 2 - ph * 2;
      const x = 112 - u * 88, y = 106 - Math.sin(u * Math.PI) * 8;
      put(c, out ? 'monkey_' + frame(t, 8, 2, i) : 'monkey_e', x - 7, y - 12, { flip: !out });
      if (out) { c.fillStyle = '#E83A30'; c.fillRect((x + 9) * Z, (y - 4 + (i % 2)) * Z, Z, Z); c.fillRect((x + 13) * Z, (y - 2) * Z, Z, Z); }
      if (i === 0 && out) arrow(c, x, y - 12, t);
    }
    if (rare) { const ph = ((animOn ? t * 0.22 : 0.3) + 0.15) % 1, out = ph < 0.5, u = out ? ph * 2 : 2 - ph * 2, x = 112 - u * 88, y = 106 - Math.abs(Math.sin(u * Math.PI * 6)) * 4;
      put(c, 'capuchin_baby_' + frame(t, 6, 2), x - 5, y - 9, { flip: !out }); const k = frame(t, 3, 3); put(c, 'sparkle', x - 4 + k * 3, y - 16); tag(c, 66, 128, 'rare: a baby capuchin', { fg: '#F2C04A', size: 11 }); }
    cost(c, 150, 92, 13800); } },
  crows: { bg: 'huila', crop: [0, 74, CW, CH], draw(c, t, rare) {
    HUILA_RIPE.forEach(([x, y], i) => { const mag = rare && i === 2; put(c, mag ? 'magpie_sit' : 'crow_sit', x + 4, y + 2 - frame(t, 2, 2, i), { flip: i % 2 === 1 }); if (mag && frame(t, 1.5, 3) === 0) put(c, 'sparkle', x + 2, y - 2); if (animOn && frame(t, 3, 4, i) === 0) { c.fillStyle = '#E83A30'; c.fillRect((x + 8) * Z, (y + 14) * Z, Z, Z); } });
    for (let i = 0; i < 3; i++) { const a = (animOn ? t * 0.7 : 0.5) + i * 2.1, x = 96 + Math.cos(a) * 54, y = 92 + Math.sin(a) * 9; put(c, 'crow_fly' + frame(t, 7, 2, i), x - 6, y - 4, { flip: Math.sin(a) > 0 }); }
    put(c, 'scarecrow_' + frame(t, 2.5, 2), 128, 109); arrow(c, 136, 110, t); if (rare) tag(c, 60, 230, 'rare: a magpie with a ring', { fg: '#F2C04A', size: 11 }); cost(c, 140, 212, 19200); tag(c, 140, 226, 'half lands in the first 2 min', { fg: '#FFF4E4', size: 10 }); } },
  hornets: { bg: 'mill', crop: [0, 70, CW, CH], draw(c, t, rare) {
    [[99, 150], [145, 150]].forEach(([x, y]) => tint(c, x, y, 40, 11, rare ? 'rgba(255,220,120,0.22)' : 'rgba(255,196,60,0.30)'));
    put(c, rare ? 'hive_gold' : 'nest', 159, 162); if (rare) { const k = frame(t, 3, 3); put(c, 'sparkle', 156 + k * 5, 158 + (k % 2) * 6); tag(c, 120, 232, 'rare: a golden hive of bees', { fg: '#F2C04A', size: 11 }); }
    const k = animOn ? (t * 0.8) % 1 : 0.5; put(c, 'smoke', 146 - k * 4, 160 - k * 8, { alpha: 0.9 - k * 0.8 });
    for (let s = 0; s < 5; s++) { c.fillStyle = s < frame(t, 1.6, 6) ? '#F2C04A' : '#3E2A1C'; c.fillRect((153 + s * 5) * Z, 178 * Z, 4 * Z, 3 * Z); }
    [[119, 155], [165, 155]].forEach(([cx, cy], r) => { for (let i = 0; i < 7; i++) { const a = (animOn ? t : 0.4) * (2.6 + i * 0.13) + i * 2.1 + r; put(c, (rare ? 'bee_' : 'hornet_') + frame(t, rare ? 8 : 12, 2, i), cx + Math.sin(a) * 17 - 2, cy + Math.cos(a * 1.3) * 6 - 2); } });
    arrow(c, 165, 162, t); cost(c, 60, 140, 14400); tag(c, 120, 198, 'these 2 racks stop drying', { fg: '#FFF4E4', size: 10 }); } },
  rats: { bg: 'mill', crop: [0, 176, CW, CH], draw(c, t, rare) {
    const holes = [[82, 304], [100, 296], [118, 306], [136, 298], [154, 306], [172, 298]], tails = [1, 3, 4];
    holes.forEach(([x, y], i) => put(c, tails.includes(i) ? 'hole_tail' : 'hole', x, y, { flip: i === 3 }));
    put(c, 'trap', 136, 294); tag(c, 141, 286, '✓', { fg: '#A8C86A', size: 11 });
    put(c, 'rat_' + frame(t, 5, 2), 14, 292, { flip: frame(t, 0.5, 2) === 1 });
    const u = animOn ? (t * 0.35) % 1 : 0.3; put(c, (rare ? 'rat_white_' : 'rat_') + frame(t, 8, 2, 1), 42 + u * 60, 318, { flip: true }); if (rare) { put(c, 'sparkle', 46 + u * 60, 310); tag(c, 60, 240, 'rare: a white rat with an old sack', { fg: '#F2C04A', size: 11 }); }
    arrow(c, 105, 296, t); tag(c, 44, 282, 'dried lots −2% a min', { fg: '#FFF4E4', size: 10 }); cost(c, 128, 256, 7200); tag(c, 128, 272, '1 of 3 traps set', { fg: '#F2C04A', size: 11 }); } },
  karen: { bg: 'roast', crop: [0, 112, CW, CH], draw(c, t, rare) {
    const gy = animOn ? (t * 12) % 36 : 10;
    put(c, 'worker_down_' + (1 + frame(t, 4, 2)), 86, 232 + gy, { pal: GUEST.cafe });
    put(c, 'worker_down_' + (1 + frame(t, 4, 2, 1)), 100, 252 + ((gy + 18) % 36), { pal: GUEST.konbini });
    if (rare) { put(c, 'karen_hat', 120, 155 + (frame(t, 3, 2) ? 0 : -1)); if (frame(t, 2, 4) === 1) tag(c, 150, 166, 'yip!', { fg: '#FFF4E4', size: 9 }); tag(c, 142, 244, 'rare: her Sunday best, and her dog', { fg: '#F2C04A', size: 11 }); }
    else put(c, 'karen', 122, 156 + (frame(t, 3, 2) ? 0 : -1));
    c.font = '600 13px "Pixelify Sans", monospace'; const msg = 'This was meant to be LIGHT!', w = c.measureText(msg).width + 16, X = 74 * Z - w / 2, Y = 140 * Z;
    c.fillStyle = '#3E2A1C'; rr(c, X - 2, Y - 2, w + 4, 30, 7); c.fill(); c.fillStyle = '#FFFFFF'; rr(c, X, Y, w, 26, 6); c.fill();
    c.fillStyle = '#3E2A1C'; c.beginPath(); c.moveTo(X + w - 22, Y + 26); c.lineTo(X + w - 6, Y + 26); c.lineTo(126 * Z, 162 * Z); c.closePath(); c.fill();
    c.fillStyle = '#C8402E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(msg, X + w / 2, Y + 14);
    ['Swap it for a light roast', 'That is a light roast', "Here's 10% off"].forEach((s, i) => { tag(c, 136, 194 + i * 14, s, { bg: '#F4E6C6', fg: '#3E2A1C', edge: '#6E4624', size: 11 }); });
    cost(c, 52, 196, 21600); tag(c, 52, 210, 'bags −35%', { fg: '#FFF4E4', size: 10 }); } },
  power: { bg: 'roast', crop: [0, 0, CW, CH], draw(c, t, rare) {
    tint(c, 0, 0, 192, 352, 'rgba(10,14,40,0.68)');
    const g = c.createRadialGradient(14 * Z, 155 * Z, 2, 14 * Z, 155 * Z, 30 * Z); g.addColorStop(0, 'rgba(255,224,140,0.55)'); g.addColorStop(1, 'rgba(255,224,140,0)'); c.fillStyle = g; c.fillRect(0, 110 * Z, 60 * Z, 90 * Z);
    if (rare) [[124, 128], [150, 128], [176, 128]].forEach(([x, y], i) => { const gl = c.createRadialGradient((x + 2) * Z, (y + 1) * Z, 1, (x + 2) * Z, (y + 1) * Z, 16 * Z); gl.addColorStop(0, 'rgba(255,214,120,0.5)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gl; c.fillRect((x - 16) * Z, (y - 16) * Z, 36 * Z, 36 * Z); put(c, 'candle_' + frame(t, 5, 2, i), x, y); });
    const box = rare ? 'fusebox_brass' : 'fusebox';
    put(c, box, 6, 148);
    c.fillStyle = '#1E140C'; rr(c, 26 * Z, 122 * Z, 76 * Z, 70 * Z, 10); c.fill();
    put(c, box, 32, 128, { scale: 4, pal: rare ? { g: '#F4F0E4', r: '#F4F0E4' } : { g: '#E84A3A' } });
    if (rare) tag(c, 140, 160, 'rare: candlelight', { fg: '#F2C04A', size: 11 });
    const order = ['2', '1', '3'], lit = frame(t, 1.6, 4);
    [50, 66, 82].forEach((x, i) => tag(c, x, 134, order[i], { fg: lit === +order[i] - 1 ? '#3E2A1C' : '#FFF4E4', bg: lit === +order[i] - 1 ? '#F2C04A' : '#3E2A1C', size: 12 }));
    tag(c, 51, 98, 'roasters at ⅔ speed', { fg: '#FFF4E4', size: 10 }); cost(c, 146, 112, 15600); tag(c, 146, 126, 'no catching the crack', { fg: '#FFF4E4', size: 10 }); } },
  fire: { bg: 'roast', crop: [0, 0, CW, CH], draw(c, t, rare) {
    for (let k = 0; k < 4; k++) { const u = animOn ? (t * 0.45 + k / 4) % 1 : k / 4; put(c, 'smoke_dark', 42 + Math.sin(u * 6 + k) * 3, 44 - u * 44, { alpha: 0.85 * (1 - u) }); }
    const fl = rare ? 'flame_blue_' : 'flame_'; put(c, fl + frame(t, 7, 2), 40, 50); put(c, fl + frame(t, 7, 2, 1), 50, 55, { flip: true }); if (rare) tag(c, 140, 150, 'rare: a blue fire', { fg: '#A8E4FF', size: 11 });
    const left = 42, a0 = -Math.PI / 2; c.save(); c.lineWidth = 4; c.strokeStyle = '#3E2A1C'; c.beginPath(); c.arc(52 * Z, 110 * Z, 10 * Z, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#F07A64'; c.beginPath(); c.arc(52 * Z, 110 * Z, 10 * Z, a0, a0 + Math.PI * 2 * left / 60); c.stroke(); c.restore();
    tag(c, 52, 110, '0:' + left, { fg: '#FFF4E4', size: 11 });
    put(c, 'extinguisher', 98, 66); arrow(c, 101, 66, t); tag(c, 52, 128, 'batch burns at 0:00', { fg: '#FFF4E4', size: 10 }); cost(c, 150, 104, 6300); } },
  typhoon: { bg: 'mogiana', crop: [0, 62, CW, CH], minis: [['mill', [0, 90, CW, 52]], ['roast', [0, 262, CW, 52]]], draw(c, t) {
    tint(c, 0, 0, 192, 352, 'rgba(18,28,58,0.38)');
    [[16, 160], [52, 160]].forEach(([x, y]) => { put(c, 'stake', x + 3, y + 9); put(c, 'stake', x + 13, y + 9); });
    [[110, 160], [146, 160]].forEach(([x, y], i) => ring(c, x + 9, y + 14, 6, t + i * 0.4, '#F2C04A'));
    rain(c, t, 0, 62, 192, 176, 90); wind(c, t, 62, 176);
    tag(c, 96, 112, 'TYPHOON IN 1:42', { fg: '#F2C04A', size: 14 });
    tag(c, 50, 130, 'Farm ✓', { fg: '#A8C86A', size: 11 }); tag(c, 96, 130, 'Mill', { fg: '#FFF4E4', size: 11 }); tag(c, 146, 130, 'Roastery', { fg: '#FFF4E4', size: 11 });
    tag(c, 128, 196, 'stake 2 more', { fg: '#F2C04A', size: 11 }); },
    mini(c, t, i) {
      if (i === 0) { [7, 53, 99, 145].forEach((x, k) => { if (k < 3) { put(c, 'tarp', x, 98); put(c, 'tarp', x, 103); } }); ring(c, 165, 104, 7, t, '#F2C04A'); tag(c, 152, 132, 'tarp the racks: 3 of 4', { fg: '#F2C04A', size: 10 }); tint(c, 0, 0, 192, 352, 'rgba(18,28,58,0.30)'); rain(c, t, 0, 90, 192, 52, 30); }
      else { ring(c, 177, 291, 12, t, '#F2C04A'); arrow(c, 177, 282, t); tag(c, 116, 292, 'bring in the plants', { fg: '#F2C04A', size: 10 }); }
    } }
};
function rain(c, t, x0, y0, w, h, n) { c.save(); c.strokeStyle = 'rgba(200,228,244,0.75)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < n; i++) { const sx = (i * 73.13) % w, sy = (i * 41.7 + (animOn ? t * 160 : 0)) % h; const x = x0 + sx, y = y0 + sy; c.moveTo(x * Z, y * Z); c.lineTo((x - 3) * Z, (y + 7) * Z); } c.stroke(); c.restore(); }
function wind(c, t, y0, h) { c.save(); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = ((i * 61 + (animOn ? t * 90 : 20)) % 240) - 30, y = y0 + 20 + (i * 29) % (h - 30); c.beginPath(); c.moveTo(x * Z, y * Z); c.lineTo((x + 22) * Z, y * Z); c.stroke(); } c.restore(); }

/* each event's tap targets, in map pixels: what check.py tests against the interface */
const TARGETS = /*TARGETS*/{};
