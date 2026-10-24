# Beju Farm art

Cozy modern pixel art for the Beju Farm game: warm olive greens, ochre earth, fluffy shaded trees (cherry blossom, maple), a thatched farmhouse seen from above, raised wooden beds, a hedgerow over a staked dirt bank, and a shiba who potters around. Drawn for Beju and owned by Beju Coffee Roasters.

| File | What it is |
| --- | --- |
| `bg/<location>-<season>.png` | 14 painted farm scenes (192 x 352, shown at 2x). The fields sit in the same place in every scene; below them are the farmyard and each farm's own scenery. |
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
- **Unlock** (know-how): Coffees · Process · Farms · Research (techniques, then cupping research). A dot on the tab means something is affordable.
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
- Opens at prestige 1, or as soon as the Osaka garden opens. Rosa introduces it.
- **Loop:** tap Roast on a dry lot to send its green coffee to the roastery; roast up to the drum size in one go, light (75 s), medium (90 s) or dark (105 s). Each coffee has a best roast (light for Geisha, Heirloom and fine washed coffees; dark for barrel lots and Brazilian-style naturals; medium otherwise). Tap **Crack** during first crack (70-86% through) for +15 quality; too early or late misses it. Quality = cup score - 40, +15 for the best roast (-5 otherwise), +15 for the crack, +5 with the cupping lab.
- **Buyers:** specialty cafés pay x1.7 for light, kissaten x1.6 for dark, konbini blends x1.3 for medium; a roast a buyer doesn't want sells at the green price; price also scales with quality (x0.6 + quality/100). Roasted coffee earns about 1.5-2.5x green, plus 1.2x the know-how.
- **Reputation** (personal, not on a leaderboard) comes from bags sold, more when the buyer wanted that roast. Levels 1-20: 2 cooling tray (-20% roast time), 3 60 kg drum, 4 second roaster, 6 cupping lab (+5 quality), 7 150 kg drum, 10 house blends (two bags into a Beju-named blend: Casablanca Blend, Osaka Morning, Kissaten Dark, Sakura Light, Crane House Blend, Kyoto Evening, Beju Breakfast, Momiji Roast; +5 quality and every buyer wants it), 12 400 kg drum, 15 third roaster, 20 the Master roaster title.
- Each finished roast gives 1 season star (up to 3 a day). Staff never roast. Once you have a mill foreman he keeps the roastery stocked (on by default): he sends dry lots there until 2, 4 (default) or 8 roasts' worth of green coffee is waiting, then sells the rest; switch it off in Mill > Roastery.
- Balance (after the P5 playthrough): reputation comes per bag sold (quality / 10, x1.5 when the buyer wanted that roast, x2 for blends) against the level table (`REP_T`, see Playtest fixes below; was 100 x (level - 1)^2); drums 40 / 80 / 160 / 320 kg at reputation 1 / 3 / 7 / 12; buyers pay x1.5 / 1.45 / 1.25 for the roast they want, times 0.7 + quality / 200. Measured: reputation 10-11 by P5 and the roastery earning about 15% of coins.


## Mill and roastery scenes
On the Mill tab the stage shows the mill instead of a farm, and the Roastery tab shows the Osaka roastery. The ◀ ▶ arrows lead back out to the farms. The backgrounds are `bg/mill.png` and `bg/roastery.png`, drawn by `scene_mill()` and `scene_roastery()` in `build_sprites.py`. Everything that changes is drawn live by the interiors section of `template.html`, with the sprites `mill_rack`, `roaster_0-2`, `roasterB_0-2`, `cool_tray`, `gsack` and `cup_lab`.
- **Mill yard:** up to 32 raised racks in eight rows (`RACK_SHOWN`), matching racks(), with a "+N more racks" sign beyond that. Each lot keeps its rack until it leaves (`rackSlots()`). Its coffee goes from wet cherries or parchment to dry over five stages, tinted by process. Each rack shows a drying bar, a cup icon once the lot is cupped, a gold tag for a regular's request, and a sparkle when the lot is dry. Mill hands (one per three drying lots, up to four) rake the drying lots. The foreman, with his clipboard, checks racks and the truck. Every sold lot is carried to the truck with a float showing the coins.
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
- **Roastery** is its own tab, locked until the roastery opens (prestige 1 or the Osaka garden). It shows a dot when there's a crack to catch or bags to sell.

## Season fairness, Rookies and Repeat roast
- **Ties:** the season board breaks ties by who reached the star total first. The client sets `S.season.starsAt`, and the server sets `starsAt` on each row when the stars go up. Season know-how only decides ties after that. Only the first prestige of a season pays stars, as before.
- **Rookies board:** shows players in their first season (`S.firstSeason`, and `firstSeason` on server rows). Saves and rows from before this change count as veterans. `GET game-score?mode=rookie` serves the board, and `mode=final` also returns `me.rookieRank`. A rookie who finishes in the rookie top 10 gets a "Rookie Champion / Top 3 / Top 10" badge as well as their normal badge.
- **Repeat roast** (reputation 8): a bin's Repeat button makes it start its next roast by itself, using the roast last chosen for that coffee, whenever a roaster is free (`S.roastery.repeat`). Catching the crack stays manual.
- **Roastery tab:** hidden until level 9 of the first run, then shown as locked until the first prestige.

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
- **Storage:** past the Beju barn (3,000 kg), five more levels open with prestige, one a prestige, each holding about ten minutes of that stage's picking (`STORE`; the sprite stays the barn, with a gold mark per level):

  | Level | Capacity | Opens at | Cost |
  |---|---|---|---|
  | Big barn | 8,000 kg | P1 | 250k |
  | Warehouse | 20,000 kg | P2 | 1M |
  | Silo row | 40,000 kg | P3 | 4M |
  | Bulk warehouse | 80,000 kg | P4 | 15M |
  | Beju depot | 150,000 kg | P5 | 60M |

- **Staff training:** in Farm › Staff › Training, paid in know-how from the day each person is hired (see "Staff training in know-how" below). Training is kept through prestige.
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
- **Pacing.** The first ten levels take 5× the know-how, easing back to normal by level 26 (`XP_EARLY`, the same in `netlify/lib/game.js`). On a fresh save the first prestige lands at about an hour instead of 35 minutes, and prestige 3 (the roastery) at about 2 hours 10 minutes. Early coffees and processes also wait for a level (`UNLOCK_LV`). The next coffee waits until your newest one is planted, and the next process until your newest one has run 3 lots (`S.lastVar`, `S.lastMethod`, `S.planted`, `S.mlots`). Managers come from level 4, the mill foreman at the first prestige and the contracts agent at level 12 of prestige 2 (`mgrOK`, `foremanOK`, `agentOK`).
- **Tabs open one at a time.** Farm › Upgrades after 3 sales, Unlock at level 2, Daily when Rosa's lessons end, Shop at level 8, Ranks at level 9. Buyer contracts start at level 5 once the lessons are done and stay on through prestige (`buyersOn`, `S.buyers`). New tabs are shown by the unlock walks rather than a card from Rosa.
- **Rosa's lessons.** Nine steps in three chapters: First harvest (pick, Mill, process, cup, sell), Grow (after 3 sales: hire, storage) and A new coffee (at level 2: unlock and plant Catuai). A chapter waits (`when`, `guideWaiting`) until the last one's feature has been used for a while, and the bar hides meanwhile. Rosa says one short line; after each step comes a short reaction toast. During the lessons, Rosa's practice list (pick 10, sell 3, cup 1; small coins and know-how, no season stars or cranes) sits on the Farm and Mill pages. Live daily tasks start when the lessons end (`tutorialEnd`), and weekly tasks from level 8 after the first prestige (`weekOn`). The daily check-in counts from day one.
- **Weekly tasks** are week-long goals (40 contracts, 80 cups, 15 golden bushes, 60 roasts and so on). They pay a coin bag (15 minutes of income), a 30-minute growth boost and 3 cranes, but no know-how, since know-how counts towards levels.
- **Mill.** Racks show as tiles from 4 racks. Once the agent is hired, contracts fold into one line (tap to open), with the trader's boat still shown as a card. Staff show as status chips. Requests get **Start lot** when the coffee, process and a rack are there, then **Cup and send** once dry.
- **Research** (cupping research) opens at the first prestige (`researchOpen`). The Cup of Excellence still needs every coffee, process and farm (`allOpen`).
- **Help text** (`help(id, short, full)`): full until you tap Got it, then one line and an **i** button that opens the full text. Settings › Show help text keeps everything in full.
- **Ranks and Looks.** Ranks opens on the Leaderboard, with Season and Prestige as its other pages. The Prestige page shows your crest and the next one side by side above the button. Cosmetics have their own **Looks** tab: crests, outfits, characters, backgrounds, hats, charms and titles, plus a link to building styles in the Shop. It opens at the first prestige or with your first cosmetic. Settings moved from the tab bar to a gear button on the farm, beside the sound buttons.
- **The guided first prestige** (`S.pwalk`, `PWALK`, `pwalkTick`). When a first prestige is ready, Rosa offers to show you, and the guide bar and arrow lead to Ranks › Prestige and the Prestige button. After the ceremony comes Looks to pick an outfit, then the farm, where Rosa names the resting farm and its wake level. Later prestiges skip the walk.
- **Help text pass.** Every standing explanation now goes through `help()`: the Mill intro, contracts, cupping, the foreman, terroir, buildings, staff training, Unlock (know-how, coffees, processes, farms), the notebook and Beju cards, the weekly order, season stars and rules, prestige, backgrounds and titles. Prestige perks show the next perk to come, with "see all". The season track shows the tiers around you up to the next cosmetic, with "see all 30". The roastery and notebook first-time cards are one sentence. Settings › Help text switches between "Short, with i buttons" and "Always in full" (`S.showHelp`). For a returning player: Ranks › Prestige went from about 2,950px to 510px, Season from about 2,200px to 1,100px, and the Mill from about 800px to 640px.

## Head roaster and estate manager
Two late staff who take over chores, never as well as you do them yourself (`ROASTER_REP`, `ESTATE_MGR_STAGES`). Their roasts and chores earn no season stars and count for no tasks.
- **Head roaster:** from roastery reputation 10 (about mid-P5), 1.5M coins.
  - **Work:** starts the best roast on free roasters (`headRoasterTick`), always leaving you one while you play.
  - **Crack:** catches 30% of first cracks (+3% per training level, 90% at most). His catch adds the +15 quality but not the instant finish.
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

  - **How well:** each works at 40% of your result (+3% per training level, 100% at most, `emEff`) and steps in only once you've had your chance (`emTick`).
    - **Zé:** rakes 20 minutes after it's ready, for +0.2 cup instead of +0.5.
    - **Almaz:** holds the ceremony after 30 minutes of play, for a share of its length.
    - **Yuki:** feeds the koi 20 minutes after they're ready, for a smaller crack bonus and no golden koi.
    - **Mario:** ages his own lots to +1 cup, up to +2.5 trained.
    - **Tigor:** delivers boat-ready lots for the market price plus his share of the boat's premium. Once he has delivered to a boat, its cranes are lost.
  - **No stars:** their work earns no season stars, tasks or cranes.
  - **Hiring:** each is hired from their estate's card, and the card then shows what they did last. Farm › Staff lists all five with their training (300k × the estate's cost factor to start, doubling to level 10).
  - **In the scene:** each stands at their own estate in its colours.
  - **The rake:** Mogiana's new chore. From stage 1, tap Rake on the estate card every 2 hours, and natural lots started in the next 30 minutes cup +0.5 (`rakePatio`). It's a daily task option too.
  - **The boat:** the foreman now sets boat-ready lots aside, only as many as the boat still needs, and the contracts agent no longer fills boat orders, so the boat is your chore or Tigor's.
  - **Old saves:** the earlier single estate manager is refunded.
- **Coin sinks:** hiring the head roaster is 1.5M and all five estate managers 9.2M. Their training is now paid in know-how (below).

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
  - **Mill:** the cupping table when Cup all is yours and two or more lots need cupping, else the first uncupped rack, else a dry lot to sell when there's no foreman, else an empty rack when there are cherries and no foreman.
  - **Roastery:** a roaster in its crack window, else a free roaster when there's green coffee.
- **Empty racks start a lot.** Tapping an empty rack on the mill map starts the best-paying lot from the cherries in store, on that rack (`bestLot`). It compares every coffee you have against every process you own, using `lotValue`, so a matching contract and today's market bonus count.
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

## Pacing pass (from `review/road-to-p3.html`)
- **Fewer pop-ups.** These now get a window only the first time; after that they're toasts:
  - a hand sale (the first sale, the first peaberry, the first micro-lot);
  - a contract (the first one, plus the trader's boat and drop events);
  - a farm level reward (unless it brings a building style).
  
  A level-up opens a window only when it opens something: a tab, a coffee, process or farm, staff, a farm waking, or prestige. That's worked out by comparing which unlock walks apply before and after the level (`navNow`). Otherwise, and always during Rosa's lessons, it's a toast with the fanfare. "Cupped by hand" and "on the racks" toasts show for the first three only.
- **One welcome.** Rosa's first card is the only welcome. Season stars stay quiet until Ranks opens. Rosa's cards for the Daily, Shop, Ranks and Looks tabs are gone, since the unlock walks show those tabs; she keeps her cards for buyers, prestige and the roastery.
- **Help boxes** are about 20 words each. The foreman's box went from 68 words to 30.
- **Re-spaced start:**
  - Unlock tab and Yellow Catuai at level 2, so the lessons end at about 6 minutes;
  - farm manager at level 4;
  - honey at level 7;
  - Shop at level 8 and Ranks at level 9;
  - weekly tasks from level 8 after the first prestige.
- **Prestige rewards spread over the next run** (`PLV`, `PERK_LV`, `AGENT_LV`):
  - **P1:** the crest, outfit, Looks and foreman come at once. Replant all switches on at level 4, weekly tasks at level 8, and Gedeo and Pink Bourbon open at level 10.
  - **P2:** Cup all comes at once, the agent at level 12, and Toba and heirloom at level 20.
  - **P3:** the Roastery comes at once, Turrialba at level 14 and strawberry at level 22.
  
  Levels come back fast after a prestige (P2 reaches level 12 in about 4 minutes), so these gates sit 5 to 15 minutes into each run.
- **Pickers' sacks** (`S.sacks`, `SACK_H`, `sackPour`). Until a foreman is hired, the pickers keep picking while you're away for up to 2 hours' worth. Whatever the store can't take waits in their sacks and empties into the store as you make room. The Farm tab's storage row shows what's still waiting.
- **New walks:**
  - **travel:** the › arrow once a second farm is open;
  - **Buildings:** the first time one is affordable after the lessons;
  - **storage upgrade:** after a night away fills the store.
  
  Walks marked `teach` are not pre-marked as seen when the lessons end. The first time stamina runs out, a toast says how hearts refill.
- **Fixes:**
  - the cupping notebook card's sentence;
  - the resting-farm card reads its wake level before the delay;
  - the first season-star toast no longer names the wrong level.

## Rosa teaches on the map
- The first chapter points at the map rather than the panel buttons. Map targets are spots like `cv:mill:@free`; `rackPt` and `navTarget` turn them into positions.
  - pick ripe bushes on the farm (`cv:farm:@ripe`);
  - tap an empty rack to start a lot (`@free`);
  - tap the drying rack to cup it (`@cup`);
  - tap the rack when it's dry to sell it (`@dry`, which points at the drying rack until it's done).
- If you're on another scene, the arrow points at the tab that leads back. When a lesson's target is on the map and you've scrolled down into the panel, the page scrolls the map back on screen once. The panel buttons still work and complete the step too.
- **Rewards that live in the Shop wait for it.** A building style (farm level 5) or a gold passport stamp (farm level 15) earned before the Shop opens at level 8 is still given, but quietly. The toast just names the farm level. When the Shop opens, one card lists what's waiting, and **Show me** opens Shop › Farm style, or Real coffee if only stamps are waiting (`S.shopWait`, `shopWaitCard`).

## Community and the endgame (plan in `review/community-and-endgame.html`, audit in `review/coop-audit.html`)
All of this needs the online game (a real site or a Netlify preview), so none of it shows in the offline Claude preview. The server code is in `netlify/lib/community.js`, `netlify/lib/derby.js` and `netlify/lib/coe.js`, with one function each: `game-harvest`, `game-coop` and `game-coe`. Tests are in `netlify/tests/community.test.js`. Everything is sized to work with a small community at launch.

- **Harvest Day** (`game-harvest`, `harvestCard`, `hvAdd`, `harvestSync`). It shows from level 5 (or after a prestige).
  - **When:** one weekend a month, Saturday 10:00 to Monday 10:00 Japan time on the first weekend. Goals rotate through washed, natural, honey or any lots sold or delivered, lots cupped by hand, and golden bushes. Add a day to `netlify/lib/game-harvest.json` to replace a month's automatic one.
  - **The goal:** fixed three days before, at 60 lots, 25 cups or 3 golden bushes per player active in the last two weeks. The small floors (200 lots, 100 cups, 25 golden bushes) mean a handful of players can reach it.
  - **Counting:** the game sends its running count every minute or so. The server counts rises only, capped per player.
  - **Rewards:** halfway pays 2 cranes. The full goal gives the **Harvest basket** decoration the first time (shown on every farm, hideable in Shop › Farm style) and 5 cranes after that. Anyone who added at least one can claim.
  - **In the game:** it sits at the top of Daily › Today, with a walk the first time.
- **Cooperatives** (`game-coop`, `coopCard`, `coopSync`). They open at level 6 after the first prestige, so level 9 isn't crowded. They have their own page in the Daily tab (Daily › Today · Co-op); Today keeps a one-line summary of the co-op order.
  - **Joining:** find a co-op, start one, or join with a six-letter invite code. Up to 8 farmers.
    - "Find" picks a co-op someone played in this week first, then the nearest prestige, then the fullest. Nobody lands in an empty co-op.
    - A member away a week is marked away and counts for nothing in the order. Away a month, they leave, freeing the place. Activity is their last leaderboard update or co-op visit, whichever is later.
  - **The weekly co-op order** replaces the old made-up team order; players outside a co-op keep a solo order.
    - It asks for green coffee of one process, rotating weekly through washed, natural and honey.
    - It asks for **80% of what the members brought last week**, so an ordinary week reaches the top. A new member counts their own estimate (a third of their last 7 days' green coffee) or 1,000 kg, and the order is at least 1,000 kg per active member.
    - Tiers at 25, 50, 75 and 100% pay **1, 2, 3 and 4 cranes**: 10 in all, the same as the solo order, so play cranes stay low. One Claim pays every tier reached, and the full order also gives the weekly season stars.
  - **Stickers:** 12 preset stickers, 6 shown with "more" for the rest. One every 20 seconds, and the feed shows the last 3. Settings › Co-op stickers can hide them.
  - **Help:** once a day per mate. Each help dries every lot on the mate's racks **10% faster**, up to **3 helps a day**, and helping earns a season star (cap 1).
  - Members show their week's share, with Visit buttons to their farms. Player ids never reach other players.
- **Co-op Derby** (`netlify/lib/derby.js`, on the co-op page). It starts at **4 co-ops of two or more** as one group with no leagues, and co-ops formed mid-week join that group straight away.
  - From **20 co-ops**, co-ops are grouped about 10 at a time by league and strength. The top 3 of each group move up and the bottom 3 move down, across five leagues from Seedling to Geisha; a co-op formed mid-week then joins the next week.
  - A board of 4 tasks (three from selling, cupping, golden bushes and contracts, plus one more, which can be roasting or the boat) scores points from members' task counts, each capped per member.
  - Members who played claim a badge plus **1–3 cranes** by place. The page shows your place and the top 3, with "see all".
- **Cup of Excellence** (`game-coe`, `coePage`, `coeStep`). It opens once every coffee, process and farm is open, the foreman and agent are hired and you're at prestige 5 or more; Rosa hands over with a one-time card.
  - **The brief:** every week, the same for everyone. Three coffees, three processes, the weather (which helps or hurts each process) and what the judges like.
  - **An attempt:** pick a coffee, a process and a roast, then tap Crack in the gold window on a live roast bar.
  - **Scoring:** the server works out the score: cup score, weather, judges, crack timing (+10 to +15, or -5 for a miss) and roast (+5 for the right one, -5 for the opposite). Everyone gets the same crack windows.
  - Three tries a week; the best counts. The weekly top 10%, and always the winner however few play, get a badge.
  - **Rating:** places become percentiles when a week ends. The **Q grader rating** is the best 4 of the last 8 weeks, averaged over 4 and times 10 (0 to 1000). The **Hall of Excellence** board ranks it. The old all-time board is called **Legacy**.
  - The cupping notebook's top title and charm are now **Master cupper**, so "Q grader" means only the Cup's rating.
  - **Honesty:** the server checks every choice against the brief and rejects impossible tap times. It can't prove the tap itself, which is fine without prizes. Add a server replay before any real prizes.

## Showing off and coffee rewards (audit in `review/cranes-audit.html`)
The crane audit found play cranes about right and the order side too small, with too little to show for what players earn. Play earnings are unchanged. Server code is in `netlify/lib/game.js` (trophies, order bonus, stamps), `game-score`, `game-visit`, `game-claim`, `game-gift` and `stripe-webhook`; tests are in `netlify/tests/showoff.test.js`.

- **Trophies** (`myTrophies`, `trophyInfo`; server `addTrophy`). The server records wins it can check for itself:
  - a Cup of Excellence week (winner gold, top 10% silver);
  - a Co-op Derby podium (gold, silver, bronze);
  - each reached Harvest Day goal;
  - a top 10 season or rookie finish;
  - **Founding farmer**, for anyone whose first season is `SEASON_FIRST` or earlier.

  They live on the player record, with a copy on the score row, so they can't be edited in a save. Offline, the game's own badges stand in.
- **Pinned trophy:** Looks › Trophies. One trophy shows beside your name on every board, in the Looks header and on farm visits. The server drops a pin you don't hold.
- **Trophy shelf** (`deco_shelf`, `SHELF_AT`). It appears in front of each farmhouse with your best three trophies, the pinned one first, as soon as you have one; every launch farmer has the Founding farmer sprout. It can be hidden in Shop › Farm style.
- **Origin sacks** (`osack`, `SACKS_AT`). A stack of jute sacks, one per origin stamp, each in its stamp colour, so visitors see which real coffees you drink. Visitors see the server's record of stamps, which `game-claim` now keeps.
- **Founding farmer charm:** a nameplate charm for the launch season. It's given when the tutorial ends, and the server strips it from anyone who joined later.
- **Achievements** (Ranks › Records, `ACH`, `achTick`). 30 one-time goals paying 290 cranes in all. They cover lots, hand cupping, golden bushes, contracts, the first micro-lot and peaberry, farms, prestige 1/3/5/10, estates, the notebook, roastery reputation, check-in streaks, joining a co-op, Cheers, Harvest Day and passport stamps. The bot earns about 65 by prestige 3; the rest take weeks to months. They're paid with a toast, never a pop-up, and only after the tutorial.
- **Farm effects** (Shop › Farm style, `FX`, `drawFx`). Up to two at once:
  - Fireflies (80, from dusk) and Butterflies (80, by day).
  - Morning mist (90, at dawn).
  - Sakura petals (110) and Maple leaves (110).
  - Crane pair (150, every minute).
  - **Hanabi**, fireworks at night, only for subscribers: a subscription order unlocks it.

  Visitors see them animated over the still farm picture.
- **Market stall** (Shop › Farm style, `MKT`, `mktNow`). Three colourways a month, in Japan time, for decorations you already have, at 15–30 cranes. There are 36 in all: benches, planters, lanterns, flags, bunting, carts, the dog's bandana, the trophy shelf and the Harvest basket. Each comes back in the same month next year. Owned colours are picked under Colours, and visitors see them.
- **Roastery on visits.** A Roastery button on the visit card shows the visitor's roastery, still: room, roaster finish, noren, props, gold trim, label and aprons.
- **Coffee pays more** (server; the game shows it when an order is linked):
  - The first order of each Japan-time month pays **+30 cranes** on top of 1 per ¥100 (`MONTH_BONUS`).
  - Each subscription renewal pays **+10** more (`SUB_BONUS`), plus the monthly 30 if it's the month's first.
  - Every linked order brings a **gift code** for a friend (`game-gift`). The friend opens it in Shop › Real coffee and gets a furoshiki bundle for their farm; the sender gets 10 cranes through `game-grants`. A player opens one gift ever, never their own.
  - The Test tab's pretend orders pay the monthly bonus too.
- **Launch kit:** the thank-you card text and a new line on each coffee's page (`launch/site/farm-product.js`) say what the coffee does in the game. They go live only with `launch/apply.py`.

## Know-how, techniques and the foreman (from playtest feedback, 23 October 2026)
Feedback: levels 3.5–7 felt empty, and know-how piled up before each prestige and was then wiped. The bot agreed: before this change it reached its prestiges holding 154k, 481k and 667k unspent know-how.

- **Techniques** (Unlock › Research, `TECH`, `techSum`). 17 one-time know-how upgrades kept through every prestige. Their effects lean towards coins, drying and storage rather than know-how, so levels come no faster.
  - **First run** (levels 3–9, 1,200 to 30,000): Pruning (bushes regrow 10% faster), Float sorting (+0.5 cup), Raised beds (lots dry 10% faster), Jute sacks (storage +20%), Buyer's ledger (contracts +10%), Golden eye (golden bushes 20% sooner) and Cupping lab (lots sell 5% higher). That's one at every level from 3 to 9, with an unlock walk at level 3.
  - **Prestige 1** (levels 6–18, 25,000 to 140,000): Mechanical dryer (dry another 10%), Fermentation tanks (washed and honey dry 20% faster), Export grading (sell another 5%), Picker training (+10% picking) and Night watch (+2 hours away).
  - **Prestige 2** (levels 8–24, 120,000 to 500,000): Compost tea (regrow another 10%), Bird-friendly shade (golden bushes another 20% sooner), Direct trade (contracts another 10%), Harvest crews (another 10% picking) and Warehouse (storage another 20%).
- **Cupping research** opens at the first prestige instead of after every unlock. At each prestige, unspent know-how buys research levels automatically (`bankKnowhow`), and less than a level's worth carries into the next run. The prestige card says how many levels it bought, so nothing is lost.
- **The roastery opens at prestige 1** (was 3). Its tab shows, locked, from level 9 of the first run.
- **The foreman sizes lots by the mill.** He used to wait for a quarter of the store (or a whole contract's worth) before starting a lot. With a late-game store of 100,000 kg, that left 59 racks empty while 25,000 kg piled up. Now a lot is the store shared out over the racks (`cap / max(4, racks)`), so nothing changes on a small mill and a big mill keeps cherries flowing. In a late-game foreman-only test the store now never holds more than one lot's worth.
- **Checked with the bot:** prestiges 1, 2 and 3 at 54, 93 and 126 minutes (were 54, 91 and 128). Peak unspent know-how is 85k, 121k and 152k, mostly saved towards the next technique.

## Staff training in know-how (23 October 2026)
Every staff member trains with know-how from the day they're hired, instead of with coins from prestige 5. There are 20 levels, each 40% dearer than the last, and training is kept through every prestige. Staff start a little weaker than before and end well ahead.

| Staff | At hire | Each level | Fully trained (20) | First level costs |
|---|---|---|---|---|
| Farm manager (per farm) | pickers +5% (was +25%) | +4% | +85% | 2,000 × the farm's place (Mogiana 2,000, Huila 4,000…) |
| Mill foreman | sells at 85% of your price | +1.5% price, +3% drying | 115%, lots dry 60% faster | 6,000 |
| Contracts agent | his deliveries pay 85% of yours | +1.5% | 115% | 15,000 |
| Head roaster | catches 30% of first cracks | +3% | 90% | 20,000 |
| Estate managers | work at 40% of you | +3% | 100% | 25,000 × the estate's factor |

- The foreman's lower price applies only to the lots he sells, and the agent's only to his deliveries, so active play still pays best early on. Know-how from those sales is unchanged. The agent no longer raises new contracts' pay.
- An unlock walk points to Training once the first manager is hired and a level is affordable.
- The bot buys training alongside techniques and research. Prestiges 1 and 2 land on the old timing (56 and 90 minutes; were 54 and 91), and prestige 3 comes about 10% sooner (116; was 128) as trained staff take over. The most know-how it held unspent before each prestige was 34k, 47k and 51k.
- **The first minute** (from playtest feedback). Starting coins, the day-1 check-in, Rosa's lesson rewards and the practice tasks used to hand over about 1,100 coins in the first minute, enough for all four spare pickers.
  - You now start with 200 coins.
  - The first daily check-in comes after Rosa's lessons, so a new farmer meets Rosa first.
  - Lesson rewards are 40, 20, 60 coins and 40 know-how (were 100, 50, 150 and 50 coins).
  - The practice tasks pay know-how instead of coins.

  You can hire one picker straight away; the rest come from selling lots. The bot hires its second picker at 2.7 minutes (was 12 seconds) and reaches its first prestige at 52 minutes.
- **The cupping notebook** stays quiet until the Unlock tab, where it lives, has opened. Stars still count, and Rosa's notebook card comes with the next new star after that.
- **Level bar on the farm.** The bar towards the next level now sits inside the level pill at the top left of the farm (`#hudLevel`), under "Lv 5 · 5,300". It shows "P1 · " once you've prestiged and fills gold when a prestige is ready. It's gone from Farm › Fields.
- **Finished things fold away.** In Daily › Today:
  - Claimed daily and weekly tasks leave the list and gather in one "✓ Done today/this week" line.
  - When every task is claimed, the section becomes a single message: "Come back tomorrow for new tasks", with the hours left, or "New weekly tasks in N days".
  - The solo weekly roastery order becomes one line once it's claimed.

  On Fields, the Welcome harvest and each origin's sample card shrink to a one-line pointer to Shop › Real coffee once the sample is earned, and disappear once it has been sent or has expired.

## Map-first screen and taller scenes (23 October 2026; plan in `review/ui-plan.html`)
- **One screen.** The page no longer scrolls. The farm bar sits at the top, the eight tabs along the bottom, and the map fills everything between them (`.mapwrap`; the stage keeps the scene's 192:352 shape). On a 390 x 844 phone the map is 358 x 656.
- **Tabs open as sheets.** Tapping a tab switches the scene as before and opens its page as a sheet from the middle of the screen down to the tabs (`#sheet`, `showSheet()`). The page scrolls inside the sheet, with its sub-tabs pinned to the top. Tapping the same tab again, the ▾ on the sheet, or Esc puts it away.
- **Half and full** (from playtest feedback: half a screen was too small to scroll in). Scrolling a sheet's page takes the sheet to full height, everything below the farm bar, so the farm switcher stays in reach (`fullSheet()`, `.app.full`). The header is a handle (the bar along its top):
  - Tap it to switch between half and full.
  - Drag it up for full, or down for half; dragging down from half puts the sheet away.
  - Pulling down from the top of a full page, or scrolling up past the top with a mouse wheel once the page has stopped there, returns to half. The tail of a fast flick to the top doesn't count.
  - Every menu opens full screen (from playtest feedback). Drag the handle or pull down for half.
- **Map tabs** (from playtest feedback). Farm, Mill and Roast move the map (`mapTab`, `MAP_TABS`); the other tabs open over whichever map is showing, so opening Unlock from the Mill keeps the mill behind it.
  - Tapping a map tab you aren't on shows its map with the menu put away.
  - Tapping it again opens its menu; a third tap puts it away.
  - Travelling between farms with ◀ ▶, or with a farm chip in Unlock › Farms, also puts the menu away.
  - Rosa's "Show me" buttons and the lessons still open their page directly.
- **Finished things fold away** (`doneStrip()`). These collapse into one line of small ✓ chips at the bottom of their list, so each page starts with what's still to do:
  - maxed upgrades (storage, pickers, racks, stamina, the fourth field);
  - maxed buildings;
  - fully trained staff;
  - owned coffees and processes, and learned techniques;
  - open farms, whose chips still take you there.
- **Shop things you own fold into chips too** (`ownStrip()`). On every Shop page, what you already have sits in one "✓ Owned" line under each section's heading, and only the things still to buy keep full cards. Tapping a chip does what its old button did:
  - Farmer: play as a character, or put a hat on your pickers (the one in use is solid green with a ✓); season archive items you own are plain chips;
  - Farm style: use a building style at this farm, with "Use … on every farm" under the chips when another open farm has a different style; show or hide decor and farm effects (hidden ones are faded with a dashed edge); use a market-stall colourway;
  - Roastery: use a roaster finish, interior, noren, bag label or apron, or show or hide props and trims.
  Colours (market colourways you own) were already small buttons and are unchanged, and so are Boosts and Real coffee.
- **One row per staff member.** Farm › Staff shows Hire until someone is hired, then their training level and Train button in the same row. The separate Training section is gone. Every sheet has the same header: the tab's icon, its name and the ▾. Pages no longer repeat the tab's name as their first heading. The gear opens Settings the same way. On short phones the sheet starts a little higher so at least 320 px of it shows.
- **What stays the same.** Tab styling, dots, locks and every page's content are unchanged; the page only builds while its sheet is open (the checks it runs keep going). The golden-bush button puts the sheet away so the bush is in view.
- **Guide and arrows.** With the sheet put away, the guide bar floats over the bottom of the map, and the toast and sound buttons sit above it. With a sheet open, the guide bar moves into the sheet under its header, so the map above stays clear. A walk to a button further down a sheet scrolls the sheet to it. A map spot under the open sheet points at its tab first; tapping that tab puts the sheet away and the arrow moves to the spot.
- **Farms (192 x 352).** The top 214 rows are as before. Below the fields:
  - **The farmyard**, where the six buildings now stand (`SLOTS`, `LOT_Y` 228). A building not built yet shows as a pegged-out lot (`build_lot`). Tapping a building or lot opens Farm › Buildings, or says when Buildings open.
  - **Each farm's own scenery** down to the hedgerow. Mogiana has a red road, a white gate, a tractor and old coffee rows. Huila has a stream, a footbridge and a loaded Willys jeep. Gedeo has an enset garden, forest coffee and bark beehives. Toba has the lake shore, a jetty, a solu and rice terraces. Turrialba has a river with a hanging bridge, a painted ox cart and sugarcane. Osaka has a stream, a red drum bridge, a torii, bamboo and azaleas, all following its four seasons.
  - You and the shiba wander down to the yard now and then. Estate crops are unchanged.
- **Mill.** The rack yard runs down to the hedge: eight rows, so 32 racks show before the "+N more racks" sign (was 16). Stone footings mark each rack spot, so the empty ones show where the mill can grow. Sacks and a wheelbarrow wait at the bottom.
- **Roastery.** The shop front, door, doormat, noren, hanging plants and neon sign moved down 112 px (`SHOP_F`). In the new space is a café in each interior's own wood and cushion colours: four tables for two, a long shared table with benches, open sacks of green coffee and a chalk menu board. Guests come in at the new door; after buying, about half sit at a free seat with a cup for 8 to 16 seconds before leaving (`CAFE_SEATS`). Up to 6 guests at once (was 4).
- **Visits** show the top 264 rows of the scene (`VIS_H`): the fields and farmyard, or the roasters, shelves, counter and the start of the café. That keeps the visit window on one screen.
- **The foreman and requests (fix).** A regular's request takes one lot, but the foreman used to set aside every matching dry lot. When the request was for your main coffee, those lots filled every rack and the mill stopped until the request ran out a day later; the bot stalled like this in about 1 run in 6 after prestige 1. He now keeps one lot back for the request (a hand-cupped one if there is one), and for the boat only as many lots as it still needs; the rest sell as usual. 12 bot runs in a row with no stall; prestige timing is unchanged (prestiges at 0.6–0.8, 1.2–1.3 and 1.7–1.9 bot hours).
- The locked Roast tab now says P1, matching when the roastery opens.

## Tutorial and pop-up audit to prestige 3 (23 October 2026)
A playthrough harness plays a fresh save to prestige 3 the way a new player would. It does Rosa's nine lessons, every unlock walk and the prestige walk by tapping whatever the arrow points at, and answers every window with its main button. The bot only spends coins and know-how and runs the mill when no lesson, walk or window is up. For each arrow it checks:
- whether the arrow shows;
- whether it sits on its target;
- whether anything covers the target (the sheet, the guide bar, a toast or the HUD);
- whether the target is on screen and inside the sheet's view;
- whether each tap leads a step closer.

It also logs every window in order, with where its button took the player.

Fixed from it:
- **Arrows to buttons further down a sheet.** Rosa's lessons (for example, "Unlock Yellow Catuai") and the prestige walk ("tap Prestige", "Pick your new outfit") pointed at buttons below the fold of the half sheet. The arrow was hidden and nothing scrolled. Lessons, unlock walks and the prestige walk now share `showTarget()`, which scrolls the sheet to the target for four seconds after each step starts (the sheet then grows to full). It scrolls instantly, because a refresh of the page could cut a smooth scroll short.
- **Staff walks that had nothing left to show.** "A farm manager to hire" (and the foreman, agent, head roaster and estate manager walks) kept pointing at Farm › Staff once that person was already hired, for up to 90 seconds. They now end when the staff member is hired, and a walk that's already done when its turn comes is skipped. A walk parked on an already-open sub-tab, or ending on a button in the sheet, lets go after 6 seconds, as walks that end on their target always did.
- **The prestige walk's last step** ("A farm is resting", pointing at ▶) now also ends when ▶ is tapped, not only from Rosa's card.
- **After the first prestige,** the ceremony's "Choose your new outfit" closed whichever window was on top. That was often Rosa's one-off Season track card, which the player then never saw. It now removes only the prestige summary card (`dropPrestigeCard()`).
- **Rosa's roastery card** waits until the prestige walk and its ceremony are done, so its "Show me" no longer pulls the player to the Roast tab halfway through the walk.
- **Rosa's Buyers card and "Waiting for you in the Shop"** now show before their walks. Before, the walk started first and the card popped up over it.
- **Rosa's golden bush card** now says "Show me" and puts the sheet away, so the bush is on screen.

The final run reached prestige 3 with no arrow, cover or order issues.

## Playtest fixes (23 October 2026, evening)
- **Titles now equip.** Notebook and roastery titles have a colon in their key (`nb:catuai`, `rr:crack`), and the tap handler only passed on the part before it. The title button now reads the whole key.
- **Looks › Farm style** opens Shop › Farm style (`shopgo:bskin`). Before, it only switched the Shop's sub-page without leaving Looks.
- **Every menu opens full screen.** Map tabs still show their map on the first tap.
- **The season's roast card** waits in Roast until you've learned the recipe at season tier 8. Before, it took up the top of the page all month.
- **Roastery reputation is quicker early on** (`REP_T`, was 100 × (level − 1)²):

  | Level | 2 | 4 | 6 | 8 | 10 | 12 | 15 | 20 |
  |---|---|---|---|---|---|---|---|---|
  | Reputation needed | 80 | 340 | 680 | 1,100 | 2,300 | 4,300 | 9,000 | 28,000 |
  | Before | 100 | 900 | 2,500 | 4,900 | 8,100 | 12,100 | 19,600 | 36,100 |

  The bot (three runs of each) now reaches level 4–5 by prestige 2 (the second roaster; was 2–3), level 6–7 halfway to prestige 3 (was 3), level 8 at prestige 3 (Repeat roast; was 3), 10–11 at prestige 4 (blends and the head roaster; was 6) and 14–15 at prestige 5 (was 9). Prestige timing stays within run-to-run noise: prestige 5 at 5.6–6.3 hours (was 5.4–5.9).
- **Notices sit in the farm-name banner.** The short notices (notebook stars, season stars, lots started, new tabs and so on) show inside the banner at the top, between its arrows, for about 2.6 seconds (3.4 for long ones), then the farm name comes back. They no longer cover the map or the middle of the screen. A notice that arrives within a second of another waits its turn; up to three wait, and repeats are dropped. New notebook titles are a notice too ("Notebook: Yellow Catuai specialist! Wear it in Looks"), not a window.
- **Estate projects are only teased at prestige 3.** Fields shows a small card with the finished estate in shadow, its name, the kind of project ("Patio drying") and "opens at prestige 4" (`estateTeaser()`). The three stages, what they do, their costs and the build button wait for prestige 4.

## Beta readiness pass (23 October 2026)
A full review of the backend, the game code, the interface at fresh, prestige 1, 3 and 5 (phone, small phone and desktop) and pacing, then fixes in rounds, each checked by the backend tests, the online end-to-end test, the interface sweep, the bot to prestige 5 and the tutorial audit to prestige 3.

**Online and saves**
- **Farms move between devices.** Settings › *Play on another device* makes an 8-letter code (works once, 15 minutes); *Use a code* on the other device loads that farm after showing what it is. A *recovery code* (the account's own credential) does the same when the first device is lost. Backend: `game-link`; each device gets its own token, up to five extra per farm.
- **No more lost progress between devices.** A device now asks whenever the farm was saved elsewhere since its own last save (it compares server save versions, not clocks), and saves nothing online, including scores and the farm snapshot, until the player chooses. Before, an older device left open in the background stamped its save "now" and could overwrite newer progress, and a new device saved its fresh farm over the cloud copy while the "Newer save found" window was still up.
- **Going online retries** (15 s, 30 s, 1 min … up to 5 min, and when the browser comes back online). Before, one failed start left the whole session offline.
- **Reset works online.** "Reset the game" now tells the leaderboard the farm started again (`reset: true`); before, the server refused the lower prestige and the player's row froze. The reset farm also gets every field (it used to miss five, which stopped the game loop), and income from the old farm doesn't carry into the new one's first rewards.
- **Names are checked up front** against the leaderboard's rules (2 to 16 letters, no links or slurs). Before, a name the server refused silently stopped every score from posting.
- Order claims and link codes use create-only writes, so two requests can't both succeed. Renewals read the subscription from `invoice.parent` on newer Stripe API versions. New farms are capped at 20 an hour per connection (counted by a hash of the address). Scores post every 2 minutes unless something visible changed (prestige, stars, looks, name), and each function instance reads score rows at most once per 15 seconds.
- A save that won't read is kept aside (`beju-farm-save-v3-unreadable-…`) instead of being overwritten.

**Interface**
- **Numbers no longer break onto their own line** in buttons ("Prestige at level / 34", bag prices as "11 / k"), the agent's contract line and the co-op feed. Button labels are one span (`btn()`), and the two CSS rules that styled every span inside are direct-child rules now.
- **The leaderboard gives names the whole row**, with stars, prestige and know-how on a line under the name. Before, names were cut to five or six letters on small phones.
- **Drying times are real time** ("45 s", "1 min 20 s"). They showed the base time ÷ 2.5 as "min", which was neither real nor farm time.
- **A farm with every picker place taken** shows *Full* and points at worker housing, instead of a greyed-out price.
- **The map's numbers are shortcuts:** know-how opens Unlock (Ranks › Prestige once one is ready), coins open Farm › Upgrades, cranes the Shop, the cherry store the Mill. The roastery's shelf and green sacks open the Roast sheet.
- **The mill shows where the next rack goes**, faintly, while one can still be added; tapping it opens Farm › Upgrades.
- Windows are dialogs for screen readers, text boxes in them take focus (buttons too for keyboard players), and Escape closes any window with a Close or Cancel.
- The template declares UTF-8 itself.

**Mechanics and words that disagreed**
- The weekly order no longer promises a "Co-op Roaster badge" it never gave; it says 10 cranes and 15 season stars.
- The season-track card's "Claim it" opens Ranks › Season, where the Claim buttons are (it opened the Leaderboard).
- A regular's request now counts as a sale for daily tasks, Harvest Day, the co-op order and the Derby.
- The prestige summary names the farms that really stay open (it always said "Brazil and Osaka", even with Old friends keeping Huila and Gedeo awake).
- Storage upgrades past the barn are a notice: the picture doesn't change after level 5.
- Drop events say how many days they really run; a contract's spare coffee "sold at the market price" (it said "went to the roastery"); away under an hour reads in minutes; the weekly order never says "0 days"; one name for the Master cupper charm; Tab › Page everywhere; "Roast tab", not "Roastery tab".
- Season stars: the How it works list names roasts (and cheering and co-op help online), and Stars today only lists what can be earned here.
- Task buttons show rewards with a plus ("+33,430 coins"), so they don't read as prices.
- **Stock carried over a prestige pays coins and know-how, but no levels.** Cherries in the barn and pickers' sacks, lots on the racks and in the barrel cellar, and the roastery's bins, roasters and bags are marked at prestige (`carryOver()`), and the mark travels with them: cherries into lots (carried cherries go into lots first), lots into bins, roasters and bags. Selling them pays as before, but that know-how doesn't count toward levels (`earn({ noXp })`); the prestige window says so, and the first such sale explains it once. Before, a full barn sold after a prestige counted toward the new run's levels: one tutorial audit went from level 5 to 24 at once, skipping most of the run. Now the bot is at level 1–6 three minutes into each run and 5–14 after ten (5–9 and 9–13 before).
- **Check-in rewards keep pace with the farm** from the first prestige: never less than listed, and 2 to 8 minutes of income (they stayed a flat 200–800 coins all game). Before prestige 1 they're as listed, because income right after the lessons comes in bursts. Rewards (lessons, tasks, check-ins) no longer count towards the income rate rewards are measured by, and that rate is kept in the save, so the first rewards of a session match the farm.

**Builds**
- `build.py --beta`: noindex, Settings instead of the Test tab, which `?tools` in the address brings back. The site copy at `/farm/` is built this way now.
- **Real orders count from launch, and the game says so.** Until a `--launch` build (which `launch/apply.py` makes, along with the shop's side), Shop › Real coffee, the free-sample window, Boosts and the processes' "or order it" route say orders and samples count once Beju Farm launches, so no tester buys coffee expecting a sample or cranes. Before, the beta page promised both, and neither reached the farm (`ORDERS_LIVE` in the template).

**From the first phone test**
- **The map fills the width, like the bars above and below it.** It was sized to fit the height, so on a tall phone it sat narrower than the tabs. Now the scene is drawn at the column's width and scrolls up and down when it's taller than the room (`.scroller`; at most 40% out of view, even sideways). Each scene opens where its work is (`MAP_FOCUS`: the fields, the racks, the roaster bays and shelf), soft fades show there's more, and a guide arrow scrolls its spot into view once (`mapReveal`). A spot that can't come out from under an open sheet counts as off the map, as before. Mirroring the scene's edges into the margins was tried and dropped: it cut beds, houses and the roastery counter in half.
- **The farm keeps going while the page isn't running.** Browsers stop drawing a hidden tab and phones freeze a page in the background, and each frame was capped at 0.05 s, so that time was lost (only a reload after 5 minutes brought "Welcome back!"). The loop now notices a gap in the wall clock: up to 5 minutes is played through with real ticks, at most 25 ms a frame so the farm fast-forwards without a freeze (`catchUp`, `playBehind`; quiet, no stale notices); longer gets the away summary. A reload goes the same way.
- **Roastery rewards wait for their reputation.** Ten roastery cosmetics listed "Reputation N" but could be bought for coins at any level. A reputation item is now a reward only: locked with your level shown ("Reputation 9 (now 6)") until it arrives free at that level; coin-only and gift items are unchanged. Reputation 10 now says it brings the head roaster. An owned hat can't be charged again.
- **The website's game server works.** On bejucoffee.com every game function that reads Netlify Blobs answered 502 (`BlobsConsistencyError`: strong consistency needs an `uncachedEdgeURL`, which the Lambda compatibility mode's `connectLambda()` never sets). So the game never went online there: no account, cloud save, live leaderboard, visits, co-ops or Hall of Excellence, and the leaderboard fell back to the practice farmers. The game functions now use Netlify's current format (`netlify/functions/*.mjs` around `netlify/lib/handlers/`), where Netlify sets Blobs up with the uncached address. Each function imports `@netlify/blobs` itself and hands it to the shared code (`useBlobs`): Netlify's file tracer only ships packages a function imports directly, and the first try failed live with "Cannot find module '@netlify/blobs'". `netlify/tests/v2.test.js` reproduces the consistency failure with a stand-in Blobs server and checks every wrapper; the functions were also packaged with Netlify's own `zip-it-and-ship-it` and run against a stand-in Blobs server (accounts, leaderboard, all reads strongly consistent).
- **Farms that grew offline can join the board.** Every website farm so far grew offline, and a new farm's first score had to be prestige 1 at most, so they would never have got on the board (or into anything that checks the server's record). Until 30 November 2026 (`GAME_WELCOME_UNTIL`), a brand-new row may carry its progress (up to prestige 30); a reset row still starts small, and after the first score the usual rules apply.
- **Every farmer picks a name of their own.** The first time the game opens it asks for a name before Rosa's first lesson ("Welcome to Beju Farm!"), and the window can't be skipped. Online, no two farmers can hold the same name: the server keeps `names/<key>` for each name, matched ignoring capitals, spaces and punctuation, and hands it to one player only (`claimName`, the new `game-name` function); "Mika" and "MI KA" are the same name. Stand-in names everyone would pick ("You", "Farmer", "Player 2", "Guest") are nobody's. The name can change in Settings or Ranks, up to 3 times a day, and a new name frees the old one. The board shows the name the server holds, not one a device sends, so a rename on one device reaches the others. Farms already on the board kept their names (the bigger farm first, had two shared one); farms still called "You" stay off the board until they pick one, and a name picked offline is checked when the game comes online, with the window back if someone took it meanwhile. The offline copy asks for a name too, without the online check. (Replaces the earlier "Farmer" and a tag for unnamed farms.)
- **No made-up farmers online.** The practice farmers stand in only on the offline copy, labelled as such. Online the boards hold real farmers only: while the live board loads, or if it can't be reached, it's just you, and it says so. A season's final place comes only from the server (no guessed badge), and the prestige ceremony and your rank line only name a place when there's someone to rank against.
- **Racks hold so much.** A lot took every kilo of a variety in storage, and drying time doesn't depend on size, so one rack could dry a whole barn and racks never limited the mill. Now a lot fills one rack (`rackCap()`) and the rest waits in storage for the next rack. The Drying racks line runs to level 12: its first five levels still add a rack each and now also size, the rest make every rack bigger, opening with prestige like storage (`RACK_KG` 200, 300, 400, 500, 600, then 750 at prestige 1, 900 at 2, 1,100 at 3, 1,300 at 4, 1,600 at 5, 2,000 at 6, 2,500 at 8; 150,000 to 500 million coins; flattened after later play, see below). The foreman waits for at most a full rack, the mill says how much waits, and the upgrade row shows the size and its prestige gate. Sized against the pacing bot's logs (picking 270 to 6,800 kg a minute, 3 to 41 racks): a first try at 150 to 250 kg early dried 35–40% less in the first half hour and slowed prestige 1, because smaller early lots meant fewer coins for pickers. With the final sizes, prestige 5 takes 6.2–6.5 hours (6.4 before), 7–21% of lots fill a rack before prestige 3, about 1% after, and storage never sits full.
- **Skipping the lessons no longer opens every tab.** Skip all opened the Shop (level 8) and Ranks (level 9) along with the lesson tabs; now it opens only what the lessons would (Farm upgrades, Unlock, Daily) and says when the rest open.
- **Income-sized rewards use game time.** The income rate behind golden bushes, check-ins and task rewards was measured per real minute, so the Test tab's speed multiplied them (one audit jumped 17 levels from a golden bush at ×20). At normal speed nothing changes.

**From later play**
- **The co-op order takes the week.** It was 80% of what the members sold last week, and a new co-op's first order counted every farmer as 1,000 kg, so with farms growing fast it filled in minutes. Now each member counts for their usual week of the process: the more of last week's share and what their farm sells now (the game measures green coffee sold a minute over the last quarter hour, `rateG`, sized for about an hour of play a day, `COOP_WEEK_H`, and sends it when you join or sync). The co-op is asked that sum times 1 for one farmer up to 1.7 for eight (`coopSize` in `netlify/lib/community.js`). Each farmer counts for at least the floor for their prestige (`coopFloor`: 20,000 kg at prestige 1, 30,000 at 2 and so on), since a farm sells about 14,000 kg of green coffee an hour when co-ops open (pacing bot) and more with each prestige; 2,000 kg was a few minutes' selling. An order made under older rules is sized again on its next visit (`COOP_RULES`, never smaller), unless it was already finished.
- **The co-op order's Claim button pays.** It sent `coop:claim` while the game only acted on `coop:claim.N`, so tapping it did nothing. The other Claim buttons work: the daily task, weekly roastery order, season track and Harvest Day ones were tapped in a test, and the weekly task and Derby ones checked in the code.
- **The foreman leaves a rack free for a request.** While a regular's request waits to be started, the foreman fills every rack but one (`reqWaiting`; on a mill of two racks or more), so you never have to wait for a rack to start it. Once the lot is on a rack he fills them all again.
- **Fewer pop-ups.** A level-up opens a window only when it opens a tab, wakes a resting farm or makes prestige ready; smaller features already have their Unlocked banner, so they no longer add a window too. Storage upgrades and farm milestones are notices, not windows. Things you just did yourself no longer get a notice when the screen already shows them: plain lot sales (the coins float over the rack), upgrades, buildings, hiring, training, mastery and research. A contract that runs out leaves the board quietly. "Roast started" and notebook stars only show the first few times.
- **The farm's level is in the farm bar.** A badge before the coffees ("Lv 12") and a thin line along the bar's foot to the next milestone; tap the farm's name for the milestone itself. The card on Farm › Fields is gone.
- **Changing farms keeps the menu as it was.** Open stays open on the next farm's page, put away stays put away (it always closed before).
- **No way into the Shop before it opens.** Looks › Character's "+ Shop", Looks' Farm style, the Roastery's Decorate and the Shop-waiting window all opened the Shop directly, skipping its level 8 lock. Opening a locked tab is now refused wherever it starts (`setTab`), and those buttons wait for the Shop.
- **Racks and barns that matter.** At prestige 3 a farm had 19 to 27 racks and the mill could dry 2 to 4 times what the farms picked, so racks sat 20 to 50% loaded, storage never got past a fifth full and their upgrades were a checklist. Now raised drying beds add a rack for every 3 levels across your farms (it was one a level, on every farm), the Mogiana patio 3 racks (was 6), rack sizes rise more gently after prestige 1, and the foreman waits for a full rack (or a quarter of the store) before he starts a lot. Barns come one a prestige from prestige 1 and hold about ten minutes of picking, so the store fills when the mill falls behind, a new barn is worth waiting for, and it's what your pickers bring in while you're away (with a foreman, the away haul is one barnful). Lots pay 10% more (`MILL_PAY`) so a run takes as long as before. On the pacing bot (now building a barn when its store keeps filling): racks 65 to 95% loaded and storage 15 to 70% full through prestige 3, full now and then around prestiges 1 and 2, and prestige 5 at 6.45 hours, as before.
- **The roastery's reputation is in its bar.** Like a farm's level: a badge before the roasting line ("Rep 12", "Rep 20 ★3" for a master roaster), a line along the bar's foot to the next level (or master star), and a tap on the name for what the next level brings (`repInfo`). The reputation card at the top of the Roast page is gone.

**Pacing check.** Three bot runs on the final build with the usual settings (buildings up to level 5) reach prestige 1–5 at 0.7–0.8, 1.3–1.4, 2.0–2.1, 3.1–3.5 and 6.0–7.0 hours of active play (6.2 before this pass). Most of that is run-to-run noise; the carried-stock change below adds about 0.4 hours, because a full barn no longer counts toward the next run's levels. Allowed to build to the real cap (7 at prestige 4), the bot reached prestige 5 in 5.5–6.0 hours before that change, with one or two 5–7 minute gaps without a purchase. The prestige 4 run is the long one (2.9–3.5 hours, against 1.2–1.4 for the run before, as long as the four runs before it together): most of it is the climb from level 30 to 41, 2 to 2.7 hours, and in its last two hours the bot often goes 5–18 minutes without a purchase. Worth watching with testers.

**Tools** (`sim/`): `ui_sweep.js` opens every tab and sub-page from a saved state and flags sideways scrolling, clipped buttons, broken images and "undefined"/"NaN" text; `online_e2e.js` runs the real functions behind a local server with two browser devices (moving a farm, codes, recovery, the newer-save choice, names, reset). The tutorial audit's taps now look their target up again after scrolling to it: the Ranks page re-renders every half second (its know-how count is live), and a tap aimed with the element found before that landed in the corner of the screen, which showed up as "could not find the Prestige button".
