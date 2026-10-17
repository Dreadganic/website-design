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

`python3 play/build.py <out.html>` inlines `sprites.json` and the scene PNGs into `play/template.html`, giving one self-contained page. It saves to localStorage (`beju-farm-save-v2`). You start in Mogiana, Brazil; points open Huila (1,500), Gedeo (3,000), Toba (5,000) and Turrialba (8,000) in that order; the Osaka garden costs 60 cranes and has no points price.

New art used by it (all in `sprites.json`):
- `storage_1..5`: basket → basket stack → crate pile → storage shed → Beju barn (100 / 250 / 500 / 1,200 / 3,000 kg)
- `carry_backbasket`, `carry_wheelbarrow`: picker carrying gear (9 / 15 / 30 kg per trip)
- `bed_open`: cleared fourth field
- `proc_<method>`: processing pictures for the mill
- `green_sack`, `i_*` icons, `stamp_<loc>` passport stamps
