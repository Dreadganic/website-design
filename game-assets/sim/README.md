# Beju Farm playtest bot

Plays the real game code headless at roughly 700x speed with a fake clock, to measure pacing.

```
python3 game-assets/play/build.py /tmp/beju-farm.html
python3 game-assets/sim/mk.py /tmp/beju-farm.html game-assets/sim/sim.html        # exposes game internals to the bot
python3 game-assets/sim/mkvar.py game-assets/sim/sim.html game-assets/sim/v.html hire,realday,offline,build5,life8,geo118,mastery,research
node game-assets/sim/run.js active 5 a.json v.html 5    # mode (active|casual), target prestige, output, page, max building level
# SPEC=grow|mill|roast|trade|wander|off picks the focus the bot takes at each prestige from 3 (default: Grower, or keeps its last)
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

The design audit of 6 November 2026 ("Beju Farm: design audit and roadmap") ranked its fixes; `review_e2e.js` checks the first round in the game: a regular's request no longer raises the income rate it's priced from, a stopped event brings only the five event companions (the island ones come from their islands), long notices split into short pieces that fit the top bar, the top bar's pills show short numbers with the full one read out, the welcome-back card shows coins and know-how earned and a cleared fourth field picks while you're away, and the contract cards keep their height on a 320 x 568 phone. Round two adds: Settings lead with the player's own options and link the privacy page, an island's sheet is named for the place, affordability dots only before the first prestige, a new coffee planted from its unlock window, the night shift (12 hours away mills more than one) and a boat order that no longer holds every rack. Round three adds: a phone set a day ahead and back gets one check-in, not two (the game's clock only moves forward), Galápagos's weekly survey once the guide is full, and Bourbon Pointu counting in the cupping notebook. Round five: a coffee picks ×1.3 cherries on its home farm and ×0.85 elsewhere (yours, pickers' and away), in place of +15% on the whole farm for one native field, so each farm has its own best coffee; the replant window marks it, and farms made before the change get one card about it. The bot's `replant()` plants each farm's best coffee. Measured with `run.js casual 5`: prestige 5 at 3.0 to 3.2 hours of play (6.3 to 6.6 days) against 3.4 to 3.7 (7.0 to 7.6) before; ×1.5 with nothing taken away elsewhere was 2.8 (5.6). Toba's Catimor now sells ×1.35 (its `price`; its quality, cup and roast are unchanged), so it is Toba's best coffee and no other farm's; ×1.4 brought the casual bot's prestige 5 to 5.6 to 6.0 days, ×1.35 keeps it at 6.3. Réunion's seedling trays are in `reunion_e2e.js`; the server's save history, malformed-save check, co-op estimate cap and welcome window are in `npm test`.

```
node game-assets/sim/review_e2e.js /tmp/test.html   # 31 checks
node game-assets/sim/spec_e2e.js /tmp/test.html     # specialties: the focus per run from prestige 3 (bonuses, goals, titles, prestige window)
```

## The new HUD

The HUD design ("Beju Farm: HUD design") keeps on the farm only what you'd play worse without: the place, the arrows and coins. Hearts show while you pick by hand or run low, the level pill near a level or just after one, the cherry store from 80% full (with the word FULL, not just a colour); the clock, cranes and weather chip leave the farm and sound moves into Settings under one gear. Any time, a tap on the coins opens the purse for 6 seconds (hearts, level and know-how, cherries, cranes), and a tap on any number in it goes where it's spent; Unlock and Ranks show the level pill, and the Shop the cranes, while they're open. A one-time notice after the lessons says so. Notices and the windows the game used to open by itself (a contract or season ending, a reward, a delivery, an order linked, the day's calendar, the Shop's waiting rewards) come as one card at a time at the bottom of the map, just above the tabs or an open sheet, and open on a tap; only something opening for the first time, prestige and the welcome back still open a window by themselves. Settings › Screen switches back to Classic, Text size goes to 125% or 150%, and Always show keeps the level bar or store up. `hud_e2e.js` checks it against the doc's acceptance criteria: no page scrolling at 320, 360 and 390 px wide; at most 12% of a 390 x 844 screen covered on a quiet farm (Classic covers about 20%); 44 px to tap (tabs are 38 px wide when all eight show on a 360 px phone, since the tab bar is unchanged); HUD text at least 11 px (10 on tabs) and 4.5:1 contrast; nothing moving with reduced motion; ten identical notices showing once and quick picks adding up in one float; a crack never waiting behind notices; the moment card (queued, opened, put away, above the tabs or an open sheet, Classic's windows as before, the day's calendar as a card); and a phone held sideways asked to turn upright.

```
node game-assets/sim/hud_e2e.js /tmp/test.html [shots]   # 53 checks
```

## Specialties

From prestige 3 each run has a focus, picked in the prestige window and changeable once a run (Ranks › Prestige). Each changes how one loop plays instead of adding a percentage, pays something while you're away, and has a trade-off:

- Grower (plan): a companion planting per field in Farm › Fields. Banana shade: that coffee cups up to +2 (by the share of its fields shaded) but picks 20% less. Legumes: bushes regrow 35% faster (bare fields start with them). Wildflowers: each brings golden bushes 10% sooner, to 40%. Goal: 3 lots of shaded coffee at 90+.
- Miller (experiment): sealed tanks in the Mill, 1 to 3 shifts (starts at 1; the foreman uses it). +15% drying time a shift; the cup moves +1.2 a shift on average, give or take 1.3 a shift; each point pays +10%; a sour batch (d < -1.5 × shifts, 2 to 3 in 100) pays half. A tank book keeps the best cup per coffee. Goal: a sealed lot at 92+.
- Roaster (time): a perfect crack starts development instead of ending the roast; Drop in the window of the profile you set (light 0-30%, medium 30-60%, dark 60-85%) for +20 quality; past second crack it scorches (the crack's +15 is lost, sold dark). Uncracked roasts and the head roaster's finish as before. Goal: 20 drops in the window.
- Trader (negotiate): new contracts draw 2 or 3 bidders, +10% an hour to +25% or +40%, paid per delivery at the bid of the moment; after 2 to 5 hours the bidding closes and the contract leaves. A future is +40% fixed with 12 hours to fill; a missed one stops new contracts for 6 hours. Goal: 10 contracts completed at +20% or better.
- Wanderer (roam): no ×0.85 away from home (×1.3 stays home only), and no farm goes dormant. Goal: harvest each farm's best coffee on another farm.

A goal gives the title and a star, up to five. `spec_e2e.js` checks all of it. Measured with `SPEC=... run.js casual 5` (one run each, about ±0.3 h noise; the bot uses the defaults, drops roasts in the window and delivers contracts at once): prestige 5 at 3.2 h with no focus, Grower 3.0, Miller 3.0, Trader 3.0, Wanderer 3.3, Roaster 3.3.
