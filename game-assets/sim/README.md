# Beju Farm playtest bot

Plays the real game code headless at roughly 700x speed with a fake clock, to measure pacing.

```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mk.py /tmp/beju-farm.html game-assets/sim/sim.html        # exposes game internals to the bot
python3 game-assets/sim/mkvar.py game-assets/sim/sim.html game-assets/sim/v.html hire,realday,offline,build5,life8,geo118,mastery,research
node game-assets/sim/run.js active 5 a.json v.html 5    # mode (active|casual), target prestige, output, page, max building level
node game-assets/sim/cmp.js a.json                       # one-line summary; rep.js gives a detailed timeline
```

`casual` plays three 10-minute sessions a day with the away screen in between. Flags in `mkvar.py` switch on the design changes tested in `game-assets/review/prestige-playtest.html`. Generated `.html` and `.json` files are not committed.

## Tutorial and pop-up audit (`audit/`)
Plays a fresh save to prestige 3 the way a new player would, through the real interface: Rosa's lessons, every unlock walk and the prestige walk are done by tapping what the arrow points at, and every window is answered with its main button. It flags arrows that are hidden, off target, covered or off screen, taps that don't lead closer, and steps that stall, with a screenshot of each. `summarize.js` prints the order of every lesson, walk and window, and where each button took the player.
```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mk.py /tmp/beju-farm.html /tmp/sim.html
python3 game-assets/sim/audit/mk_audit.py /tmp/sim.html /tmp/audit.html
python3 game-assets/sim/audit/mk_policy.py
node game-assets/sim/audit/audit.js /tmp/audit.html /tmp/audit/log.json 20 40   # game speed ×20, at most 40 minutes
node game-assets/sim/audit/summarize.js /tmp/audit/log.json
```

## Interface sweep and online end-to-end test
```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mktest.py /tmp/beju-farm.html /tmp/test.html          # the game with its internals on window.__T
node game-assets/sim/ui_sweep.js /tmp/test.html fresh /tmp/sweep fresh       # or a run.js output instead of "fresh"; then [width] [height] [prep js]
node game-assets/sim/online_e2e.js /tmp/test.html /tmp/online                 # the real functions behind a local server, two browser devices
node game-assets/sim/names_e2e.js /tmp/test.html /tmp/names                   # the name window, unique names, renames and the offline copy (24 checks)
node game-assets/sim/notes_e2e.js /tmp/t_fn.html /tmp/notes                   # co-op order size and Claim, every Claim button, the request rack, the Shop lock, the farm bar, farms and the menu (needs API '/fn/', as for community_e2e.js)
node game-assets/sim/events_e2e.js /tmp/test.html /tmp/events                 # random events: when they start, harm, real taps, keepsakes, letting go, reload mid-event, catching up, sound (40 checks)
node game-assets/sim/events2_e2e.js /tmp/test.html /tmp/events2                # the other seven events, the companion train and keepsakes (40 checks)
node game-assets/sim/events_layout.js /tmp/test.html /tmp/evlayout              # every spot an event can use, on six phone sizes, clear of the interface once it's brought into view
```
`ui_sweep.js` opens every tab and sub-page, saves a screenshot of each and lists sideways scrolling, clipped buttons, broken images and "undefined"/"NaN" text (it should report 0 issues and 0 errors). `online_e2e.js` prints PASS or FAIL for: going online, saving, moving a farm with a code and with the recovery code, a used code, the newer-save choice (nothing overwritten while it's open), name checks and a reset restarting the leaderboard row.

## Blue Mountain (prestige 5)
```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mktest.py /tmp/beju-farm.html /tmp/test.html
node game-assets/sim/bluemtn_e2e.js /tmp/test.html /tmp/bm        # opening, the ripe pool and time away, clearings, clean and blind picks, resting, grading, every certification, shipping, the Counter, imports, saving (64 checks)
node game-assets/sim/bluemtn_layout.js /tmp/test.html /tmp/bmlay  # every terrace, bay, the grading table and the barrels, clear of the interface on six phone sizes
node game-assets/sim/bluemtn_pace.js /tmp/test.html 28            # 28 days of visits on four schedules: certification by day, seconds a visit, value next to twice a day
```
The design, the research behind the numbers and the measured pacing are in `game-assets/review/blue-mountain.html`. Test tools in Settings › Test tools open the island early, ripen the terraces, rest the batches and add a certification.
