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
node game-assets/sim/save_gate_e2e.js /tmp/test.html                           # an idle open tab uploads its save every 30 minutes, any tap or key makes the next one go (8 checks)
node game-assets/sim/returning_e2e.js /tmp/test.html /tmp/returning          # a save closed 2 minutes, 8 hours and 3 days ago starts a running farm, welcome-back card, every tab (17 checks; every other suite loads a save written that moment)
node game-assets/sim/notes_e2e.js /tmp/t_fn.html /tmp/notes                   # co-op order size and Claim, every Claim button, the request rack, the Shop lock, the farm bar, farms and the menu (needs API '/fn/', as for community_e2e.js)
node game-assets/sim/realbag_e2e.js /tmp/test.html /tmp/realbag              # real-bag cards on unlocks: copy, link, once a save, beacon, hidden before launch (15 checks; makes an orders-live copy)
node game-assets/sim/events_e2e.js /tmp/test.html /tmp/events                 # random events: when they start, harm, real taps, keepsakes, letting go, reload mid-event, catching up, sound (40 checks)
node game-assets/sim/events2_e2e.js /tmp/test.html /tmp/events2                # the other seven events, the companion train and keepsakes (40 checks)
node game-assets/sim/events_layout.js /tmp/test.html /tmp/evlayout              # every spot an event can use, on six phone sizes, clear of the interface once it's brought into view
node game-assets/sim/currency_audit.js /tmp/test.html                         # one currency a screen: every price on all 26 screens of a prestige 6 farm, shells only on Kona (exits 1 on a new mix; see review/currency-pass.html)
```
`ui_sweep.js` opens every tab and sub-page, saves a screenshot of each and lists sideways scrolling, clipped buttons, broken images and "undefined"/"NaN" text (it should report 0 issues and 0 errors). `online_e2e.js` prints PASS or FAIL for: going online, saving, moving a farm with a code and with the recovery code, a used code, the newer-save choice (nothing overwritten while it's open), name checks and a reset restarting the leaderboard row.

## Blue Mountain (prestige 5)
```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mktest.py /tmp/beju-farm.html /tmp/test.html
node game-assets/sim/bluemtn_e2e.js /tmp/test.html /tmp/bm        # opening, the ripe pool and time away, clearings, clean and blind picks, resting, grading, every certification, shipping, the Counter, imports, saving, and coming back to the island after 2 minutes, 8 hours and 3 days (82 checks)
node game-assets/sim/bluemtn_layout.js /tmp/test.html /tmp/bmlay  # every terrace, bay, the grading table and the barrels, clear of the interface on six phone sizes
node game-assets/sim/bluemtn_pace.js /tmp/test.html 28            # 28 days of visits on four schedules: certification by day, seconds a visit, value next to twice a day
```
The design, the research behind the numbers and the measured pacing are in `game-assets/review/blue-mountain.html`.

## The Island Route (prestige 5): the harbour, cowries, the board and voyages
```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mktest.py /tmp/beju-farm.html /tmp/test.html
node game-assets/sim/islands_e2e.js /tmp/test.html /tmp/isl        # the harbour opening, Captain Ama, the ledger's 56 finds and their hooks, every board project, voyages (bags, hours, the lighthouse, the second hold, bins or the shed), the bottle, Miss Pearl, Uncle Kimo, the island shelf, old saves (shells into cowries), a reload (78 checks)
node game-assets/sim/islands_layout.js /tmp/test.html /tmp/isllay  # every harbour spot, Miss Pearl, Uncle Kimo, Réunion's nursery, Bali's co-op and the Galápagos camp, clear of the interface on six phone sizes
node game-assets/sim/kona_pace.js /tmp/test.html 6                 # Kona in real time: what the co-op boat pays a minute, the island level, tools and cowries
node game-assets/sim/nav_e2e.js /tmp/test.html /tmp/nav             # getting around: "Where to?" from the place name, one-tap travel, the dot when another place needs you, swiping the map (13 checks)
node game-assets/sim/reunion_e2e.js /tmp/test.html /tmp/re           # Réunion's nursery: opening from the board, shifts (plant, mist, wilt, fruit, pick, the can), pausing, the score and its pay, the shed's seedling trays (one every 30 minutes, three banked), levels, Bourbon Pointu at home, the tuit-tuit, a reload (49 checks)
node game-assets/sim/bali_e2e.js /tmp/test.html /tmp/ba              # Bali's monsoon: opening from the board, the barometer, a storm (pick, spread, turn, bag, the barn), gusts and the rope, leaks, pausing, the break, the score and the co-op pool's draws and guarantees, being rained off, levels and the fifth roastery bin, a reload, and a bot that plays whole storms by the arrow at three tap speeds (77 checks)
node game-assets/sim/galapagos_e2e.js /tmp/test.html /tmp/ga         # Galápagos: opening from the board, camera traps, photos and finds, the very rare guarantee, shade trees at home, field notes, tortoise trails (clues, signs, going cold, the hint, the young tortoise), the five pages and what each gives back, the patio, levels, photo postcards, a reload, and a simulation of how long the guide takes to fill, over 400 players (65 checks)
```
The design is the "Island chain" tab of the next-features doc. Test tools in Settings › Test tools › The harbour open it early, add cowries, bring the boat home and wash up a bottle. Test tools in Settings › Test tools open the island early, ripen the terraces, rest the batches and add a certification.

## Room for more screens, the collection log and the music log

The bottom bar holds eight tabs and a ninth would wrap to a second row on every phone, so new screens go in as sub-tabs. `nav_capacity.js` checks, on 320, 360 and 390 px wide phones with everything open, that the bar and every row of sub-tabs (each tab's and each island page's, at their fullest) sit on one row with no clipped label, and prints which rows still have room for one more. Run it after adding a sub-tab.

```
node game-assets/sim/nav_capacity.js /tmp/test.html [shots]   # the bottom bar and every sub-tab row on three phone widths, and the headroom left (85 checks)
node game-assets/sim/journal_e2e.js /tmp/test.html            # Looks › Collection and Music, the jukebox and quiet stretches, every song reachable, the calendar that never resets, What's new, the odds where you find things, two-button rows on a small phone (41 checks)
```

## The cast

Everyone you meet is drawn as themselves (`game-assets/npcs/sprites.py`). `npc_e2e.js` checks their art (every frame and mood, no two alike), the islanders' life on their maps (a greeting by the time of day, a tap that stops them and opens a card with their portrait, strolling to their spots and home, keeping to their post while busy and at night, chat, and speaking up when a storm starts, tracks appear, a boat comes home or the mountain blows), the estate managers, the roastery's staff and buyers, the foreman, Rosa's portrait cards and the pixel font's ligatures. `islands_layout.js` also checks every islander's strolling spots stay clear of the interface.

```
node game-assets/sim/npc_e2e.js /tmp/test.html [shots]   # the cast: art, life on the maps, cards, cues (51 checks)
```


## The audit's first round of fixes

The design audit of 6 November 2026 ("Beju Farm: design audit and roadmap") ranked its fixes; `review_e2e.js` checks the first round in the game: a regular's request no longer raises the income rate it's priced from, a stopped event brings only the five event companions (the island ones come from their islands), long notices split into short pieces that fit the top bar, the top bar's pills show short numbers with the full one read out, the welcome-back card shows coins and know-how earned and a cleared fourth field picks while you're away, and the contract cards keep their height on a 320 x 568 phone. Réunion's seedling trays are in `reunion_e2e.js`; the server's save history, malformed-save check, co-op estimate cap and welcome window are in `npm test`.

```
node game-assets/sim/review_e2e.js /tmp/test.html   # 14 checks
```
