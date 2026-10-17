"""Make a sim build with design changes switched on. Usage: mkvar.py in.html out.html flag[,flag...]"""
import sys
t = open(sys.argv[1]).read(); flags = sys.argv[3].split(",") if len(sys.argv) > 3 and sys.argv[3] else []
def rep(a, b):
    global t
    assert t.count(a) == 1, (t.count(a), a[:70]); t = t.replace(a, b)
for fl in flags:
    if fl == "hire":   # hiring is priced per farm, so a new farm can be staffed
        rep("const hireCost = () => Math.round(150 * Math.pow(1.5, Math.max(0, totalWorkers() - 2)) / 10) * 10;",
            "const hireCost = (f) => { f = f || S.farms[S.loc]; return Math.round(150 * farmMult(f.loc) * Math.pow(1.45, Math.max(0, f.workers.length - 2)) / 10) * 10; };")
    elif fl == "realday":   # daily tasks and the weekly order follow real days, not 10-minute game days
        rep("if (S.minutes >= 1440) { S.minutes -= 1440; S.day += 1; newTasks(); toast('Day ' + S.day + ': new daily tasks'); }",
            "if (S.minutes >= 1440) { S.minutes -= 1440; S.day += 1; }\n  if (S.taskDay !== dayKey(new Date())) { S.taskDay = dayKey(new Date()); newTasks(); }")
        rep("if (S.day - S.weekly.start >= 7) { S.weekly = { mine: 0, team: 1500, target: 4000, start: S.day, claimed: false };",
            "const rday = Math.floor(Date.now() / 864e5); if (!(S.weekly.start > 1000)) S.weekly.start = rday;\n  if (rday - S.weekly.start >= 7) { S.weekly = { mine: 0, team: 1500, target: 4000, start: rday, claimed: false };")
        rep("S.weekly.team += d * 0.6;", "S.weekly.team += d * 0.01;")
    elif fl == "offline":   # the foreman keeps the mill running while you are away
        rep("  S.lots.forEach((l) => { l.left = 0; });\n  const coinsEarned = 0;",
            "  S.lots.forEach((l) => { l.left = 0; });\n  if (S.staff.foreman) for (let i = 0; i < Math.min(60, Math.floor(hours * 40)); i++) { staffTick(); S.lots.forEach((l) => { l.left = 0; }); }\n  const coinsEarned = 0;")
    elif fl.startswith("life"):   # life8 = 10, 18, 26 ... levels by lifetime prestige
        k = int(fl[4:])
        rep("const prestigeNeed = () => Math.min(20, PRESTIGE_LEVEL + 2 * S.season.prestige);",
            "const prestigeNeed = () => PRESTIGE_LEVEL + %d * S.prestige;" % k)
    elif fl.startswith("need"):   # need3 = 10, 13, 16 ... levels per prestige in a season
        k = int(fl[4:]); cap = 10 + 5 * k
        rep("const prestigeNeed = () => Math.min(20, PRESTIGE_LEVEL + 2 * S.season.prestige);",
            "const prestigeNeed = () => Math.min(%d, PRESTIGE_LEVEL + %d * S.season.prestige);" % (cap, k))
    elif fl.startswith("xp"):   # steeper level curve: xp26 = 100*(l-1)^2.6
        e = int(fl[2:]) / 10
        rep("const XP_AT = (l) => Math.round(100 * Math.pow(l - 1, 2.4));", "const XP_AT = (l) => Math.round(100 * Math.pow(l - 1, %s));" % e)
    elif fl == "build5":   # buildings go to level 5
        rep("if (n < 3 && spend('coins', buildCost(S.loc, v)))", "if (n < 5 && spend('coins', buildCost(S.loc, v)))")
    elif fl.startswith("geo"):   # geo12: past level 10 each level needs 1.2x the last
        g = int(fl[3:]) / (100 if len(fl[3:]) == 3 else 10)
        rep("const XP_AT = (l) => Math.round(100 * Math.pow(l - 1, 2.4));", "const XP_AT = (l) => l <= 10 ? Math.round(100 * Math.pow(l - 1, 2.4)) : Math.round(100 * Math.pow(9, 2.4) * Math.pow(%s, l - 10));" % g)
    elif fl == "mastery":   # endless per-farm upgrade: +10% picking per level, cost x1.6
        rep("pm = pickerMult() * (f.manager ? 1.25 : 1),", "pm = pickerMult() * (f.manager ? 1.25 : 1) * (1 + 0.1 * (f.mastery || 0)),")
        rep("  else if (a === 'mgr')", "  else if (a === 'master') { const n = f.mastery || 0; if (f.manager && spend('coins', masterCost(S.loc))) f.mastery = n + 1; }\n  else if (a === 'mgr')")
        rep("const FOREMAN_COST = 6000, AGENT_COST = 15000;", "const FOREMAN_COST = 6000, AGENT_COST = 15000;\nconst masterCost = (loc) => Math.round(20000 * farmMult(loc) * Math.pow(1.45, S.farms[loc].mastery || 0) / 10) * 10;")
        rep("W, H, checkTabs, contractSlots };", "W, H, checkTabs, contractSlots, masterCost };")
    elif fl == "research":   # endless know-how sink: +0.3 cup score per level, cost x1.5
        rep("+ S.bonus * 10 + shadeCup()); };", "+ S.bonus * 10 + shadeCup() + 0.3 * (S.research || 0)); };")
        rep("  else if (a === 'mgr')", "  else if (a === 'research') { if (spend('points', researchCost())) S.research = (S.research || 0) + 1; }\n  else if (a === 'mgr')")
        rep("const FOREMAN_COST = 6000, AGENT_COST = 15000;", "const FOREMAN_COST = 6000, AGENT_COST = 15000;\nconst researchCost = () => Math.round(3000 * Math.pow(1.4, S.research || 0) / 10) * 10;")
        rep("W, H, checkTabs, contractSlots", "W, H, checkTabs, contractSlots, researchCost")
    else: raise SystemExit("unknown flag " + fl)
open(sys.argv[2], "w").write(t)
