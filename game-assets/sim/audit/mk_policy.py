"""Writes audit/policy_audit.js from ../policy.js: the playtest bot, changed so the player (audit.js) handles every window, lesson and walk.
The bot only picks and runs the mill during Rosa's lessons, and spends and plays only when no window or walk is up."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, '..', 'policy.js')).read()
def rep(a, b):
    global src
    assert src.count(a) == 1, a[:60]
    src = src.replace(a, b)
rep("const closeAll = () => { let g = 0; while (!document.getElementById('modal').hidden && g++ < 20) G.closeModal(); };", "const closeAll = () => {};   /* audit: the player handles every window */")
rep("const act = (s) => {", "const act = (s) => { if (s.startsWith('go:')) { G.S.loc = s.slice(3); return; }   /* audit: the bot's farm hops don't move the player's screen */\n")
i = src.index("  function decide() {"); j = src.index("\n", i)
src = src[:i] + """  function decide() {   /* audit: the player answers windows and follows walks and lessons; between lessons the bot only picks and runs the mill */
    const S0 = G.S, gi = G.GUIDE[S0.guide], busy = !document.getElementById('modal').hidden || !document.getElementById('pcer').hidden || S0.nav || S0.pwalk;
    if (!window.__allowBot && (busy || (gi && !(gi.when && !gi.when())))) return;
    if (gi && !window.__allowBot) { tap(); mill(); return; }
    G.checkTabs(); tap(); active(); mill(); estate(); roast(); knowhow(); coins(); cycleEnd(); }
  B.decide = decide; B.knowhow = knowhow;""" + src[j:]
open(os.path.join(HERE, 'policy_audit.js'), 'w').write(src)
print('policy_audit.js written')
