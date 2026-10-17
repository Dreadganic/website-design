# Beju Farm art

Cozy modern pixel art for the Beju Farm game: warm olive greens, ochre earth, fluffy shaded trees (cherry blossom, maple), a thatched farmhouse seen from above, raised wooden beds, a hedgerow over a staked dirt bank, and a shiba who potters around. Drawn for Beju and owned by Beju Coffee Roasters.

| File | What it is |
| --- | --- |
| `farm-bg.png` | The painted Huila farm, 192 x 240, shown at 2x in the game. Everything that doesn't move. |
| `sprites.json` | The moving pieces as palette grids: coffee shrubs (sprout, young, flowering, green, ripe), workers (3-frame walks facing down and up, 2 frames sideways, 8 shirt colours), the shiba (2 frames), basket, cherry pile, sack, sparkle, sign and the FULL bubble. Also the shrub positions in the beds. |
| `sheet.png`, `sheet@4x.png` | Every moving sprite on one sheet. |
| `farm-preview.png` | The farm with sample shrubs, workers and the dog, at 3x. |
| `GameFarm.template.html` | The farm screen; `inject.py` fills in the sprites and the background. |

## Editing

Everything is drawn in code, so a change is one edit and one run:

```
python3 game-assets/build_sprites.py
python3 game-assets/inject.py <background asset url> <output.dc.html>
```

## Free packs worth knowing about

If the game later needs more general art, these CC0 packs can be used commercially with no credit required: Kenney Tiny Farm, Kenney 1-Bit Pack, and Ninja Adventure by Pixel-boy and AAA. Avoid the free version of Sprout Lands, which is licensed for non-commercial use only.
