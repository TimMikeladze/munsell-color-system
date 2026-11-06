# Munsell study app

Source: https://www.andrewwerth.com/aboutmunsell/ (virtual Munsell wheel). That page covers one system, Munsell, plus the D65 vs Illuminant C conversion question. This app rebuilds the idea locally so we can poke at it, then lines Munsell up against HSL, CIELAB/LCh and OKLCH.

## Data

- `scripts/export_munsell.py` takes the 1943 renotation "real" set (2734 chips, `MUNSELL_COLOURS_REAL`) from colour-science and writes `src/data/munsell-real.json` as `[hue, value, chroma, x, y, Y]` rows. xy is relative to Illuminant C. Y (0..100) comes from `colour.munsell_colour_to_xyY`, which swaps the 1943 MgO-relative Y (value 5 = 19.77) for the ASTM D1535 value function (value 5 = 19.27).
- Neutrals N1..N9 are not in the real set. The script adds them: chromaticity of Illuminant C, Y from the ASTM D1535 value function.
- The script also writes `src/data/reference.json`: a handful of chips converted by colour-science, used as fixtures for the TS conversion tests.

## Conversion (TS, `src/lib/color.ts`)

xyY (C) -> XYZ -> chromatic adaptation -> linear sRGB -> gamma sRGB.

Two modes, switchable in the UI, mirroring the two versions of Werth's tool:

- `bradford`: Bradford CAT from C to D65. Neutrals come out R=G=B. Werth's 2025 version switched to Illuminant C for the same reason; his page doesn't name the transform.
- `none`: XYZ fed straight into the sRGB matrix as if it were D65. Neutrals pick up a blue cast. Matches the problem the 2024 version had.

A chip is in gamut when all linear channels are in [0, 1] with a small epsilon. Out-of-gamut chips are hidden by default with a toggle to show them clipped and hatched.

Derived per chip: hex, CIE L*a*b* and LCh (D65, after adaptation), OKLab/OKLCH, HSL.

## Views

- Hue page: pick one of 40 hues on a ring. Shows the value x chroma grid for that hue next to its complement, which is how a vertical slice of the Munsell tree looks.
- Value slice: pick a value 1..9. Chips plotted in polar form, angle = hue, radius = chroma. The horizontal slice of the tree.
- Compare: the 10 principal hues at value 5 against HSL at S=100% L=50%, with L* under each. Line chart (TanStack Charts) of L* across hue angle for HSL vs Munsell value 5.
- Inspector panel: selected chip's notation, hex, xyY, Lab, LCh, OKLCH, HSL, gamut status.

## Second pass: Wikipedia article

Source: https://en.wikipedia.org/wiki/Munsell_color_system. Things the article covers that the first pass didn't show: the irregular 1943 solid, chroma limits that differ by hue and value (high 30s for some, about 8 for "vivid" surfaces, 5Y 8.5/14 outside sRGB), decimal hues (100-step circle, 0 and 100 at 10RP, notation like `2.8Y 6.95/2.3` that needs interpolation), the hue circle at constant value/chroma, earlier colour solids (Mayer 1758 to Kirschmann 1895), and applications (USDA soil, dentistry, beer, forensics).

### Interpolation (`src/lib/interpolate.ts`)

`munsellToXyY(spec)` for any `H V/C` inside the real data:

- Y from the ASTM D1535 polynomial at the fractional value.
- For the two bracketing integer values: bracket hue by 2.5 steps and chroma by 2 steps. Chroma below 2 interpolates toward Illuminant C. Hue is interpolated in polar form around Illuminant C (angle and radius), chroma linearly in xy.
- Between the two value planes, xy is interpolated linearly in Y.
- Returns `null` when a needed corner chip isn't in the real set.

This is simpler than colour-science (which picks linear or radial per renotation region), so tests compare against colour-science with an xy tolerance rather than exact matches.

`nearestMunsell(rgb)`: start at the closest real chip in OKLab, then coordinate descent on (hue, value, chroma) over `munsellToXyY`, shrinking the step. Returns a decimal notation and its ΔE (OKLab x 100).

Hue number: `family index * 10 + step`, R = 0..10, ... RP = 90..100, 10RP = 100 = 0.

### New views

- Solid: 3D point cloud of all chips on a canvas (no 3D library). Value up, hue as angle, chroma as radius; one value step drawn as two chroma steps, roughly Munsell's own perceptual ratio. Drag to rotate, click to select, cutaway quadrant like the article's figure, value ceiling slider.
- Limits: 40 hues x 9 values grid, each cell the max-chroma sRGB chip with its sRGB and renotation maxima. Two TanStack line charts: max chroma around the hue circle (renotation vs sRGB), and the value where each hue peaks.
- Notation: type any notation, get interpolated swatch, xyY, hue number. Colour picker to nearest Munsell notation. 100-step hue scale strip.
- Rings (in Compare): Munsell 5/6, HSL S100 L50, OKLCH at N5's lightness, each above a copy greyed to its own L*. Shows which ring holds lightness constant.
- Soil: the seven USDA soil-book hues (10R to 5Y), values 2 to 8 including 2.5, chromas 1, 2, 3, 4, 6, 8. Odd chromas and 2.5 values come from interpolation.
- History: earlier colour solids drawn as small SVG shapes on a timeline, ending with the actual 1943 silhouette (5Y vs 5PB section) drawn from the data next to Munsell's 1905 sphere.

## Stack

Vite + React 19 (existing template), Tailwind v4 + shadcn, TanStack Charts for line charts (one module per chart owns the import), `bun test` for the colour maths and interpolation.
