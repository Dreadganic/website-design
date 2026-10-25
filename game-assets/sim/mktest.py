"""A test page: the built game with its internals on window.__T, for ui_sweep.js and online_e2e.js.
Usage: python3 game-assets/sim/mktest.py <built.html> <test.html>"""
import sys
t=open(sys.argv[1]).read()
hook="window.__T = { toast, roastGuest, tickRoast, get IN() { return IN; }, get S() { return S; }, setTab, renderPanel, closeModal, GUIDE, holdCeremony, feedKoi, hintAt, bestLot, harvestSync, coopSync, coeFetch, coeStep, coopAct, get NET() { return NET; }, checkFarmMilestones, farmLevel, checkTabs, NAV, navTick, hasPerk, gateOK, agentOK, mgrOK, weekOn, sackKg, away, level, XP_AT, levelUp, earn, unlockReq, choreHere: () => choreHere(), startLot, saleFor, crackSecs, roasterCount, racks, est, boatTick, ageLot, unageLot, estateCard, bagPrice, newTasks, newWeek, task, guideStep, checkTabs, prestigeNeed, headRoasterTick, emTick, rakePatio, emCan: (l) => emCan(l), lotCup2: (l) => lotCup(l), roasteryTick, away, crackSecs2: (k) => crackSecs(k), cupFor, lotCup, sellLot, deliver, toRoastery, buyerKeys, showModal, showVisit, staffTick, cap: () => cap(), stored: () => stored(), myTrophies, achTick, fxOn, mktNow, farmSnapshot, applyGrant, needsName, revGrow, revStorm, tyDone, crackRoast, revStart, revEnd, revClick, revTick, revGo, revIsHere, revBagMult, revBlocked, revNoDry, revCovered, revPage, REVS, REV_COSM, get revH() { return revH; }, get revChips() { return revChips; }, get revSess() { return revSess; }, set revSess(v) { revSess = v; }, set revSessEv(v) { revSessEv = v; }, get scene() { return scene(); }, rackSlots, rackAt, act: (s) => { const b = document.createElement('button'); b.dataset.act = s; document.body.appendChild(b); b.click(); b.remove(); } };\n"
a="requestAnimationFrame(loop);\nif (needsName()) askName();"
assert t.count(a)==1
t=t.replace(a,hook+a)
if '<meta charset' not in t: t=t.replace('<head>','<head><meta charset="utf-8">',1)
open(sys.argv[2],'w').write(t); print('test ok')
