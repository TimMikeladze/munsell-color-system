export type Vec3 = [number, number, number]
type Mat3 = [Vec3, Vec3, Vec3]

export type Adaptation = 'bradford' | 'none'

export const WHITE_C: [number, number] = [0.31006, 0.31616]
export const WHITE_D65: [number, number] = [0.3127, 0.329]

const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
]

const mulM = (a: Mat3, b: Mat3): Mat3 =>
  [0, 1, 2].map((i) => [0, 1, 2].map((j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j])) as Mat3

function inv(m: Mat3): Mat3 {
  const [[a, b, c], [d, e, f], [g, h, i]] = m
  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ]
}

export const xyToXYZ = ([x, y]: [number, number]): Vec3 => [x / y, 1, (1 - x - y) / y]

export function xyYToXYZ(x: number, y: number, Y: number): Vec3 {
  if (y === 0) return [0, 0, 0]
  return [(x * Y) / y, Y, ((1 - x - y) * Y) / y]
}

const BRADFORD: Mat3 = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
]

function bradfordMatrix(src: [number, number], dst: [number, number]): Mat3 {
  const s = mul(BRADFORD, xyToXYZ(src))
  const d = mul(BRADFORD, xyToXYZ(dst))
  const scale: Mat3 = [
    [d[0] / s[0], 0, 0],
    [0, d[1] / s[1], 0],
    [0, 0, d[2] / s[2]],
  ]
  return mulM(inv(BRADFORD), mulM(scale, BRADFORD))
}

export const C_TO_D65 = bradfordMatrix(WHITE_C, WHITE_D65)

// Derived from the sRGB primaries and D65, same as colour-science, rather than the rounded IEC table.
function rgbToXYZMatrix(): Mat3 {
  const prim: [number, number][] = [
    [0.64, 0.33],
    [0.3, 0.6],
    [0.15, 0.06],
  ]
  const cols = prim.map(xyToXYZ)
  const P: Mat3 = [
    [cols[0][0], cols[1][0], cols[2][0]],
    [cols[0][1], cols[1][1], cols[2][1]],
    [cols[0][2], cols[1][2], cols[2][2]],
  ]
  const S = mul(inv(P), xyToXYZ(WHITE_D65))
  return P.map((row) => row.map((v, j) => v * S[j])) as Mat3
}

export const SRGB_TO_XYZ = rgbToXYZMatrix()
export const XYZ_TO_SRGB = inv(SRGB_TO_XYZ)

/** Renotation XYZ (Illuminant C, Y 0..1) to D65 XYZ. */
export function adaptToD65(XYZ: Vec3, mode: Adaptation): Vec3 {
  return mode === 'bradford' ? mul(C_TO_D65, XYZ) : XYZ
}

export const xyzToLinearSrgb = (XYZ: Vec3): Vec3 => mul(XYZ_TO_SRGB, XYZ)
export const linearSrgbToXYZ = (rgb: Vec3): Vec3 => mul(SRGB_TO_XYZ, rgb)

const encode = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
const decode = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

export const encodeSrgb = (lin: Vec3): Vec3 => lin.map(encode) as Vec3
export const decodeSrgb = (rgb: Vec3): Vec3 => rgb.map(decode) as Vec3

// Renotation values are rounded to 4 places, so chips sitting on the gamut edge land a hair outside.
const GAMUT_EPS = 1e-4

export const inGamut = (lin: Vec3) => lin.every((c) => c >= -GAMUT_EPS && c <= 1 + GAMUT_EPS)

const clamp01 = (c: number) => Math.min(1, Math.max(0, c))

export function toHex(rgb: Vec3): string {
  return '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): Vec3 {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const D65_XYZ = xyToXYZ(WHITE_D65)

export function xyzToLab(XYZ: Vec3, white: Vec3 = D65_XYZ): Vec3 {
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const [fx, fy, fz] = [f(XYZ[0] / white[0]), f(XYZ[1] / white[1]), f(XYZ[2] / white[2])]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** Lab or OKLab to cylindrical form. Hue in degrees 0..360. */
export function toPolar([L, a, b]: Vec3): Vec3 {
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return [L, Math.hypot(a, b), h < 0 ? h + 360 : h]
}

const OK_M1: Mat3 = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.633851707],
]
const OK_M2: Mat3 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
]

export const xyzToOklab = (XYZ: Vec3): Vec3 => mul(OK_M2, mul(OK_M1, XYZ).map(Math.cbrt) as Vec3)

const OK_M1_INV = inv(OK_M1)
const OK_M2_INV = inv(OK_M2)

export const oklabToXYZ = (lab: Vec3): Vec3 => mul(OK_M1_INV, mul(OK_M2_INV, lab).map((v) => v * v * v) as Vec3)

/** OKLCH (h in degrees) to gamma sRGB, clipped. */
export function oklchToRgb(L: number, C: number, h: number): Vec3 {
  const a = (h * Math.PI) / 180
  const lin = xyzToLinearSrgb(oklabToXYZ([L, C * Math.cos(a), C * Math.sin(a)]))
  return encodeSrgb(lin.map((c) => Math.min(1, Math.max(0, c))) as Vec3)
}

/** Gamma-encoded sRGB (0..1) to HSL with h in degrees, s and l in 0..1. */
export function rgbToHsl([r, g, b]: Vec3): Vec3 {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  return [h < 0 ? h + 360 : h, s, l]
}

export function hslToRgb(h: number, s: number, l: number): Vec3 {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

/** CIE L* of a gamma-encoded sRGB colour. */
export const srgbLightness = (rgb: Vec3) => xyzToLab(linearSrgbToXYZ(decodeSrgb(rgb)))[0]
