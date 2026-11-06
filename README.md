# Munsell study

Explorer for the Munsell colour system, built after Andrew Werth's [virtual Munsell wheel](https://www.andrewwerth.com/aboutmunsell/) and the [Wikipedia article](https://en.wikipedia.org/wiki/Munsell_color_system). It converts the 1943 renotation chips to sRGB, interpolates any decimal notation, and lines Munsell up against HSL, CIELAB and OKLCH.

## Run

```sh
bun install
bun run dev
```

Vite picks the next free port if 5173 is taken.

Tabs:

- Hue page: one of the 40 hues next to its complement, value down the side, chroma across. A vertical slice of the Munsell tree.
- Value slice: every chip at one value, hue as angle, chroma as radius.
- Solid: the whole renotation solid in 3D. Drag to rotate, click a chip, cut away a quarter, cap the value.
- Limits: a 40 hue x 9 value map of the highest chroma, sRGB against the renotation data, plus charts of max chroma and peak value per hue.
- Notation: type any notation (`2.8Y 6.95/2.3`) to get an interpolated swatch, or pick a colour to get its nearest notation. Includes the 100-step hue strip.
- Compare: Munsell value 5 against HSL at L 50%, L* around the hue circle, hue rings next to their L* greys, the N1 to N9 scale, Illuminant C vs D65 greys.
- Soil & uses: soil-book pages (10R to 5Y, chromas 1 to 8, value 2.5 included) and where else the notation is used.
- History: colour solids from Mayer (1758) to Kirschmann (1895), Munsell's timeline, and a 5PB/5Y section of the real solid against a sphere.
- Notes: how the notation works and where the numbers come from.

Click any chip to see its xyY, sRGB, CIELAB, LCh, OKLCH and HSL in the side panel. The header switches toggle the C to D65 adaptation and show chips outside sRGB (clipped, hatched).

## Data

`src/data/munsell-real.json` is generated. To rebuild it and the test fixtures:

```sh
bun run data   # uv run --with colour-science python scripts/export_munsell.py
```

It needs `uv`. The script reads the renotation "real" set from colour-science, takes Y from ASTM D1535, and adds N1 to N9. It also writes `reference.json` and `interpolation.json`, the colour-science fixtures the tests compare against. Conversion to sRGB happens in the browser (`src/lib/color.ts`) so the adaptation can be toggled.

Off-grid notations go through `src/lib/interpolate.ts`: radial in hue around Illuminant C, linear in chroma, linear in Y between values. It stays within 0.004 xy of colour-science on the test fixtures. Notations outside the real chips return nothing rather than extrapolating.

## Checks

```sh
bun test          # colour maths against colour-science fixtures
bun run typecheck
bun run lint
```

Design notes are in `docs/munsell-study.md`.

## Limitations

- Interpolation is simpler than colour-science's (always radial in hue), so off-grid colours can differ by a few thousandths in xy.
- No extrapolation: values below 1 or above 9 with chroma, and anything past the real chips, are rejected.
- Out-of-gamut chips are clipped per channel, not mapped perceptually, so their swatches are only a hint.
- The data is the published renotation, not official Munsell Color Company values.
