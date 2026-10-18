import sys
t = open(sys.argv[1]).read()
hook = "window.__G = { get S() { return S; }, set S(v) { S = v; }, gateOK: typeof gateOK === 'function' ? gateOK : null, isNative: typeof isNative === 'function' ? isNative : null, buildMax: typeof buildMax === 'function' ? buildMax : null, tick, renderPanel, closeModal, level, prestigeNeed, away, cap, stored, racks, hireCost, maxPickers, UP, METHODS, VAR, VAR_ORDER, FARM_COST, canOpen, buildCost, BUILD_ORDER, MANAGER_COST, FOREMAN_COST, AGENT_COST, DECOR, fits, saleFor, totalWorkers, XP_AT, LOCS, modalQueue, checkIn, newTasks, W, H, checkTabs, contractSlots, masterCost, researchCost, get golden() { return golden; } };\nif (!window.__SIM) requestAnimationFrame(loop);"
i = t.rindex("requestAnimationFrame(loop);")
t = t[:i] + hook + t[i + len("requestAnimationFrame(loop);"):]
open(sys.argv[2], "w").write(t)
