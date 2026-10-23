/* in-page inspector for the tutorial audit: what's on screen, where the arrow points, what covers it */
window.AUD = (() => {
  const A = window.__A, $ = (id) => document.getElementById(id);
  const desc = (el) => { if (!el) return null; if (el.id) return '#' + el.id; if (el.dataset && el.dataset.act) return '[' + el.dataset.act + ']'; if (el.dataset && el.dataset.tab) return 'tab:' + el.dataset.tab;
    const c = typeof el.className === 'string' ? el.className.split(' ')[0] : ''; const p = el.closest && el.closest('[data-act],[data-tab],[id]'); return el.tagName.toLowerCase() + (c ? '.' + c : '') + (p ? ' in ' + (p.id ? '#' + p.id : p.dataset.act ? '[' + p.dataset.act + ']' : 'tab:' + p.dataset.tab) : ''); };
  const vis = (el) => el && !el.hidden && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  const overlays = () => [['guide bar', $('guide')], ['toast', $('toast')], ['sheet', $('sheet')], ['gold button', $('goldGo')], ['crack button', $('crackGo')]]
    .concat([...document.querySelectorAll('.hud-l > *, .hud-r > *, .sound')].map((e) => ['HUD ' + (e.id || e.className.split(' ')[0]), e]));
  function coverAt(x, y, target) {
    const out = [], top = document.elementFromPoint(x, y);
    if (top && target && !(top === target || target.contains(top))) out.push('tap lands on ' + desc(top));
    overlays().forEach(([n, e]) => { if (!vis(e) || e === target || e.contains(target) || target.contains(e)) return; const r = e.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) out.push('under ' + n); });
    return out;
  }
  function inspect() {
    if (document.getElementById('modal').hidden) A.renderGuide();   /* measure the arrow as the next refresh would place it */
    const S = A.S, m = $('modal'), pc = $('pcer');
    const r = { lv: A.level(), p: S.prestige, tab: A.tab, sheet: A.sheetOpen, full: A.sheetFull, scene: A.scene(), loc: S.loc, guide: S.guide, guideN: S.guideN || 0, nav: S.nav || null, pwalk: S.pwalk || 0, pwalkDone: !!S.pwalkDone,
      farmSub: S.farmSub, unTab: S.unTab, rankSub: S.rankSub, need: A.prestigeNeed(), queue: A.modalQueue.length, tabs: Object.keys(S.tabs).filter((k) => S.tabs[k]), skinPicks: S.skinPicks, mins: Math.round(S.minutesTotal), coins: Math.round(S.coins), kh: Math.round(S.points) };
    if (!pc.hidden) { const b = pc.querySelector('[data-act="pcer"]'), q = b.getBoundingClientRect(); r.pcer = { text: pc.innerText.replace(/\s+/g, ' ').slice(0, 200), x: q.left + q.width / 2, y: q.top + q.height / 2, under: m.hidden ? '' : $('modalCard').innerText.replace(/\s+/g, ' ').slice(0, 80) }; return r; }
    if (!m.hidden) { r.modal = { text: $('modalCard').innerText.replace(/\s+/g, ' ').trim().slice(0, 400), buttons: [...$('modalCard').querySelectorAll('button')].filter((b) => b.offsetParent && !b.disabled).map((b) => { const q = b.getBoundingClientRect(); const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { covered: top && !(top === b || b.contains(top)) ? desc(top) : '', label: b.innerText.replace(/\s+/g, ' ').trim(), act: b.dataset.act || '', green: b.classList.contains('green') || b.classList.contains('gold'), x: q.left + q.width / 2, y: q.top + q.height / 2 }; }) }; return r; }
    let mode = null, chain = '';
    if (S.guide < A.GUIDE.length) { const g = A.GUIDE[S.guide]; if (g.when && !g.when()) mode = 'guide-wait'; else { mode = 'guide'; chain = g.target; } }
    else if (S.pwalk && A.PWALK[S.pwalk]) { mode = 'pwalk'; chain = A.PWALK[S.pwalk][1]; }
    else if (A.navCur()) { mode = 'nav'; chain = A.navCur().t; }
    r.mode = mode; r.guideText = $('guide').hidden ? '' : $('guide').innerText.replace(/\s+/g, ' ').trim();
    if (!chain) return r;
    r.chain = chain;
    let t = null;
    if (mode === 'pwalk') { const qs = chain.split(', '); for (let i = 0; i < qs.length; i++) { const el = document.querySelector(qs[i]); if (el && el.offsetParent !== null) { t = { i, el }; break; } } }
    else t = A.navTarget(chain);
    const ar = $('garrow'), aq = ar.getBoundingClientRect();
    r.arrow = ar.hidden ? null : { x: Math.round(aq.left + 11), y: Math.round(aq.top + 26) };
    if (!t) { r.target = null; return r; }
    const el = t.el; let px, py, tipY;
    if (el === A.cv) { const c = el.getBoundingClientRect(); px = c.left + t.pt[0] / A.W * c.width; py = c.top + (t.pt[1] + 4) / A.H * c.height; tipY = c.top + (t.pt[1] - 2) / A.H * c.height; }
    else { const q = el.getBoundingClientRect(); px = q.left + q.width / 2; py = q.top + Math.min(q.height / 2, 14); tipY = q.top; }
    r.target = { i: t.i, n: chain.split(', ').length, sel: chain.split(', ')[t.i], desc: el === A.cv ? 'map ' + t.pt.map(Math.round).join(',') : desc(el), x: Math.round(px), y: Math.round(py), inView: py > 0 && py < innerHeight };
    if (el !== A.cv && $('panel').contains(el)) { const p = $('panel').getBoundingClientRect(), q = el.getBoundingClientRect(); r.target.inSheetView = q.top >= p.top - 2 && q.bottom <= p.bottom + 2; }
    r.cover = coverAt(px, py, el);
    if (r.arrow) r.arrowOff = Math.round(Math.hypot(r.arrow.x - px, r.arrow.y - tipY));
    return r;
  }
  window.__toasts = []; new MutationObserver(() => { const t = $('toast'); if (!t.hidden && t.textContent) window.__toasts.push([Math.round(performance.now() / 1000), t.textContent]); }).observe($('toast'), { attributes: true, childList: true, characterData: true, subtree: true });
  return { inspect };
})();
