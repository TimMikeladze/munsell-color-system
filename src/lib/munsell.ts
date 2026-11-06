import raw from '@/data/munsell-real.json'
import {
  type Adaptation,
  type Vec3,
  adaptToD65,
  encodeSrgb,
  inGamut,
  rgbToHsl,
  toHex,
  toPolar,
  xyYToXYZ,
  xyzToLab,
  xyzToLinearSrgb,
  xyzToOklab,
} from './color'

export const FAMILIES = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'] as const
export type Family = (typeof FAMILIES)[number]

export const FAMILY_NAMES: Record<Family, string> = {
  R: 'Red',
  YR: 'Yellow-Red',
  Y: 'Yellow',
  GY: 'Green-Yellow',
  G: 'Green',
  BG: 'Blue-Green',
  B: 'Blue',
  PB: 'Purple-Blue',
  P: 'Purple',
  RP: 'Red-Purple',
}

const STEPS = ['2.5', '5', '7.5', '10'] as const

/** The 40 hue pages in circle order, starting at 2.5R and ending at 10RP. */
export const HUES: string[] = FAMILIES.flatMap((f) => STEPS.map((s) => `${s}${f}`))

export const hueIndex = (hue: string) => HUES.indexOf(hue)

/** Hue 20 pages away on the circle. 5R pairs with 5BG. */
export const complementOf = (hue: string) => HUES[(hueIndex(hue) + 20) % 40]

/** 0..360, 5R at 0 degrees, going R, YR, Y... counterclockwise like a Munsell wheel. */
export const hueAngle = (hue: string) => ((hueIndex(hue) - 1) * 9 + 360) % 360

export function familyOf(hue: string): Family {
  return hue.replace(/^[\d.]+/, '') as Family
}

export interface Chip {
  hue: string // 'N' for neutrals; decimal like '2.8Y' for interpolated chips
  value: number
  chroma: number
  xyY: Vec3
  notation: string
  linear: Vec3
  rgb: Vec3
  hex: string
  inGamut: boolean
  lab: Vec3
  lch: Vec3
  oklch: Vec3
  hsl: Vec3
}

export const notation = (hue: string, value: number, chroma: number) =>
  hue === 'N' ? `N ${value}/` : `${hue} ${value}/${chroma}`

/** Builds a chip from renotation-style xyY (Illuminant C, Y 0..100). */
export function chipFromXyY(hue: string, value: number, chroma: number, xyY: Vec3, mode: Adaptation, label?: string): Chip {
  const XYZ = adaptToD65(xyYToXYZ(xyY[0], xyY[1], xyY[2] / 100), mode)
  const linear = xyzToLinearSrgb(XYZ)
  const rgb = encodeSrgb(linear.map((c) => Math.min(1, Math.max(0, c))) as Vec3)
  const lab = xyzToLab(XYZ)
  return {
    hue,
    value,
    chroma,
    xyY,
    notation: label ?? notation(hue, value, chroma),
    linear,
    rgb,
    hex: toHex(rgb),
    inGamut: inGamut(linear),
    lab,
    lch: toPolar(lab),
    oklch: toPolar(xyzToOklab(XYZ)),
    hsl: rgbToHsl(rgb),
  }
}

export function buildChips(mode: Adaptation): Chip[] {
  return (raw as [string, number, number, number, number, number][]).map(([hue, value, chroma, x, y, Y]) =>
    chipFromXyY(hue, value, chroma, [x, y, Y], mode),
  )
}

export interface ChipIndex {
  all: Chip[]
  byKey: Map<string, Chip>
  neutrals: Chip[]
  maxChroma: number
}

export const chipKey = (hue: string, value: number, chroma: number) => `${hue}|${value}|${chroma}`

export function indexChips(chips: Chip[]): ChipIndex {
  const byKey = new Map(chips.map((c) => [chipKey(c.hue, c.value, c.chroma), c]))
  return {
    all: chips,
    byKey,
    neutrals: chips.filter((c) => c.hue === 'N').sort((a, b) => a.value - b.value),
    maxChroma: Math.max(...chips.map((c) => c.chroma)),
  }
}

/** Highest-chroma chip for a hue/value, optionally limited to sRGB. */
export function strongest(index: ChipIndex, hue: string, value: number, gamutOnly: boolean): Chip | undefined {
  let best: Chip | undefined
  for (let c = 2; c <= index.maxChroma; c += 2) {
    const chip = index.byKey.get(chipKey(hue, value, c))
    if (chip && (!gamutOnly || chip.inGamut)) best = chip
  }
  return best
}
