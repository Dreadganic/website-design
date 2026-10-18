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
