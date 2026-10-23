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
