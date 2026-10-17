# Beju Farm sprites

Game Boy style pixel art for the Beju Farm game, drawn for Beju and owned by Beju Coffee Roasters.

- 16 px tiles, and every sprite uses at most 4 colours, as on the Game Boy Color.
- The same art renders in two looks: **colour** (`sheet-color.png`) and **classic** Game Boy green (`sheet-classic.png`). `@4x` files are enlarged previews.
- `sprites.json` holds every sprite as a grid of palette indices plus both palette sets. The game reads this file.
- `farm-preview-*.png` show the Huila farm laid out with the sprites.

## Sprites

| Group | Sprites |
| --- | --- |
| Ground tiles | grass, grass with flowers, tall grass, path, tilled soil |
| Coffee | sprout, young bush, full bush (flowering, green cherries and ripe cherries share one shape with different palettes), sparkle |
| Scenery | tree, big tree, thatched roof, farmhouse walls with the Beju noren, drying bed, koi pond, fence, sign |
| Props | basket, cherry pile, cherry sack |
| Workers | facing down, up and sideways, 2 walking frames each; shirt colour swaps per worker |
| UI | "FULL" speech bubble |

## Editing

Change or add sprites in `build_sprites.py`, then run:

```
python3 game-assets/build_sprites.py
python3 game-assets/inject.py game-assets/sprites.json game-assets/GameFarm.template.html <output.dc.html>
```

## Free packs worth knowing about

If the game later needs more general art (furniture, extra characters, UI icons), these CC0 packs can be used commercially with no credit required:

- Kenney Tiny Farm (16 x 16, CC0)
- Kenney 1-Bit Pack (CC0)
- Ninja Adventure by Pixel-boy and AAA (top-down, CC0)

Avoid the free version of Sprout Lands: it is licensed for non-commercial use only.
