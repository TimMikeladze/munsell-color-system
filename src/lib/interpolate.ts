import raw from '@/data/munsell-real.json'
import { type Adaptation, type Vec3, WHITE_C, adaptToD65, xyYToXYZ, xyzToOklab } from './color'
import { type Chip, FAMILIES, chipFromXyY } from './munsell'

export interface MunsellSpec {
  /** 0..100 hue number, R = 0..10 ... RP = 90..100. Ignored for neutrals. */
  hue: number
  value: number
  chroma: number
}

/** ASTM D1535 value function. Y on a 0..100 scale (value 10 is about 100). */
export function astmLuminance(V: number): number {
  return 1.1914 * V - 0.22533 * V ** 2 + 0.23352 * V ** 3 - 0.020484 * V ** 4 + 0.00081939 * V ** 5
}

/** Hue number (multiple of anything) to a family + step name. 10 maps to 10R, 0 and 100 to 10RP. */
export function hueName(h: number, digits = 1): string {
  let n = ((h % 100) + 100) % 100
  if (n === 0) n = 100
  let fam = Math.floor(n / 10)
  let step = n - fam * 10
  if (step < 1e-9) {
    fam -= 1
    step = 10
  }
  const s = Number(step.toFixed(digits))
  return `${s}${FAMILIES[fam]}`
}

export function hueNumber(name: string): number {
  const m = /^(\d+(?:\.\d+)?)(R|YR|Y|GY|G|BG|B|PB|P|RP)$/i.exec(name.trim())
  if (!m) return NaN
  const fam = FAMILIES.indexOf(m[2].toUpperCase() as (typeof FAMILIES)[number])
  return fam * 10 + Number(m[1])
}

const fmt = (n: number) => String(Number(n.toFixed(2)))

export function formatSpec(spec: MunsellSpec): string {
  if (spec.chroma < 0.05) return `N ${fmt(spec.value)}/`
  return `${hueName(spec.hue)} ${fmt(spec.value)}/${fmt(spec.chroma)}`
}

/** Parses `2.8Y 6.95/2.3`, `5R 4/14`, `N 5/` or `N5`. Returns null when it can't. */
export function parseMunsell(text: string): MunsellSpec | null {
  const t = text.trim().toUpperCase()
  const n = /^N\s*(\d+(?:\.\d+)?)\s*(?:\/\s*0?(?:\.0+)?)?$/.exec(t)
  if (n) {
    const value = Number(n[1])
    return value >= 0 && value <= 10 ? { hue: 0, value, chroma: 0 } : null
  }
  const m = /^(\d+(?:\.\d+)?)\s*(R|YR|Y|GY|G|BG|B|PB|P|RP)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t)
  if (!m) return null
  const step = Number(m[1])
  if (step > 10) return null
  const hue = hueNumber(`${m[1]}${m[2]}`)
  return { hue: ((hue % 100) + 100) % 100, value: Number(m[3]), chroma: Number(m[4]) }
}

// Raw renotation xy keyed by hue number (multiple of 2.5, 10RP = 100), value and chroma.
const XY = new Map<string, [number, number]>()
for (const [hue, value, chroma, x, y] of raw as [string, number, number, number, number, number][]) {
  if (hue === 'N') continue
  XY.set(`${hueNumber(hue) % 100}|${value}|${chroma}`, [x, y])
}

function cornerXY(h: number, v: number, c: number): [number, number] | undefined {
  if (c === 0) return WHITE_C
  return XY.get(`${((h % 100) + 100) % 100}|${v}|${c}`)
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function planeXY(h: number, v: number, c: number): [number, number] | null {
  const h0 = Math.floor(h / 2.5 + 1e-9) * 2.5
  const th = (h - h0) / 2.5
  const c0 = Math.floor(c / 2 + 1e-9) * 2
  const tc = (c - c0) / 2

  const atChroma = (ci: number): [number, number] | null => {
    const a = cornerXY(h0, v, ci)
    if (!a) return null
    if (th < 1e-9 || ci === 0) return a
    const b = cornerXY(h0 + 2.5, v, ci)
    if (!b) return null
    // Radial: angle and distance around Illuminant C, so hue steps follow the curve of constant chroma.
    const [wx, wy] = WHITE_C
    const ra = Math.hypot(a[0] - wx, a[1] - wy)
    const rb = Math.hypot(b[0] - wx, b[1] - wy)
    const aa = Math.atan2(a[1] - wy, a[0] - wx)
    let ab = Math.atan2(b[1] - wy, b[0] - wx)
    if (ab - aa > Math.PI) ab -= 2 * Math.PI
    if (aa - ab > Math.PI) ab += 2 * Math.PI
    const ang = lerp(aa, ab, th)
    const r = lerp(ra, rb, th)
    return [wx + r * Math.cos(ang), wy + r * Math.sin(ang)]
  }

  const p0 = atChroma(c0)
  if (!p0) return null
  if (tc < 1e-9) return p0
  const p1 = atChroma(c0 + 2)
  if (!p1) return null
  return [lerp(p0[0], p1[0], tc), lerp(p0[1], p1[1], tc)]
}

/** xyY (Illuminant C, Y 0..100) for any notation inside the real renotation data, else null. */
export function munsellToXyY(spec: MunsellSpec): Vec3 | null {
  const { hue, value, chroma } = spec
  if (value < 0 || value > 10 || chroma < 0) return null
  const Y = astmLuminance(value)
  if (chroma < 1e-9) return [WHITE_C[0], WHITE_C[1], Y]
  if (value < 1 || value > 9) return null
  const v0 = Math.floor(value + 1e-9)
  const tv = value - v0
  const xy0 = planeXY(hue, v0, chroma)
  if (!xy0) return null
  if (tv < 1e-9) return [xy0[0], xy0[1], Y]
  const xy1 = planeXY(hue, v0 + 1, chroma)
  if (!xy1) return null
  const t = (Y - astmLuminance(v0)) / (astmLuminance(v0 + 1) - astmLuminance(v0))
  return [lerp(xy0[0], xy1[0], t), lerp(xy0[1], xy1[1], t), Y]
}

export function specToXYZ(spec: MunsellSpec, mode: Adaptation): Vec3 | null {
  const xyY = munsellToXyY(spec)
  return xyY ? adaptToD65(xyYToXYZ(xyY[0], xyY[1], xyY[2] / 100), mode) : null
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export interface NearestResult {
  spec: MunsellSpec
  notation: string
  /** OKLab distance x 100. Under 2 is hard to see. */
  deltaE: number
}

/**
 * Nearest Munsell notation for a D65 XYZ colour. Starts at the closest renotation chip in OKLab,
 * then refines hue, value and chroma by coordinate descent over the interpolation.
 */
export function nearestMunsell(targetXYZ: Vec3, mode: Adaptation): NearestResult {
  const target = xyzToOklab(targetXYZ)
  const cost = (s: MunsellSpec) => {
    const xyz = specToXYZ(s, mode)
    return xyz ? dist(xyzToOklab(xyz), target) : Infinity
  }

  let best: MunsellSpec = { hue: 0, value: 5, chroma: 0 }
  let bestCost = Infinity
  for (const [hue, value, chroma] of raw as [string, number, number][]) {
    const s = { hue: hue === 'N' ? 0 : hueNumber(hue) % 100, value, chroma }
    const c = cost(s)
    if (c < bestCost) {
      best = s
      bestCost = c
    }
  }

  let steps = [1.25, 0.25, 1]
  for (let i = 0; i < 400 && steps.some((s) => s > 0.005); i++) {
    let improved = false
    for (const axis of [0, 1, 2] as const) {
      for (const dir of [-1, 1]) {
        const s = { ...best }
        if (axis === 0) s.hue = (((s.hue + dir * steps[0]) % 100) + 100) % 100
        if (axis === 1) s.value = Math.min(9, Math.max(1, s.value + dir * steps[1]))
        if (axis === 2) s.chroma = Math.max(0, s.chroma + dir * steps[2])
        const c = cost(s)
        if (c < bestCost - 1e-12) {
          best = s
          bestCost = c
          improved = true
        }
      }
    }
    if (!improved) steps = steps.map((s) => s / 2)
  }

  if (best.chroma < 0.05) best = { ...best, chroma: 0 }
  return { spec: best, notation: formatSpec(best), deltaE: bestCost * 100 }
}

/** Chip for any notation inside the data, interpolated when off-grid. Null outside the data. */
export function specChip(spec: MunsellSpec, mode: Adaptation): Chip | null {
  const xyY = munsellToXyY(spec)
  if (!xyY) return null
  const hue = spec.chroma < 0.05 ? 'N' : hueName(spec.hue)
  return chipFromXyY(hue, spec.value, spec.chroma, xyY, mode, formatSpec(spec))
}
