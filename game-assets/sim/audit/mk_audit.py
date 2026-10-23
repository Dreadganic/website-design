import sys
t = open(sys.argv[1]).read()
hook = ("window.__A = { get S() { return S; }, GUIDE, PWALK, NAV, navTarget, navCur, level, prestigeNeed, scene, modalQueue, cv, W, H, renderGuide, setTab, "
        "get tab() { return tab; }, get sheetOpen() { return sheetOpen; }, get sheetFull() { return sheetFull; }, rackPt };\n")
a = "window.__G = {"
assert t.count(a) == 1
t = t.replace(a, hook + a)
open(sys.argv[2], 'w').write(t)
print('ok')
