/* The storefront scenes: sprite painting, map helpers and each beat of a counter session drawn in map pixels (x2) on a 384 x 704 canvas,
   the same size and scale as the game's own map canvas, so the mockup page and the in-game screenshots share this file. */
const Z = 2;
let animOn = true;
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
  c.fillStyle = o.fg || '#FFF4E4'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, X + w / 2, Y + h / 2 + 1);
  return w;
}
function arrow(c, x, y, t) {   /* the game's own yellow hint arrow */
  const X = Math.round(x) * Z, Y = Math.round(y) * Z - 8 + (animOn ? Math.round(Math.sin(t * 7.8) * 3) : 0);
  c.fillStyle = '#3E2A1C'; c.beginPath(); c.moveTo(X - 13, Y - 24); c.lineTo(X + 13, Y - 24); c.lineTo(X, Y + 3); c.closePath(); c.fill();
  c.fillStyle = '#F2C04A'; c.beginPath(); c.moveTo(X - 9, Y - 21); c.lineTo(X + 9, Y - 21); c.lineTo(X, Y - 3); c.closePath(); c.fill();
}
function ring(c, x, y, r, t, col) { const k = animOn ? (t * 1.4) % 1 : 0.3; c.save(); c.strokeStyle = col || '#F2C04A'; c.globalAlpha = 1 - k; c.lineWidth = 2; c.beginPath(); c.arc(x * Z, y * Z, (r + k * 6) * Z, 0, Math.PI * 2); c.stroke(); c.restore(); }
function frame(t, fps, n, off = 0) { return animOn ? Math.floor(t * fps + off) % n : off % n; }
function float(c, x, y, text, t, period, col) { const k = animOn ? (t % period) / period : 0.4; c.save(); c.globalAlpha = Math.max(0, 1 - k * 1.1); c.font = '700 19px "Zen Kaku Gothic New", system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#3E2A1C'; c.fillText(text, x * Z + 2, (y - k * 12) * Z + 2); c.fillStyle = col || '#FFF4DE'; c.fillText(text, x * Z, (y - k * 12) * Z); c.restore(); }

/* where things stand on the roastery map (native px): the queue in front of the counter, the A-frame sign, the line by the door, the regulars' mugs on the long table */
const QUEUE = [[138, 182], [159, 182], [180, 182]], BUB_Y = [143, 133, 143]   /* the middle customer's bubble sits higher, so three fit side by side */, SIGN_AT = [104, 160], LINE = [[96, 204], [96, 222], [96, 240]], MUGS_AT = [14, 229], DOOR = [96, 350];
const LOOK = {   /* customers wear the game's worker sprite with their own colours: shirt c C D, hat h H k */
  cafe: { c: '#F2C04A', C: '#D8A030', D: '#A87818', h: '#5A4A8A', H: '#463A70', k: '#2E2650' }, konbini: { c: '#78A8E8', C: '#4878C8', D: '#305898', h: '#4878C8', H: '#305898', k: '#203C68' },
  guest: { c: '#E86A3A', C: '#C84E28', D: '#963A1C', h: '#F4DE9C', H: '#D8BC70', k: '#A88C48' }, kissa: { c: '#F4F0E4', C: '#D8D0BC', D: '#A89C84', h: '#3E2A1C', H: '#2E1E14', k: '#1E140C' },
  kenji: { c: '#2C3A80', C: '#202C64', D: '#141C44', h: '#1E1E22', H: '#141418', k: '#0A0A0C' }, aya: { c: '#C8A8E8', C: '#A888C8', D: '#7E64A0', h: '#F8F4EC', H: '#D8D0BC', k: '#A89C84' },
  tanaka: { c: '#8A8E96', C: '#6A6E76', D: '#4A4E56', h: '#6A4A2C', H: '#4E3420', k: '#2E1E14' }, mika: { c: '#F8D870', C: '#D8B048', D: '#A88428', h: '#D84A36', H: '#A8302A', k: '#7A1E1C' },
  sora: { c: '#6CB86A', C: '#4A9848', D: '#2E6A2E', h: '#4A8AB8', H: '#306898', k: '#1E4A70' }
};
const ROAST_COL = { light: '#B07A4A', medium: '#7A4A28', dark: '#3E2414' };
function guy(c, t, x, y, look, dir, moving, off) {   /* a customer standing at (x, y) = their feet */
  const fr = moving ? (dir === 'side' ? frame(t, 7, 2, off || 0) : [1, 0, 2, 0][frame(t, 7, 4, off || 0)]) : 0;
  c.fillStyle = 'rgba(42,42,8,0.3)'; c.beginPath(); c.ellipse(x * Z, (y) * Z, 5 * Z, 1.6 * Z, 0, 0, 7); c.fill();
  put(c, 'worker_' + (dir || 'up') + '_' + fr, x - 8, y - 23, { pal: LOOK[look], flip: dir === 'side' && moving === 'left' });
}
function bubble(c, x, y, o, t) {   /* an order over a customer's head: the bag in its roast's colour, how many, and their patience along the bottom */
  const w = o.n > 1 ? 26 : 18, X = (x - w / 2) * Z, Y = y * Z, H = 17 * Z, shake = o.angry && animOn ? Math.round(Math.sin(t * 40) * 2) : 0;
  c.save(); c.translate(shake, 0);
  c.fillStyle = '#3E2A1C'; rr(c, X - 2, Y - 2, w * Z + 4, H + 4, 7); c.fill(); c.fillStyle = o.angry ? '#FFE4DC' : o.regular ? '#FFF6D8' : '#FFFFFF'; rr(c, X, Y, w * Z, H, 6); c.fill();
  c.fillStyle = '#3E2A1C'; c.beginPath(); c.moveTo((x - 3) * Z, Y + H); c.lineTo((x + 3) * Z, Y + H); c.lineTo(x * Z, Y + H + 8); c.closePath(); c.fill();
  put(c, 'bag_' + o.roast, x - w / 2 + 2, y + 1.5, {});
  if (o.n > 1) { c.font = '700 14px "Zen Kaku Gothic New", system-ui, sans-serif'; c.fillStyle = '#3E2A1C'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('×' + o.n, (x - w / 2 + 15) * Z, Y + 7 * Z); }
  const p = Math.max(0, Math.min(1, o.patience)), bw = (w - 4) * Z; c.fillStyle = 'rgba(62,42,28,0.25)'; c.fillRect(X + 2 * Z, Y + H - 4 * Z, bw, 2 * Z);
  c.fillStyle = p > 0.5 ? '#6CB86A' : p > 0.25 ? '#F2A040' : '#E84A3A'; c.fillRect(X + 2 * Z, Y + H - 4 * Z, Math.round(bw * p), 2 * Z);
  if (o.regular) put(c, 'star_on', x + w / 2 - 4, y - 4);
  c.restore();
}
function stars(c, x, y, n) { for (let i = 0; i < 5; i++) put(c, i < Math.floor(n) ? 'star_on' : 'star_off', x + i * 7, y); }
function seated(c, t) {   /* café regulars at two tables, cups in front of them */
  [[121, 217, 0, 'cafe', 127, 212], [143, 217, 1, 'kissa', 134, 212], [159, 259, 0, 'konbini', 165, 254]].forEach(([x, y, fl, lk, cx, cy]) => {
    c.fillStyle = '#3E2A1C'; c.fillRect((cx - 1) * Z, (cy - 1) * Z, 4 * Z, 4 * Z); c.fillStyle = '#F8F4EC'; c.fillRect(cx * Z, cy * Z, 2 * Z, 2 * Z);
    put(c, 'worker_side_0', x - 8, y - 23, { pal: LOOK[lk], flip: !!fl });
  });
}
function mugs(c, n) { ['kenji', 'aya', 'tanaka', 'mika', 'sora'].slice(0, n).forEach((r, i) => put(c, 'mug', MUGS_AT[0] + i * 12, MUGS_AT[1], { pal: { c: LOOK[r].c } })); }   /* each regular's mug at their place on the long table */
const walk = (t, period, a, b) => { const k = animOn ? (t % period) / period : 0.5; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };

const SCENES = {
  ready: { label: 'The counter can open', draw(c, t) {   /* before: the sign shows OPEN, the board has its three pre-orders, the sign pulses to be tapped */
    seated(c, t); mugs(c, 0); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]); ring(c, SIGN_AT[0] + 10, SIGN_AT[1] + 8, 10, t); arrow(c, SIGN_AT[0] + 10, SIGN_AT[1], t);
    tag(c, 140, 196, '3 pre-orders on the board', { fg: '#F2C04A', size: 11 }); } },
  open: { label: 'Open: the queue', draw(c, t) {   /* open: three at the counter with their orders, a walk-in on the way in, patience draining */
    seated(c, t); mugs(c, 0); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]);
    const dr = animOn ? (t * 0.05) % 1 : 0.3;
    [['cafe', 'light', 2, 0.85], ['konbini', 'medium', 3, 0.55], ['guest', 'dark', 1, 0.3]].forEach(([lk, roast, n, p], i) => { guy(c, t, QUEUE[i][0], QUEUE[i][1], lk, 'up', false); bubble(c, QUEUE[i][0], BUB_Y[i], { roast, n, patience: Math.max(0.05, p - dr * 0.4) }, t); });
    const [wx, wy] = walk(t, 5, [DOOR[0], 330], LINE[0]); guy(c, t, wx, wy, 'kissa', 'up', true);
    tag(c, 60, 196, 'walk-in', { fg: '#FFF4E4', size: 10 }); } },
  serve: { label: 'Serve: tap a customer', draw(c, t) {   /* a matching bag on the shelf: tap the customer, the bag goes over, coins and reputation float up */
    seated(c, t); mugs(c, 0); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]);
    const k = animOn ? (t * 0.45) % 1 : 0.45;
    if (k < 0.45) { guy(c, t, QUEUE[0][0], QUEUE[0][1], 'cafe', 'up', false); bubble(c, QUEUE[0][0], 143, { roast: 'light', n: 2, patience: 0.7 }, t); arrow(c, QUEUE[0][0], 140, t); }
    else { const u = (k - 0.45) / 0.55, x = QUEUE[0][0] + (DOOR[0] - QUEUE[0][0]) * Math.min(1, u * 1.6), y = QUEUE[0][1] + (300 - QUEUE[0][1]) * Math.max(0, u * 1.6 - 0.6); guy(c, t, x, y, 'cafe', u < 0.4 ? 'side' : 'down', 'left'); put(c, 'bag_light', x + 2, y - 15, {}); float(c, QUEUE[0][0], 150, '+31,200', t * 0.45 + 0.55, 1, '#F2C04A'); float(c, QUEUE[0][0], 162, '+40 rep', t * 0.45 + 0.4, 1); }
    guy(c, t, QUEUE[1][0], QUEUE[1][1], 'konbini', 'up', false); bubble(c, QUEUE[1][0], BUB_Y[1], { roast: 'medium', n: 3, patience: 0.6 }, t);
    tag(c, 140, 206, 'cup 88 · ×2.0 pre-order · ×1.24', { fg: '#FFF4E4', size: 10 }); } },
  chain: { label: 'Roast to order', draw(c, t) {   /* nothing on the shelf: the right green in a bin, a roast started for her, her patience racing the drum */
    seated(c, t); mugs(c, 0); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]);
    guy(c, t, QUEUE[0][0], QUEUE[0][1], 'aya', 'up', false); bubble(c, QUEUE[0][0], 143, { roast: 'light', n: 2, patience: 0.62, regular: true }, t);
    ring(c, 21, 75, 14, t); tag(c, 21, 112, 'for Aya · light', { fg: '#F2C04A', size: 10 }); tag(c, 22, 168, 'bin: 160 kg', { fg: '#FFF4E4', size: 10 });
    tag(c, 140, 206, 'roast 68 s · patience 2:30', { fg: '#FFF4E4', size: 10 }); } },
  walkout: { label: 'A walk-out', draw(c, t) {   /* patience gone: the bubble shakes red, they leave, the rating slips a fifth of a star */
    seated(c, t); mugs(c, 0); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]);
    const k = animOn ? (t * 0.4) % 1 : 0.3;
    guy(c, t, QUEUE[0][0], QUEUE[0][1], 'cafe', 'up', false); bubble(c, QUEUE[0][0], 143, { roast: 'light', n: 2, patience: 0.5 }, t);
    if (k < 0.4) { guy(c, t, QUEUE[1][0], QUEUE[1][1], 'guest', 'up', false); bubble(c, QUEUE[1][0], BUB_Y[1], { roast: 'dark', n: 1, patience: 0.02, angry: true }, t); }
    else { const u = (k - 0.4) / 0.6, x = QUEUE[1][0] + (DOOR[0] - QUEUE[1][0]) * Math.min(1, u * 1.5), y = QUEUE[1][1] + (310 - QUEUE[1][1]) * Math.max(0, u * 1.5 - 0.5); guy(c, t, x, y, 'guest', u < 0.33 ? 'side' : 'down', 'left'); tag(c, QUEUE[1][0], 150, 'hmph!', { fg: '#FFB4A0', size: 10 }); }
    stars(c, 94, 151, 3); tag(c, 112, 196, '−⅕ star', { fg: '#FFB4A0', size: 10 }); } },
  regular: { label: 'A regular', draw(c, t) {   /* from four stars, a named regular now and then: their favourite, 2.2x, and a mug on the shelf after 10 visits */
    seated(c, t); mugs(c, 2); put(c, 'sign_open', SIGN_AT[0], SIGN_AT[1]);
    guy(c, t, QUEUE[0][0], QUEUE[0][1], 'kenji', 'up', false); bubble(c, QUEUE[0][0], 143, { roast: 'medium', n: 2, patience: 0.8, regular: true }, t);
    put(c, 'stamp_card', QUEUE[0][0] - 7, 128 - (animOn ? (t * 6) % 6 : 2)); tag(c, 140, 206, 'Kenji · visit 9 of 10', { fg: '#F2C04A', size: 10 }); tag(c, 40, 216, 'mugs: Kenji, Aya', { fg: '#FFF4E4', size: 9 }); } },
  cooldown: { label: 'Back soon', draw(c, t) {   /* closed: the summary is in, the sign flips to BACK SOON and counts down */
    seated(c, t); mugs(c, 0); put(c, 'sign_closed', SIGN_AT[0], SIGN_AT[1]); tag(c, SIGN_AT[0] + 10, SIGN_AT[1] - 8, 'opens in 24:10', { fg: '#FFF4E4', size: 10 });
    tag(c, 150, 196, 'served 14 · +186,400 coins', { fg: '#F2C04A', size: 11 }); } }
};
/* each scene's tap targets, in map pixels: what the interface check tests */
const TARGETS = /*TARGETS*/{};
