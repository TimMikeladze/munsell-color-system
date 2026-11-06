# Exports the Munsell renotation "real" chips and test fixtures.
# Run: uv run --with colour-science python scripts/export_munsell.py
import json
from pathlib import Path

import colour
import numpy as np
from colour.notation.datasets.munsell import MUNSELL_COLOURS_REAL

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

C = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["C"]
D65 = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"]

rows = []
for (hue, value, chroma), _ in MUNSELL_COLOURS_REAL:
    # The 1943 tables give Y relative to MgO (value 5 = 19.77). munsell_colour_to_xyY keeps the
    # renotation chromaticity but takes Y from ASTM D1535 (value 5 = 19.27), which matches the
    # neutrals below. It's what a lookup by Munsell string in colour-science returns.
    x, y, Y = (float(v) for v in colour.munsell_colour_to_xyY(f"{hue} {value}/{chroma}"))
    rows.append([hue, value, chroma, round(x, 5), round(y, 5), round(Y * 100, 4)])

# Neutrals are not part of the real set. Y comes from the ASTM D1535 value function.
for v in range(1, 10):
    Y = float(colour.notation.munsell.luminance_ASTMD1535(v))
    rows.append(["N", float(v), 0.0, round(float(C[0]), 5), round(float(C[1]), 5), round(Y, 4)])

(OUT / "munsell-real.json").write_text(json.dumps(rows, separators=(",", ":")))


def to_srgb(xyY, adapt):
    XYZ = colour.xyY_to_XYZ(np.array(xyY)) / 100
    if adapt:
        return colour.XYZ_to_sRGB(XYZ, illuminant=C, chromatic_adaptation_transform="Bradford", apply_cctf_encoding=False)
    return colour.XYZ_to_sRGB(XYZ, illuminant=D65, chromatic_adaptation_transform=None, apply_cctf_encoding=False)


picks = ["5R", "5Y", "5G", "5B", "5P", "N"]
refs = []
for row in rows:
    hue, value, chroma = row[0], row[1], row[2]
    if hue in picks and value in (3.0, 5.0, 7.0) and chroma in (0.0, 4.0, 8.0):
        xyY = row[3:]
        lin_b = to_srgb(xyY, True)
        lin_n = to_srgb(xyY, False)
        XYZ_d65 = colour.chromatic_adaptation(colour.xyY_to_XYZ(np.array(xyY)) / 100, colour.xy_to_XYZ(C), colour.xy_to_XYZ(D65), method="Von Kries", transform="Bradford")
        lab = colour.XYZ_to_Lab(XYZ_d65, D65)
        oklab = colour.XYZ_to_Oklab(XYZ_d65)
        refs.append({
            "hue": hue, "value": value, "chroma": chroma, "xyY": xyY,
            "linearBradford": [float(v) for v in lin_b],
            "linearNone": [float(v) for v in lin_n],
            "lab": [float(v) for v in lab],
            "oklab": [float(v) for v in oklab],
        })

(OUT / "reference.json").write_text(json.dumps(refs, indent=1))

# Off-grid notations for the interpolation tests.
interp = []
for spec in ["2.8Y 6.95/2.3", "5.2YR 4/7", "8.7GY 6/5", "10YR 3/1", "3PB 5.5/9", "7.5R 2.5/3", "1.3G 8.2/4.4", "6.1RP 3.3/10.5", "10YR 6/3"]:
    x, y, Y = (float(v) for v in colour.munsell_colour_to_xyY(spec))
    interp.append({"spec": spec, "xyY": [x, y, Y * 100]})
(OUT / "interpolation.json").write_text(json.dumps(interp, indent=1))
print(f"{len(rows)} chips, {len(refs)} reference fixtures")
