# Beju Farm sprites

Game Boy Advance style pixel art for the Beju Farm game (in the spirit of Pokemon FireRed and Harvest Moon: Friends of Mineral Town), drawn for Beju and owned by Beju Coffee Roasters.

- 16 px tiles; characters are 16 x 24. Each sprite has its own palette of up to 15 colours, lit from the top-left, with warm dark-brown outlines and soft drop shadows.
- `sheet.png` shows every sprite (`sheet@4x.png` enlarged); `farm-preview.png` shows the Huila farm laid out.
- `sprites.json` holds every sprite as a character grid plus its palette. The game reads this file.

## Sprites

| Group | Sprites |
| --- | --- |
| Ground tiles | grass (2 variants), grass with flowers, tall grass, path, tilled soil |
| Coffee | sprout, young bush, flowering bush, green cherries, ripe cherries, sparkle |
| Scenery | tree, big tree, fruit tree, thatched roof, farmhouse walls with the Beju noren, stone step, drying bed, koi pond with lily pad, fence, sign |
| Props | basket, cherry pile, cherry sack |
| Workers | facing down and up (3 walking frames each) and sideways (2 frames); shirt colours swap per worker from 8 colour ramps |
| UI | "FULL" speech bubble |

## Editing

Change or add sprites in `build_sprites.py`, then run:

```
python3 game-assets/build_sprites.py
python3 game-assets/inject.py game-assets/sprites.json game-assets/GameFarm.template.html <output.dc.html>
python3 game-assets/preview.py
```

## Free packs worth knowing about

If the game later needs more general art (furniture, extra characters, UI icons), these CC0 packs can be used commercially with no credit required:

- Kenney Tiny Farm (16 x 16, CC0)
- Kenney 1-Bit Pack (CC0)
- Ninja Adventure by Pixel-boy and AAA (top-down, CC0)

Avoid the free version of Sprout Lands: it is licensed for non-commercial use only.
