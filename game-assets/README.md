# Beju Farm art

Cozy modern pixel art for the Beju Farm game: warm olive greens, ochre earth, fluffy shaded trees (cherry blossom, maple), a thatched farmhouse seen from above, raised wooden beds, a hedgerow over a staked dirt bank, and a shiba who potters around. Drawn for Beju and owned by Beju Coffee Roasters.

| File | What it is |
| --- | --- |
| `bg/<location>-<season>.png` | 14 painted farm scenes (192 x 240, shown at 2x). The fields sit in the same place in every scene. |
| `sprites.json` | Moving pieces as palette grids: 9 coffee varieties x 5 growth stages, workers (8 shirt colours), the shiba, props; plus shrub positions and the location, season and variety tables the game reads. |
| `scenes.png` | Every scene side by side, with each location's own varieties growing. |
| `varieties.png` | Every variety from sprout to ripe cherries. |
| `sheet.png`, `sheet@4x.png` | Workers, the shiba and props. |
| `bg-assets.json` | Where each scene is uploaded on the design canvas. |
| `GameFarm.template.html` | The farm screen; `inject.py` fills in the sprites and scene urls. |

## Locations and seasons

| Location | Scene | Varieties | Seasons |
| --- | --- | --- | --- |
| Huila, Colombia | finca with a clay-tile roof, covered drying tunnel, banana shade plants | Pink Bourbon, Caturra, Castillo | harvest (Mar to May, Oct to Nov), rainy |
| Mogiana, Brazil | fazenda, concrete drying patio, red earth, yellow ipê trees, palms | Yellow Bourbon, Mundo Novo, Yellow Catuaí | harvest (May to Aug), rainy |
| Gedeo, Ethiopia | round thatched tukul, raised African beds, enset, acacia | Ethiopian heirloom | harvest (Oct to Jan), rainy |
| Lake Toba, Sumatra | Batak house on stilts, lake shore and jetty, palms | Catimor | harvest (Oct to Feb), rainy |
| Turrialba, Costa Rica | painted wooden house with a tin roof, wet mill, poró trees | Caturra, Yellow Catuaí, Geisha | harvest (Oct to Mar), rainy |
| Osaka roastery garden | thatched farmhouse, koi pond, stone lantern | Geisha, Pink Bourbon, Yellow Bourbon | spring, summer, autumn, winter |

Harvest months come from the lots on bejucoffee.com. In the rainy season the drying beds are empty or under tarps, puddles form, and the shrubs flower.

## Ripe cherry colours

Caturra red, Castillo deep red, Pink Bourbon pink, Yellow Bourbon yellow, Mundo Novo burgundy, Yellow Catuaí golden, Catimor bright red (compact dwarf bush), Ethiopian heirloom small and dark crimson (darker, looser bush), Geisha long and wine red (tall, slender bush with bronze tips).

## Editing

Everything is drawn in code, so a change is one edit and one run:

```
python3 game-assets/build_sprites.py
python3 game-assets/inject.py <output.dc.html>
```

## Free packs worth knowing about

If the game later needs more general art, these CC0 packs can be used commercially with no credit required: Kenney Tiny Farm, Kenney 1-Bit Pack, and Ninja Adventure by Pixel-boy and AAA. Avoid the free version of Sprout Lands, which is licensed for non-commercial use only.

## Playable build (`play/`)

`python3 play/build.py <out.html>` inlines `sprites.json` and the scene PNGs into `play/template.html`, giving one self-contained page. It saves to localStorage (`beju-farm-save-v3`). Every field starts as Caturra; varieties unlock in order with points (Catimor 150, Catuaí 400, Castillo 1,000, Mundo Novo 2,500, Yellow Bourbon 6,000, Pink Bourbon 14,000, Heirloom 30,000, Geisha 60,000 or free with Osaka), each with its own yield, growth speed, price and perk. Varieties native to a farm grow 20% faster there. You start in Mogiana, Brazil; points open Huila (800), Gedeo (5,000), Toba (20,000) and Turrialba (60,000) in that order; the Osaka garden costs 60 cranes and has no points price.

New art used by it (all in `sprites.json`):
- `storage_1..5`: basket → basket stack → crate pile → storage shed → Beju barn (100 / 250 / 500 / 1,200 / 3,000 kg)
- `carry_backbasket`, `carry_wheelbarrow`: picker carrying gear (9 / 15 / 30 kg per trip)
- `bed_open`: cleared fourth field
- `proc_<method>`: processing pictures for the mill
- `green_sack`, `i_*` icons, `stamp_<loc>` passport stamps

Pacing: costs start cheap and climb steeply (pickers ×1.5 each from 150 coins, picker speed ×2.1 per level up to 10, levels need 100·(level−1)^2.4 XP). A scripted test player reached level 10 (new harvest year) after about 50 minutes at normal speed.

### Mid game
- **Contracts board** (Orders tab): 3 buyer requests (4 with the contracts agent) for a set amount of green coffee, optionally a variety and process, with a minimum cup score. They pay about 2× the roastery price. Deliver ready lots from the Mill. Some requests come from Beju itself, named after real products.
- **Buildings** (Upgrade → Build): six lots per farm along the fence, three levels each, paid in coins (base × 3^level × farm multiplier). Picker housing (+2 picker places a level), wet mill (faster washed drying), raised drying beds (+1 rack), compost shed (+10% growth), shade trees (+0.4 cup), sorting table (peaberry lots at double value). Sprites: `build_<key>`.
- **Staff** (Upgrade → Staff): farm manager per farm (+25% picker speed, +50% away earnings, walks the farm), mill foreman (starts and sells lots automatically, with a process rule), contracts agent (delivers to matching contracts, steers the foreman, +1 contract slot).
- **Decor** (Shop → Decor): bandana, bench, planter, lanterns (glow at night), Beju flag, bunting and coffee cart, bought once with coins and shown on every farm. Sprites: `deco_<key>`.

## Sound
- `audio/music.js`: the music engine and every farm theme (four-channel chiptune, day and night arrangements). `Music.init(SFX.context())`, `Music.play(farmId)` (crossfades), `Music.setNight()`, `Music.setVolume()`, `Music.setEnabled()`, `Music.duck()`, `Music.pause()/resume()`.
- `audio/cozy.js`: the cozy, Minecraft-style versions the game now plays (felt piano, pads, plucked strings, long reverb). Reads the songs from `music.js`, same controls (`Cozy.play(farmId)` and so on).
- `audio/theme.html`: the chiptune jukebox; publish it with `sfx.js` and `music.js` alongside.
- `audio/cozy.html`: the cozy jukebox with a Cozy/Chiptune switch; publish it with `sfx.js`, `music.js` and `cozy.js`.
- `audio/sfx.js`: game sound effects, synthesised live with the Web Audio API (no files). Soft and natural with a small random pitch on every play. `SFX.play(name)`, `SFX.unlock()` inside the first tap (iPhone), `SFX.setEnabled()`, `SFX.setVolume()`. `play/build.py` inlines it into the game.
- `audio/soundboard.html`: plays every effect; publish it with `sfx.js` alongside.
- In the game: harvest, brush, knock (storage full), nope (no hearts), thud (picker drop-off), woof, dig (replant), pour/splash (start a lot), ding (lot dry), coins/xp (sales), click/tick (tabs), page/close (windows), buy, build, hire, stamp/contract, crane, achieve, levelup. A speaker button on the farm view turns them off.
- Music in the game: each farm plays its own theme, open or not, night versions from 7 pm to 6 am on the farm clock, a dip under big sound effects, pause when the page is hidden, a music button beside the sound button and a volume choice in the Test tab. `play/build.py` inlines `music.js` and `cozy.js`; the game plays the cozy versions.

## Prestige and leaderboard (Ranks tab)
- **Ranking:** prestige first, then level, then points (this run's XP). One more prestige always beats any level or points total, so banking points never helps.
- **Prestige** at level 10. Kept: coins, cranes, upgrades, buildings, staff, varieties, processes, decor, hats and looks. Lost: level, unspent points. Farms other than Mogiana and Osaka go dormant (no growth or picking) and reopen at level 3 (Huila), 5 (Gedeo), 7 (Toba) and 9 (Turrialba). Prestige gives no gameplay bonus (the old +10% "harvest year" perk is gone; old harvest years were converted to prestiges).
- **Tiers:** Seedling, Bronze Bean, Silver Leaf, Gold Cherry, Jade Highland, Sakura, Obsidian Ember, Golden Crane, then a star per extra prestige. Each prestige gives one reward, the tier's **crest**: a nameplate (CSS) and matching avatar border (animated from Gold up), put on automatically. Any crest reached can be worn again.
- **Outfits** are not tied to tiers: each prestige gives one outfit pick, and the player chooses any outfit they don't own yet (in the prestige window, or later in Ranks). Collections differ from player to player, so a leaderboard at the same prestige still looks varied. They are palette swaps of the worker sprite; four add an aura of leaves, petals, embers or gold. Outfits already owned stay owned.
- **Characters** (Shop › Characters, cranes): ten non-human farmers that replace the farmer's body while the outfit colours, crest and background still apply: Shiba (40), Capybara (40), Spectacled bear (50), Gelada (50), Orangutan (60), Sloth (60), Tanuki (80), Kitsune (100), Brew-bot (120) and Tsuru the crane (200). Drawn in `build_sprites.py` as `chr_<id>_<dir>_<frame>`: a generated head on the worker body, with tails on the side frames. Owned characters can also be switched in Ranks, and they show on the leaderboard.
- **Building styles** (Shop › Buildings, cranes): Fazenda (30), Bamboo (30), Kyoto (40), Snowfall (50) and Beju gold (80) redraw all six farm buildings in a themed palette (`build_<kind>_<style>`). Buy once, then use per farm or on every farm.
- **Backgrounds** (80 px squares cut from the farm scenes at load, drawn as images) sit behind the farmer in every avatar and come from the passport: each origin stamp unlocks that farm's scene, opening Osaka unlocks the garden, and all five origin stamps unlock the gold Beju backdrop. The test tab has a "Next passport stamp" button.
- The server stores a look as `{crest, skin, bg}`, caps the crest at the player's prestige tier (outfits are open once they have prestiged), and still reads old `{plate, border, skin}` looks.
- **Your farmer** walks the farm wearing your outfit, with a name tag in your tier's colour. Tap them to open Ranks.
- The other 30 players on the board are simulated until the app has a server.

## First session and daily loop (from the design review)
- **One rule for currencies:** coins build and hire (storage, pickers, racks, stamina, fields, buildings, staff, decor); know-how (the old "points") unlocks varieties, farms and processes; cranes buy boosts, hats and the Osaka garden. Level is reputation and is never spent.
- **Pickers** is one upgrade line (speed every level, back basket at 4, wheelbarrow at 8), replacing picker speed and carrying gear.
- **Hearts:** 30 to start (+6 a stamina level), refill every 2 s; the HUD shows ten hearts and the number.
- **Guided first harvest:** six goals (pick 5, open the Mill, process, sell, hire, build storage) with the target highlighted and a reward each; a new farm starts with a ripe bed so goal one works in any season. Skippable.
- **Progressive tabs:** Farm and Mill at first; Upgrade after the first sale, Shop at level 2, Orders at level 3, Ranks at level 5. Once shown they stay.
- **Daily brew check-in:** once per real day, a 7-day reward cycle and streak freezes (start with 1, earn 1 per completed week, hold up to 2).
- **Market board:** one process pays ×1.4 each farm day, shown in the Mill.
- Test tab: "Next real day" (check-in) and "Restart guide".
- Contracts stay off until the Orders tab opens (level 3); the board fills then. The guide's first lot dries at double speed.

## Seasons, drop events, bottlenecks, real coffee (review pass 2)
- **Monthly seasons:** a season board (prestiges this calendar month) and an all-time board in Ranks. Each prestige in a season needs two more levels (10, 12, 14 … 20); a new month resets the season count. Finishing a season with a prestige or in the top 10 earns a badge (Champion, Top 3, Top 10, Farmer) shown on your profile.
- **Drop events:** `DROPS` lists product launches. A drop runs 7 days: the featured variety is free to plant, lots of that variety or process sell ×1.5, and three Beju Roastery event contracts (no expiry, no skip) pay 2.5–3.5× and finish with a badge and 10 cranes. It opens with a phone-style notification; on the live app this comes from the server as a push.
- **Bottleneck hint:** the Farm tab names what's slowing the farm (storage full, racks busy, pickers waiting for cherries).
- **Real coffee** (Shop → Real coffee): how orders earn cranes and stamps, a link to bejucoffee.com, the passport, what each coffee gives, and free coffee earned.
- Test tab: "Start a drop event" and "End the season".

## The Mill is the decision screen
- Buyer contracts live at the top of the Mill (a swipeable strip, from level 3), not in a separate tab.
- Each process tile shows what the selected cherries would earn (`lotValue`: the best fitting contract plus any spare at roastery price, or the roastery price with market and drop bonuses), which buyer it fits, and a "Best pay" marker on the top choice.
- Variety chips are tagged "wanted" when a contract asks for them; drying lots that fit a contract say who they're for; the replant list says which buyers want each variety.
- The Orders tab is now **Daily**: check-in streak, daily tasks, weekly order and the prestige link.

## Online (backend)
The game talks to Netlify Functions (`netlify/functions/game-*.js`, storage in Netlify Blobs) only when it runs on bejucoffee.com, a Netlify preview or localhost. It then creates an anonymous account, keeps a cloud save (offering to load newer progress from another device), submits scores and shows the live leaderboard, links an order from `?claim=cs_…` (rewards counted by the server), and starts drop events from `netlify/lib/game-events.json`. Windows now queue instead of replacing each other. Build the site copy with `python3 game-assets/play/build.py beju-site/farm/index.html --site`. See SETUP.md section 4.

## Pacing rules (from the prestige playtest)
- **Hiring** is priced per farm: 150 × the farm's price multiplier × 1.45 for each picker past the second on that farm.
- **Daily tasks** reset each real day and the **weekly order** runs for a real week; the other farmers' share fills steadily over the week.
- **Away time:** with a mill foreman, lots keep drying and selling while you are away (storage still caps what the pickers bring in). The welcome-back screen shows what the mill earned.
- **Buildings** go to level 5. **Farm mastery** (Upgrades › Build, coins, needs the farm's manager) adds 10% picking per level, cost ×1.45 a level. **Cupping research** (Upgrades › Seeds, know-how) adds 0.3 cup score per level, cost ×1.4 a level.
- **Prestige** needs level 10, 18, 26, 34 ... by lifetime prestige, and each level past 10 needs 1.22× the XP of the last. The season board ranks know-how earned this month; the all-time board stays prestige first. The server mirrors these rules.
- Bot playtest: prestige 5 at 8.0 h for an active player (cupping lots, tapping golden bushes), 10.2 h without those, or 13.9 days of three 10-minute sessions a day (`game-assets/sim`, `run.js ... active`).

## Tabs and level ups
- Every tab shows from the first minute. Locked tabs are greyed with a lock and say what opens them (Upgrade: first sale, Shop: level 2, Daily: level 3, Ranks: level 5); tapping one explains.
- Each level up plays a horn fanfare (`SFX.play('fanfare')`), sets off fireworks over your farmer and opens a window with what the level unlocked (tabs, waking farms, prestige), its rewards and what comes next. Rewards: 50 × level^1.5 coins and a stamina refill; every 5th level adds 1 crane and 10 minutes of double growth. Several quick level ups share one window.
- Crane boosts now last the real 30 minutes they advertise (they ran on game minutes before, about 12 seconds).

## Tutorial and Ranks layout
- **Farm school:** Rosa, the farm's old hand, walks new players through 14 steps in five chapters: Harvest (pick, open the Mill), Mill (process, dry, sell), Grow (hire, storage, train pickers), Coffees (unlock Catimor, replant) and Buyers (reach level 3, deliver a contract, claim a daily task), ending with a visit to the Shop. Each step opens with a short explanation from Rosa, shows a bouncing arrow over what to tap (a ripe bush on the farm), and pays a small reward. Steps already done move on by themselves, › skips one step and Skip all ends it. Older saves map onto the new steps.
- **Ranks** has two sub-tabs: Leaderboard (season box, badges, the board and your name) and Prestige & looks (prestige, crests, outfits, characters, backgrounds), with a dot when a prestige or outfit pick is waiting.

## Prestige ceremony
Prestiging opens a full-screen moment timed to a new anthem (`SFX.play('prestige')`, about 6 seconds: a drum roll and cymbal swell, a full horn chord, a heroic climb and a big bVI-bVII-I finish with a harp run and bells; the music ducks underneath). On the chord hit the screen flashes, light rays start turning, the prestige number slams in, the new crest spins into place and the content shakes, while confetti bursts and rains. The tier name, your new nameplate and your climb on the all-time board follow, and the farm behind fires heavy fireworks. Continue leads to the outfit pick.

## Active play beats the staff
- **Cup by hand:** any drying lot, the foreman's included, can be cupped once from the Mill: +1.5 cup score (so it fits pickier contracts and earns more know-how) and +20% pay, on roastery sales and contract deliveries. Staff never cup.
- **Golden bushes:** while you play (from level 3 or after the tutorial), a golden bush glows on the farm every 3-6 minutes for 30 seconds. Tapping it pays about two minutes of your current income (a smoothed per-minute rate), at least 150 coins and 40 know-how. The Farm tab shows a dot while one is waiting. Rosa explains it the first time.
- Measured with the bot from the same saved farm over 20 minutes: active play earns 1.6-1.75x the coins and 1.45-1.65x the know-how of staff alone, early, mid and late game.

## Tabs (navigation)
Coins build, know-how unlocks, cranes buy looks, and the tabs follow that rule:
- **Farm** your farm, pickers and fields. **Mill** contracts, drying racks, cupping and starting lots (only the processes you own; a link leads to the rest).
- **Build** (coins): Farm (storage, pickers, racks, stamina, fourth field) · Buildings (six lots and farm mastery) · Staff (manager, foreman, contracts agent).
- **Unlock** (know-how): Coffees · Process · Farms · Research. A dot on the tab means something is affordable; the header reminds you know-how resets at prestige.
- **Daily** check-in, daily tasks and the weekly order only. **Ranks** Leaderboard · Prestige & looks.
- **Shop** (cranes): Boosts (boosts and the Osaka garden) · Farmer (characters and picker hats) · Farm style (building styles and decor) · Real coffee (orders, passport, free coffee earned).
- Labels fit down to 360 px phones (smaller type under 400 px and 370 px).

## Free coffee samples and cranes (rewards ladder)
- **Samples:** a welcome 100 g bag at Mogiana's first 1,000 kg, one per origin at prestige 2 (Huila), 3 (Gedeo), 4 (Lake Toba) and 5 (Turrialba), and one a month for checking in on 20 days. Each is redeemed with a bejucoffee.com order of ¥3,000 or more within 60 days, one per order. Online, the server's list (`game-samples`) is the real one and local samples it hasn't confirmed show as "Checking with the roastery". Shop › Real coffee lists them with status and expiry; the farm tab shows each farm's sample goal. Test tab: "Next free sample", "+20 check-in days".
- **Cranes from play** are kept low so real orders are the fast lane: the daily "sell 2 lots" task pays 1, the weekly team order 10, and check-in day 4 and day 7 pay 1 and 3. Paid subscription renewals pay cranes too (`game-grants`).
- The public-site changes for launch (footer link, thank-you button, checkout sample offer, un-hiding /farm/) live in `launch/`, not in `beju-site/`. See `launch/README.md`.

## Seasons (season stars, the track and monthly themes)
- **One season per calendar month, Japan time.** Each month has a theme from the Japanese calendar (`SEASON_THEMES` in `build_sprites.py`): Shōgatsu, Ume, Hina, Sakura, Koinobori, Tsuyu, Tanabata, Hanabi, Tsukimi, Aki matsuri, Momiji, Winter lights.
- **The farm never resets.** Only the season board, the track, the daily star caps and the month's rule start again. Prestige stays the only reset.
- **Season stars** come from the daily check-in (2), daily tasks (2 each, 6 a day), golden bushes (1, 5 a day), hand cupping (1, 3 a day), contracts (1, 3 a day), the weekly order (15), drop event contracts (5) and the season's first prestige (10; later prestiges that season give none, so quick early prestiges don't put new players ahead). The caps reset each real day.
- **The season board** ranks season stars, then know-how earned this season, so new and old farmers race on equal terms.
- **The track**: 30 tiers of 15 stars, free. A cosmetic every 5 tiers (decoration, background, hat, building style, nameplate charm, then a dated title and a gold badge frame), coins, stamina and growth boosts in between, never cranes. Unclaimed tiers are granted when the season ends.
- **Season rules**: one mild twist per theme, aimed at active play (e.g. Momiji: honey lots sell for 15% more; Winter lights: golden bushes last 45 s). The last 3 days of every season bring golden bushes twice as often.
- **Season archive** (Shop > Farmer): a year after a season ends, its cosmetics come back for cranes. Titles and badges never come back.
- **Closing a season**: the server saves the final board on the first request of a new season, and the game asks it for the final rank before showing the badge.
- The farm's harvest, rainy, spring … chip is now called the weather, so it isn't confused with the monthly season.
- Test tab: "+50 season stars" and "End the season".

## Unlock pacing
- Process prices follow what they pay: honey 600 know-how, rum barrel 10,000, whiskey barrel 20,000, strawberry infused 45,000. Ordering the real coffee on bejucoffee.com still unlocks its process straight away.
- The big unlocks wait for a prestige (`GATE` in the template): rum barrel, Pink Bourbon and Gedeo at P1; whiskey barrel, Heirloom and Toba at P2; strawberry infused and Turrialba at P3. The first run has seven small unlocks; each later run opens a new farm, process and coffee.
- Tabs open one at a time: Build and Unlock after the first sale, Daily at level 3, Shop at level 4, Ranks at level 6. Each gets a short card from Rosa with a "Show me" button. The Ranks card explains the season and goes straight to the season track.
- The Season sub-tab opens with a "How seasons work" box (earn stars, climb the track, race the board) until the first tier is claimed. The first star gets a toast, the first tier gets a card with a Claim button, and the Ranks tab shows a dot while a tier is waiting.
- Measured with the bot (active, to P5): the first prestige moves from 20 to 29 minutes, and P5 lands at about the same time as before.

## Native coffees and terroir
- Each farm has native varieties (Mogiana: Yellow Catuai, Mundo Novo, Yellow Bourbon; Huila: Caturra, Castillo, Pink Bourbon; Gedeo: Heirloom; Lake Toba: Catimor; Turrialba: Caturra, Yellow Catuai, Geisha; Osaka: Geisha, Pink Bourbon, Yellow Bourbon).
- A native field grows 20% faster. **Terroir:** while a farm has at least one native field, every pick there (by hand, by pickers and offline) brings in 15% more cherries. That keeps older coffees like Catimor and Caturra worth a field next to the newest varieties.
- The Farm tab shows whether terroir is on and which natives would turn it on. The replant window lists the natives and warns before you replant your only native field.
- Tutorial: a two-step "Native" chapter after the first replant (unlock Yellow Catuai, then plant it at Mogiana).
- Measured with the bot keeping one native field per farm: P5 in about 10.7 hours of active play at +15% (9.9 at +20%, 11.8 without terroir).


## Mill racks at scale
- Over 4 racks, the drying racks switch to a grid of small tiles (process icon, coffee, kg, drying bar, buyer tag) with Cup, Sell or Deliver buttons on each tile. A Grid / List switch keeps the detailed rows for anyone who prefers them.
- With 2 or more lots, two bulk buttons sit above the racks: **Cup all** (a free prestige 2 perk, the Head cupper's table: hand-cups every lot not yet cupped; staff still never cup, so you have to be playing) and **Sell all dry** (each dry lot goes to a matching buyer first, the rest to the roastery).

## Prestige perks
- Free, permanent conveniences that arrive with a prestige (`PERKS` in the template), timed for when the farm outgrows doing that job by hand. They show in the prestige preview, the prestige popup and a list under Ranks > Prestige & looks.
- P1 Seed catalogue: Replant all switches every field on every open farm to one coffee; each farm keeps one native field, or gets one if you own a native there.
- P2 Head cupper's table: Cup all. In the bot run, racks go from 6-9 in the P1 run to 10-17 in the P2 run, which is when tapping each lot becomes a chore.
- P3 Night shift: offline time capped at 18 hours instead of 12.
- P4 Old friends: Huila and Gedeo stay awake through a prestige; Toba and Turrialba still sleep until their levels.
- P5 Lookout: golden bushes can appear on any open farm, with a Go button over the farm view.
- P6 Tasting notes: swap one daily task a day for a different one (golden bushes, cupping or a buyer contract join the task pool); the reward stays the same.
- P7 Foreman's notebook: pick the foreman's process for each coffee in Build > Staff; buyers waiting for a coffee still come first.
- P8 Golden Crane: a gold Beju sign on every farm and a red-crowned crane crossing the sky every 45 seconds (cosmetic). Season decorations stand along the top of the drying patio and the sign by the house path, clear of the six farm buildings on the hedge line.
- Measured with the bot (active, to P5): 10.3 hours with the perks, against 10.7 before.

## Readable numbers
- The pixel font stays for words (headings, tabs, button labels, names), but every run of digits in the panels and popups is set in the body font (Zen Kaku Gothic New, bold, even-width digits) by `numify` in the template. HUD counters, toasts, button costs, stats and the floating +coins / +kg text use the body font too.

## Farm levels, bigger farms and buildings that always count
- **Farm levels:** each farm's level is its building levels + 2 for the manager + 1 for the fourth field + its mastery. Milestones: 5 the origin building style (Mogiana Fazenda, Huila Cafetero, Gedeo Highland, Toba Bamboo, Turrialba Tico, Osaka Kyoto), 10 +10% on that origin's process from any farm (Mogiana natural, Huila whiskey and rum, Gedeo washed, Toba strawberry, Turrialba honey, Osaka Geisha), 15 a gold passport stamp, 25 that bonus becomes +20%. The Farm tab shows the farm's level and next milestone; the old "Farm level" bar (really your player level) now reads "Level".
- **Bigger farms:** buildings cap at level 5, 7 from P4, 9 from P6, 10 from P8 (shown in the prestige preview, popup and perk list).
- **Wet mill and shade trees** add up across farms with diminishing returns (60% x (1 - 0.85^levels) faster washed drying; 4 x (1 - 0.85^levels) cup), so every level counts. Before, levels past 6 wet mills and 10 shade levels did nothing.
- **Huila** costs 1,500 know-how (was 800), so it opens around minute 12.
- Measured: human bot P4 in 3.1-3.5 h of play (unchanged), efficient bot P5 in 10.1 h (was 10.3); no coins wasted on capped buildings (was about 3 million a run); coins after P4 go into level 6-7 buildings.

## Endless upgrades
- Farm mastery (coins) adds a flat +1% picking speed on that farm per level, and research (know-how) a flat +1% know-how from every sale per level. Both keep their rising prices, so they only pay once everything else is bought. Before, mastery gave +10% a level and research +0.3 cup score a level (about +3% know-how, outside the 95 cup cap).
- Measured: efficient bot P5 in 11.7 h of active play (was 10.1 h); human bot P4 unchanged at 3.1-3.5 h.

## Farm-gated unlocks
- Farms need the previous farm built up (`FARM_REQ`): Huila needs Mogiana at farm level 6; Gedeo, Huila at 18 (plus P1); Toba, Gedeo at 24 (plus P2); Turrialba, Toba at 30 (plus P3).
- Coffees come from farms where they're native (`VAR_HOME`) and can be unlocked in any order once available: Mogiana brings Yellow Catuai, Mundo Novo and Yellow Bourbon; Huila Castillo and Pink Bourbon (P1); Gedeo Heirloom (P2); Lake Toba Catimor (now 2,000 know-how); Turrialba or Osaka Geisha.
- Rum and whiskey barrels need Huila at farm level 12 (plus P1 / P2); strawberry infused needs Lake Toba at 12 (plus P3). Ordering the real coffee still unlocks them at once.
- Locked rows name what's missing ("Needs Huila at farm level 12 (now 9), and needs prestige 1"). The tutorial's coffee chapter now teaches Yellow Catuai and terroir.
- Measured: Toba opens at 72-77 min of play (was 57-65), Turrialba at 109-131 min (was 97-107); human bot P4 3.5-3.8 h; efficient bot P5 11.2 h.

## Cupping notebook and buyer requests
- **Notebook** (Unlock > Notebook): a 9 coffee x 6 process grid. Each pair earns a star at its 1st, 25th and 250th lot sold or delivered; each star adds +0.5 cup score to that pair (up to +1.5). Every process for one coffee earns "<coffee> specialist", every coffee for one process "<process> master", and 25 / 75 / 162 stars earn Cupper, Head cupper and Q grader (plus the Q grader charm). Rosa introduces it at the first star.
- **Requests:** a named regular (Kenji in Kyoto, Aya in Osaka, Mr Tanaka in Kobe, Mika in Nara, Sora in Tokyo) asks for one hand-cupped lot of a pair, usually one you haven't tried. It pays about six minutes of income and counts twice in the notebook, lasts a real day, and shows in the Mill and the Notebook. Staff never cup, so only you can fill one; the foreman and Sell all dry leave the requested lot on the rack. A new request comes 15 minutes after a fill, or an hour after "Not now".
- The P7 perk is now the Foreman's ledger, so it isn't confused with the notebook.
- Measured: efficient bot P5 in 10.5 h (11.2 h before), with 30 of 54 pairs tried and 6 notebook titles.

## The roastery (Mill > Roastery)
- Opens at prestige 3, or as soon as the Osaka garden opens. Rosa introduces it.
- **Loop:** tap Roast on a dry lot to send its green coffee to the roastery; roast up to the drum size in one go, light (75 s), medium (90 s) or dark (105 s). Each coffee has a best roast (light for Geisha, Heirloom and fine washed coffees; dark for barrel lots and Brazilian-style naturals; medium otherwise). Tap **Crack** during first crack (70-86% through) for +15 quality; too early or late misses it. Quality = cup score - 40, +15 for the best roast (-5 otherwise), +15 for the crack, +5 with the cupping lab.
- **Buyers:** specialty cafés pay x1.7 for light, kissaten x1.6 for dark, konbini blends x1.3 for medium; a roast a buyer doesn't want sells at the green price; price also scales with quality (x0.6 + quality/100). Roasted coffee earns about 1.5-2.5x green, plus 1.2x the know-how.
- **Reputation** (personal, not on a leaderboard) comes from bags sold, more when the buyer wanted that roast. Levels 1-20: 2 cooling tray (-20% roast time), 3 60 kg drum, 4 second roaster, 6 cupping lab (+5 quality), 7 150 kg drum, 10 house blends (two bags into a Beju-named blend: Casablanca Blend, Osaka Morning, Kissaten Dark, Sakura Light, Crane House Blend, Kyoto Evening, Beju Breakfast, Momiji Roast; +5 quality and every buyer wants it), 12 400 kg drum, 15 third roaster, 20 the Master roaster title.
- Each finished roast gives 1 season star (up to 3 a day). Staff never roast. Once you have a mill foreman he keeps the roastery stocked (on by default): he sends dry lots there until 2, 4 (default) or 8 roasts' worth of green coffee is waiting, then sells the rest; switch it off in Mill > Roastery.
- Balance (after the P5 playthrough): reputation comes per bag sold (quality / 10, x1.5 when the buyer wanted that roast, x2 for blends) against 100 x (level - 1)^2 per level; drums 40 / 80 / 160 / 320 kg at reputation 1 / 3 / 7 / 12; buyers pay x1.5 / 1.45 / 1.25 for the roast they want, times 0.7 + quality / 200. Measured: reputation 10-11 by P5 and the roastery earning about 15% of coins.


## Mill and roastery scenes
On the Mill tab the stage shows the mill instead of a farm, and the Roastery tab shows the Osaka roastery. The ◀ ▶ arrows lead back out to the farms. The backgrounds are `bg/mill.png` and `bg/roastery.png`, drawn by `scene_mill()` and `scene_roastery()` in `build_sprites.py`. Everything that changes is drawn live by the interiors section of `template.html`, with the sprites `mill_rack`, `roaster_0-2`, `roasterB_0-2`, `cool_tray`, `gsack` and `cup_lab`.
- **Mill yard:** up to 16 raised racks, matching racks(), with a "+N more racks" sign beyond that. Each lot keeps its rack until it leaves (`rackSlots()`). Its coffee goes from wet cherries or parchment to dry over five stages, tinted by process. Each rack shows a drying bar, a cup icon once the lot is cupped, a gold tag for a regular's request, and a sparkle when the lot is dry. Mill hands (one per three drying lots, up to four) rake the drying lots. The foreman, with his clipboard, checks racks and the truck. Every sold lot is carried to the truck with a float showing the coins.
- **Roastery:** one bay per roaster, plus "REP 4" and "REP 15" on the bays not open yet. Drums turn black with a brass band at 160 kg and up. Cooling trays come with reputation 2 and the cupping lab with reputation 6. Bags fill the shelves (12 shown, then "+N"), and green coffee sacks pile up by the wall. Each roaster has a progress bar with the first-crack window in gold, and "CRACK!" flashes during the window. You stand at the roaster that needs you, and an assistant hauls sacks and minds the trays. Customers come in through the noren and leave with a bag when you sell one, and window-shoppers drop in now and then. The roastery plays its own track, "Kissaten Blue": slow swung jazz with vibraphone, Rhodes, walking upright bass, brushes and vinyl crackle (`roastery` in music.js and cozy.js).
- **Taps:**
  - Mill: a rack cups its lot first, then sells it once dry (to a matching contract first); the cupping table runs Cup all (P2).
  - Roastery: a free roaster roasts your largest green coffee at its best roast, and a roasting one counts as the Crack tap.
- **Sounds:**
  - `cup`: a spoon clinks, then a slurp. It plays when you cup a lot, by hand or with Cup all.
  - `crack`: dry popcorn snaps. It plays when first crack starts, and keeps popping in the roastery until you tap.
  - `drop`: beans rattle into the cooling tray when a roast finishes.
  - `ignite`: the burner catches when a roast starts.
  - `harvest`: now a branch rustles, cherries drop into the basket one by one, and a bright pluck follows.
  - Previews are in `review/new-sounds-preview.mp3` (harvest, cup, crack, drop, ignite, then the old pour and ding for comparison) and `review/kissaten-blue-preview.mp3`.

## Roastery cosmetics (Shop › Roastery)
All of these show in the roastery scene. `RCOS` in `template.html` lists every item with how it's earned (`src`).
- **Kinds:**
  - Roaster finishes (`RFIN`, sprite colour swaps; the brass band on big drums stays).
  - Interiors (`RROOM`; backgrounds `bg/roastery-<room>.png` from `scene_roastery(room)` in `build_sprites.py`).
  - Noren (`RNOREN`, plus one for each season made from its colours).
  - Props (`RPROP`; `rp_*` sprites, each in a fixed spot, which you can show or hide).
  - Bag labels (`RLABEL`, plus season labels; they recolour the shelf bags and the bags customers carry).
  - Aprons (`RAPRON`, worn by the assistant and the cashier).
  - Gold drum windows.
- **Sources:**
  - Reputation 5, 8, 9, 11, 13, 14, 16, 17, 18 and 19 each give one item. Master gold comes at 20. Every reputation level now gives something.
  - Buyer gifts after 25 and 100 bags to a buyer type (`S.rcos.sold`).
  - Perfect cracks: 100 gives the Crack master title and charm, 500 gives gold drum windows.
  - Season track tiers 12 and 22 give the month's noren and bag label once the roastery is open (coins otherwise).
  - Cranes: gold noren (20) and the Beju crest label (10).
  - Ordering Casablanca Blend gives the Casablanca label.
  - Coins: 250,000 to 25 million for anything not yet earned.
- **Shop charm:** every item you own adds 1% to bag prices, up to +20%. The roastery earns about 15% of coins, so the cap is worth about 3% of total income. It's a small thank-you, not a reason to grind.
- **Leaderboard:** your roaster finish shows as a small badge beside your name (`look.roaster`). The server accepts `copper`, `showa`, `sakura`, `beju`, `cream` and `gold`, plus the `crack` charm and the `rr:crack` title.
- **State:** `S.rcos` = `{ own, on, hide, sold, cracks }`. Old saves get the defaults.

## Roastery panel: bags first, bins, requests, instant crack
- **Bags to sell** sit at the top of Mill › Roastery as compact tiles. Each shows all three buyers with the best-paying one marked ★. **Sell all** sends each bag to its best buyer.
- **Perfect crack** finishes the roast on the spot. A miss lets it run to the end.
- **Green coffee bins:** the roastery holds up to `ROAST_BINS` (4) green coffees, one per bin, as tiles with Light, Medium and Dark buttons (★ marks the best roast) and **Sell green**.
- **Request beans:** an empty bin offers a choice of the coffees on the mill racks. A dry lot comes straight away; a drying one comes when it dries (`S.roastery.want`, `requestTickRoast`).
- **Foreman stocking** only fills coffees already in a bin, or free bins, and requests come first.

## Tabs
Farm · Mill · Roastery · Unlock · Daily · Ranks · Shop · Test/Settings.
- **Farm** has subtabs: Fields (the farm itself), Upgrades (storage, pickers, racks, hearts, the fourth field), Buildings and Staff. The last three appear after the first sale (`S.tabs.upgrades`) and show a dot when something is affordable. `S.farmSub` remembers the page. Old `setTab('upgrades')` calls land on the matching subtab, and `uptab:*` actions still work.
- **Roastery** is its own tab, locked until the roastery opens (prestige 3 or the Osaka garden). It shows a dot when there's a crack to catch or bags to sell.

## Season fairness, Rookies and Repeat roast
- **Ties:** the season board breaks ties by who reached the star total first. The client sets `S.season.starsAt`, and the server sets `starsAt` on each row when the stars go up. Season know-how only decides ties after that. Only the first prestige of a season pays stars, as before.
- **Rookies board:** shows players in their first season (`S.firstSeason`, and `firstSeason` on server rows). Saves and rows from before this change count as veterans. `GET game-score?mode=rookie` serves the board, and `mode=final` also returns `me.rookieRank`. A rookie who finishes in the rookie top 10 gets a "Rookie Champion / Top 3 / Top 10" badge as well as their normal badge.
- **Repeat roast** (reputation 8): a bin's Repeat button makes it start its next roast by itself, using the roast last chosen for that coffee, whenever a roaster is free (`S.roastery.repeat`). Catching the crack stays manual.
- **Roastery tab:** hidden until prestige 2 (or until the roastery opens), then shown as locked until prestige 3.

## Crack difficulty
First crack always opens at 70% of the roast. How long its window lasts depends on how rare the bean is (`CRACK_BEAN`: Catimor 0 up to Geisha 1) and how demanding the process is (`CRACK_METHOD`: washed 0 up to strawberry infused 1).
- **Window length:** `crackSecs(key)` runs from 10 seconds (everyday beans, washed lots) down to 2.5 seconds (Geisha strawberry). It's stored on the roast as a share of its time (`r.cw`).
- **Where it shows:** bins show "crack wide / normal / tight / very tight", and roasters show the seconds with a gold zone on their bar.
- **Bot:** the human-like bot catches shorter windows a little less often.

## Building costs, real Beju labels, seasonal roasts, Roasted by Beju cards
- **Building costs:** each level costs 3 times the last up to level 5, then 2 times (`buildStep`). The late levels are no longer one huge save each.
- **Real Beju bag labels:** the Beju crest label (10 cranes) and one label per real coffee use `bag_beju`, a pixel version of the real cream bag with the crane and wordmark in that coffee's colour, sampled from `beju-site/images/bags`.
  - Casablanca #206058, Pink Whiskey #B05850, Rum Barrel #905830, Yirgacheffe #705880, Strawberry #006088.
  - Each coffee's label unlocks when that coffee is ordered.
- **Seasonal roasts** (`SEASON_ROAST`): every season has a named recipe, a roast plus sometimes a process (October: Harvest Festival Roast, a medium roast of a natural lot). Season track tier 8 teaches it once the roastery is open.
  - Matching bags carry the season's label and sell for 20% more until that season ends.
  - The Roastery tab shows the recipe at the top.
- **Roasted by Beju cards:** ordering a real coffee stamps its card in Unlock › Notebook (`S.bejuCards`). Each card adds +0.5 cup to its pair:
  - Casablanca: Mundo Novo natural
  - Pink Whiskey: Pink Bourbon whiskey
  - Rum Barrel: Castillo rum
  - Yirgacheffe: heirloom washed
  - Strawberry: Catimor strawberry

## Late-game pacing (after the 120-hour playtest)
- **Level curve:** each level costs 1.22× the last up to level 30, then 1.15× (`XP_AT` in both `template.html` and `netlify/lib/game.js`, which must match). P5 to P6 needs about a quarter of the XP it used to.
- **Building caps:** 7 at P4, 8 at P5, 9 at P6, 10 at P8.
- **Master roaster stars:** past reputation 20, every 2,000 reputation adds a star (up to 10), shown above the roastery menu board. Each star adds +1% to bag prices.
- **Storage:** past the Beju barn (3,000 kg), five more levels open with prestige (`STORE`; the sprite stays the barn, with a gold mark per level):

  | Level | Capacity | Opens at | Cost |
  |---|---|---|---|
  | Big barn | 6,000 kg | P3 | 250k |
  | Warehouse | 12,000 kg | P4 | 1M |
  | Silo row | 25,000 kg | P5 | 4M |
  | Bulk warehouse | 50,000 kg | P6 | 15M |
  | Beju depot | 100,000 kg | P7 | 60M |

- **Staff training:** from P5, in Farm › Staff › Training. Each staff member has 10 levels, each costing 2× the last, and training is kept through prestige.
  - Farm manager: +5% picking speed on that farm per level (from 300k × the farm's cost multiplier).
  - Mill foreman: lots dry 5% faster per level (from 500k).
  - Contracts agent: new contracts pay 5% more per level (from 750k).
- **Farm reopening after prestige** scales with the run (`wakeLevel`). Each dormant farm reopens once you reach a share of the XP the new run needs for its next prestige: Huila 2%, Gedeo 5%, Toba 10%, Turrialba 18%. The old levels 3, 5, 7 and 9 are the minimum.

  | Going into | Huila | Gedeo | Toba | Turrialba |
  |---|---|---|---|---|
  | P1 | 4 | 6 | 7 | 9 |
  | P3 | 13 | 17 | 21 | 24 |
  | P5 | 24 | 28 | 33 | 37 |
  | P8 | 46 | 52 | 57 | 61 |

  The P4 perk still keeps Huila and Gedeo open. The prestige window lists each farm's reopen level.

## Farmhouse upgrades
Each farm's house grows with its farm level (`houseTier`). The overlay sprites `house_up_<farm>_<1-3>` come from `house_up()` in `build_sprites.py` and are drawn over the background at (72, 0), in each farm's own accent colour:
- **Level 10:** a striped canopy over the door, planters, a porch lamp and a welcome mat.
- **Level 25:** a veranda along the front with posts, a long awning and coffee sacks, plus a dormer window in the roof (not on Gedeo's round tukul).
- **Level 40:** gold trim along the eaves, lanterns, string lights and a Beju flag on the roof.

Each step is a farm milestone with its own line on the milestone card. Preview: `review/farmhouse-upgrades.png`.

## Estate projects
From prestige 4, each farm's drying area (left of the farmhouse) becomes an estate project, built in three stages at farm levels 30, 40 and 50 (`ESTATE`, `ESTATE_LV`, `estateNext`). Each stage costs coins and know-how: 1M + 100k, then 5M + 1.5M, then 15M + 8M, ×1.0 for Mogiana rising by 0.3 per farm to ×2.5 for Osaka (`estateCost`). All 18 stages together cost about 220M coins and 100M know-how. Stage 3 leans on know-how because the playtests end P7 with 20M+ know-how unspent while coins are what run short. Stages are kept through prestige; a dormant farm's project rests (`estOn`) until the farm wakes.

| Farm | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| Mogiana | Painted patio: +6 drying racks | Dryer house: natural lots dry 40% faster | Tasting house: natural lots cup +1 |
| Huila | Second marquesina: honey and barrel lots have a 5% chance to be a micro-lot that pays ×2 | Solar dryer: honey lots dry 30% faster | Greenhouse: micro-lots 12%, Pink Bourbon grows 20% faster |
| Gedeo | Shade cloth: heirloom picks +15% kg | Ceremony compound: a daily coffee ceremony, 30 min of golden bushes twice as often and +20% picking on every farm | Washing station: washed lots cup +1, ceremony 45 min |
| Lake Toba | Long jetty: the trader's boat brings a big rare order every 2 hours of play (×2.4–2.8, a third of the time +3 cranes) | Rice barn: strawberry and natural lots dry 30% faster | Guesthouse: a fourth roastery buyer paying ×1.35 for any roast |
| Turrialba | Settling ponds: washed lots dry 25% faster | Barrel cellar: two barrels; a lot ages +0.5 cup every 2 real hours up to +3, and pays +10% per cup | Volcano café: four barrels, aged lots +15% in the roastery |
| Osaka | Koi pond: feed every 3 hours for +1 s crack windows for an hour; 1 in 10 is a golden koi (+3 cranes) | Machiya roaster: one more roaster | Zen garden: +2 s for 2 hours, perfect-crack bags +10% |

- **Where:** a card on Farm › Fields for the farm on screen (teased from prestige 3), and tapping the drying area in the scene opens it.
- **Scene:** estates are painted into the farm's scene itself, not laid over it. `build_sprites.py` draws each scene again with the stage in it (`est_<farm>()`), then saves only the part that changed as `bg/est-<farm>-<season>-<stage>.png`. The offset goes in `sprites.json` under `estbg`, and the game draws the crop over the background (`estBg`). Ground, shadows, trees and seasons all match: tarps in the rainy season, snow on Osaka's roofs in winter. Each farm is laid out for its final stage first, in plots, and each stage fills its own plot. Earlier stages give way in a planned manner: the patio narrows for the dryer house, the beds shorten for the ceremony, the second tunnel becomes the greenhouse. Buildings keep clear of the farmhouse and the HUD. Chimneys puff (`ESTATE_SMOKE`), the ceremony throws sparks, and the koi swim faster when fed.
- **Season fairness:** the proposal had the Zen garden raise the daily roast-star cap. It became perfect-crack bag prices instead, so estates never add season stars beyond the normal daily caps.
- **Seasonal showpieces:** season track tier 15 is now that season's showpiece set (`S.spiece`), and the hat moved to tier 18. A set dresses one spot on every farm (`SHOWPIECE`, clear of the HUD) in the season's colours, and the card lets you choose which set is out. Past sets come back in the Season archive for 20 cranes. The art is a recoloured tree or banner for now.
- **Bot:** `sim/policy.js` buys stages when affordable, holds the ceremony, feeds the koi and keeps the cellar full.

## Daily and weekly tasks
- **Daily:** three tasks a day, one per slot, each slot with its own reward (`TASK_KINDS`, `slotPool`). Slot 1 is the farm (pick, bring in cherries, golden bushes) and pays coins. Slot 2 is the mill (sell, cup, contract) and pays know-how. Slot 3 pays a crane and follows what is newest in your game. Once the roastery opens it draws roasts, perfect cracks, bags sold to a buyer who wants that roast and the season's recipe. Once you have estates it also draws the Gedeo ceremony, feeding the koi and laying a lot down in the cellar, split evenly between the two. Before either, it is another mill task. The guide's first day is always pick, bring in and sell.
- **Weekly:** three bigger goals for the real week (`WEEK_KINDS`, `newWeek`), renewed with the weekly roastery order: one from the farm and mill, one from the roastery, one from the estates (4 ceremonies, 8 koi feedings, 3 trader's boat orders, 3 fully aged lots, 4 micro-lots), each falling back to an earlier group when you don't have it yet. They pay a big coin bag, a big know-how bag and 3 cranes, and no season stars, so the season board stays fair.
- **Rewards scale:** coin and know-how rewards are the larger of their old fixed amount and 5 minutes of your income (40 for weekly), worked out when you claim (`taskReward`), so they stay worth claiming late in the game. The bring-in-cherries goal grows with storage.

## New game redesign (from playtest feedback; plan in `review/new-game-redesign.html`)
- **Pacing.** The first ten levels take 5× the know-how, easing back to normal by level 26 (`XP_EARLY`, the same in `netlify/lib/game.js`). On a fresh save the first prestige lands at about an hour instead of 35 minutes, and prestige 3 (the roastery) at about 2 hours 10 minutes. Early coffees and processes also wait for a level (`UNLOCK_LV`). The next coffee waits until your newest one is planted, and the next process until your newest one has run 3 lots (`S.lastVar`, `S.lastMethod`, `S.planted`, `S.mlots`). Managers come from level 8, the mill foreman after the first prestige and the contracts agent from prestige 2 (`mgrOK`, `foremanOK`, `agentOK`).
- **Tabs open one at a time.** Farm › Upgrades after 3 sales, Unlock at level 3, Daily when Rosa's lessons end, Shop at level 6, Ranks at level 8. Buyer contracts start at level 5 once the lessons are done and stay on through prestige (`buyersOn`, `S.buyers`). Each tab's welcome card is one or two short sentences.
- **Rosa's lessons.** Nine steps in three chapters: First harvest (pick, Mill, process, cup, sell), Grow (after 3 sales: hire, storage) and A new coffee (at level 3: unlock and plant Catuai). A chapter waits (`when`, `guideWaiting`) until the last one's feature has been used for a while, and the bar hides meanwhile. Rosa says one short line; after each step comes a short reaction toast. During the lessons, Rosa's practice list (pick 10, sell 3, cup 1; small coins and know-how, no season stars or cranes) sits on the Farm and Mill pages. Live daily tasks start when the lessons end (`tutorialEnd`), and weekly tasks from level 6 (`weekOn`). The daily check-in counts from day one.
- **Weekly tasks** are week-long goals (40 contracts, 80 cups, 15 golden bushes, 60 roasts and so on). They pay a coin bag (15 minutes of income), a 30-minute growth boost and 3 cranes, but no know-how, since know-how counts towards levels.
- **Mill.** Racks show as tiles from 4 racks. Once the agent is hired, contracts fold into one line (tap to open), with the trader's boat still shown as a card. Staff show as status chips. Requests get **Start lot** when the coffee, process and a rack are there, then **Cup and send** once dry.
- **Research** is locked until every coffee, process and farm except Osaka is unlocked (`researchOpen`), and shows its progress until then.
- **Help text** (`help(id, short, full)`): full until you tap Got it, then one line and an **i** button that opens the full text. Settings › Show help text keeps everything in full.
- **Ranks and Looks.** Ranks opens on the Leaderboard, with Season and Prestige as its other pages. The Prestige page shows your crest and the next one side by side above the button. Cosmetics have their own **Looks** tab: crests, outfits, characters, backgrounds, hats, charms and titles, plus a link to building styles in the Shop. It opens at the first prestige or with your first cosmetic. Settings moved from the tab bar to a gear button on the farm, beside the sound buttons.
- **The guided first prestige** (`S.pwalk`, `PWALK`, `pwalkTick`). When a first prestige is ready, Rosa offers to show you, and the guide bar and arrow lead to Ranks › Prestige and the Prestige button. After the ceremony comes Looks to pick an outfit, then the farm, where Rosa names the resting farm and its wake level. Later prestiges skip the walk.
- **Help text pass.** Every standing explanation now goes through `help()`: the Mill intro, contracts, cupping, the foreman, terroir, buildings, staff training, Unlock (know-how, coffees, processes, farms), the notebook and Beju cards, the weekly order, season stars and rules, prestige, backgrounds and titles. Prestige perks show the next perk to come, with "see all". The season track shows the tiers around you up to the next cosmetic, with "see all 30". The roastery and notebook first-time cards are one sentence. Settings › Help text switches between "Short, with i buttons" and "Always in full" (`S.showHelp`). For a returning player: Ranks › Prestige went from about 2,950px to 510px, Season from about 2,200px to 1,100px, and the Mill from about 800px to 640px.

## Head roaster and estate manager
Two late staff who take over chores, never as well as you do them yourself (`ROASTER_REP`, `ESTATE_MGR_STAGES`). Their roasts and chores earn no season stars and count for no tasks.
- **Head roaster:** from roastery reputation 10 (about mid-P5), 1.5M coins.
  - **Work:** starts the best roast on free roasters (`headRoasterTick`), always leaving you one while you play.
  - **Crack:** catches 35% of first cracks (+5% per training level, 85% at most). His catch adds the +15 quality but not the instant finish.
  - **Away:** roasts at half your pace while you're away, and the welcome-back card counts his batches.
  - **Switch:** "Give him a break" in the Roastery turns him off.
  - **In the scene:** a white-jacketed roaster minds his drum in the roastery.
- **Estate managers:** five, one for each estate chore (`EMGR`). Huila's micro-lots come by chance, so it has none.

  | Manager | Estate | Chore they take over | Hire after you've… | Cost |
  |---|---|---|---|---|
  | Zé, Terreiro foreman | Mogiana | Raking the patio (new) | raked 5 times | 1.0M |
  | Almaz, Ceremony host | Gedeo | The daily ceremony | held 3 ceremonies | 1.6M |
  | Tigor, Harbour master | Lake Toba | The trader's boat | delivered to the boat 3 times | 1.9M |
  | Mario, Cellar master | Turrialba | The barrel cellar | aged 2 lots fully | 2.2M |
  | Yuki, Koi keeper | Osaka | Feeding the koi | fed them 5 times | 2.5M |

  - **How well:** each works at 40% of your result (+5% per training level, 90% at most, `emEff`) and steps in only once you've had your chance (`emTick`).
    - **Zé:** rakes 20 minutes after it's ready, for +0.2 cup instead of +0.5.
    - **Almaz:** holds the ceremony after 30 minutes of play, for a share of its length.
    - **Yuki:** feeds the koi 20 minutes after they're ready, for a smaller crack bonus and no golden koi.
    - **Mario:** ages his own lots to +1 cup, up to +2.5 trained.
    - **Tigor:** delivers boat-ready lots for the market price plus his share of the boat's premium. Once he has delivered to a boat, its cranes are lost.
  - **No stars:** their work earns no season stars, tasks or cranes.
  - **Hiring:** each is hired from their estate's card, and the card then shows what they did last. Farm › Staff lists all five with their training (300k × the estate's cost factor to start, doubling to level 10).
  - **In the scene:** each stands at their own estate in its colours.
  - **The rake:** Mogiana's new chore. From stage 1, tap Rake on the estate card every 2 hours, and natural lots started in the next 30 minutes cup +0.5 (`rakePatio`). It's a daily task option too.
  - **The boat:** the foreman now sets boat-ready lots aside (`boatWants`), and the contracts agent no longer fills boat orders, so the boat is your chore or Tigor's.
  - **Old saves:** the earlier single estate manager is refunded.
- **Coin sinks:** hiring the head roaster is 1.5M and all five estate managers 9.2M. Training doubles each level up to 10, alongside the existing staff training from P5.

## Farm visits
- **What uploads:** every online farm sends a small snapshot of how its farms look to `netlify/functions/game-visit.js` (`farmSnapshot`, `visitSync`). That's each open farm's buildings and style, field, estate stage, farmhouse tier and planted coffees, plus storage, decorations, the seasonal showpiece and the gold sign. It goes at most every 5 minutes, and only when something changed.
- **The farm code:** the server keeps only shapes it recognises (`cleanFarm` in `netlify/lib/game.js`) and gives the farm a six-character code (no 0, O, 1, I or L) once, for good. The code goes into the player's leaderboard row.
- **Visiting:** Ranks › Leaderboard has a **Visit** button on every online farmer, plus a farm-code box. Your own code, Cheers count and a "see how it looks" link are there too, with a choice of which farm visitors see first.
- **The visit window:** draws that farm still and read-only (`renderVisit`): its scene in your current season, estate, farmhouse, buildings, decorations, ripe bushes, showpiece and farmer. Tabs switch between their farms.
- **Cheers:** one per visitor per farm per Japan day, never on your own, and at most 30 farms a day. The first Cheers each day earns a season star (cap 1).
- **Chat:** none; co-op messages will be stickers only when co-ops come.
- **Early Farm tab.** Only what matters yet. "Prestige 0" waits for a prestige or the Ranks tab, the farm level card for building upgrades, and the terroir line for a coffee native to that farm. Replant all waits for its perk. Picker and field rows are one short line. The "Hire a picker" lesson completes by itself when the farm already has every picker it has room for.

## Map arrows
- **What they point at:** the same bouncing gold arrow as the guide, over anything on the map you can tap right now (`hintAt`, `drawHint`). One at a time, in this order:
  - **Farm:** the golden bush, else a ready estate chore.
  - **Mill:** the cupping table when Cup all is yours and two or more lots need cupping, else the first uncupped rack, else a dry lot to sell when there's no foreman.
  - **Roastery:** a roaster in its crack window, else a free roaster when there's green coffee.
- **Estate chores on the map** (`CHORE_AT`): tap the Mogiana patio to rake it, the Gedeo compound to hold the day's ceremony, and the Osaka pond to feed the koi. When none is ready, tapping the same area opens the estate card as before.
- **When they hide:** while the guide's own arrow is up or a window is open. They also stop bobbing for players who turn on reduced motion.
- **The cupping table** sits mid-patio in the mill (`CUP_TABLE`, and `tx, ty` in `scene_mill`), clear of the counters at the top right.

## Unlock walks
- **What happens:** whenever something new opens after the lessons, the guide bar says what it is ("Unlocked · Coffee to unlock: Yellow Catuai") and the arrow walks you there, step by step: the tab, then the sub-tab, then the button or the spot on the map (`NAV`, `navTick`, `navTarget`).
- **One at a time:** unlocks queue up and never show while a window is open. Each step scrolls on screen once.
- **When a walk ends:** when you tap the last step, after 6 seconds looking at it, when you tap **Got it**, or when it no longer applies (you bought the coffee, say). After 90 seconds it gives up. Each walk runs once (`S.navSeen`).
- **What's covered:**
  - **Tabs:** Unlock, Farm › Upgrades, Daily, Shop, Ranks, Looks and the Roastery.
  - **The Mill and tasks:** buyers' contracts and weekly tasks.
  - **Unlocks:** every coffee, process and farm as it becomes available, and Research.
  - **Staff:** the farm manager, mill foreman, contracts agent, head roaster and each estate manager.
  - **Perks:** Replant all, Cup all (the cupping table on the map) and task swaps.
  - **Late game:** estate projects (the drying area on the map), repeat roasts, house blends and farm visits.
- **Old saves and the lessons:** anything already open when the lessons end, or when an old save first loads, is marked as seen, so nobody gets a pile of walks at once.
