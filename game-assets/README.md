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
