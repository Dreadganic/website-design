import sys, subprocess
subprocess.run(['python3', __import__('os').path.join(__import__('os').path.dirname(__file__), 'mk.py'), sys.argv[1], sys.argv[2]], check=True)
t = open(sys.argv[2]).read()
inj = """window.__UI = { renderGuide: () => renderGuide(), NAV: typeof NAV === 'object' ? NAV : [], wrap: (onModal, onToast) => { const sm = showModal, tt = toast; showModal = function (h, r) { onModal(h); return sm(h, r); }; toast = function (m) { onToast(m); return tt(m); }; } };
window.__G = {"""
assert t.count("window.__G = {") == 1
t = t.replace("window.__G = {", inj, 1)
open(sys.argv[2], 'w').write(t)
