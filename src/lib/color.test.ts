import { describe, expect, test } from 'bun:test'
import reference from '@/data/reference.json'
import { WHITE_C, adaptToD65, hexToRgb, hslToRgb, rgbToHsl, srgbLightness, toHex, xyYToXYZ, xyzToLab, xyzToLinearSrgb, xyzToOklab } from './color'
import { HUES, buildChips, complementOf, indexChips } from './munsell'

type Ref = (typeof reference)[number]

const close = (a: number[], b: number[], tol: number) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], tol))

const xyz = (r: Ref) => xyYToXYZ(r.xyY[0], r.xyY[1], r.xyY[2] / 100)

// Fixtures come from colour-science via scripts/export_munsell.py.
describe('matches colour-science', () => {
  test.each(reference.map((r) => [`${r.hue} ${r.value}/${r.chroma}`, r] as const))('%s', (_, r) => {
    close(xyzToLinearSrgb(adaptToD65(xyz(r), 'bradford')), r.linearBradford, 3)
    close(xyzToLinearSrgb(adaptToD65(xyz(r), 'none')), r.linearNone, 3)
    close(xyzToLab(adaptToD65(xyz(r), 'bradford')), r.lab, 2)
    close(xyzToOklab(adaptToD65(xyz(r), 'bradford')), r.oklab, 3)
  })
})

describe('neutrals', () => {
  const white = xyYToXYZ(WHITE_C[0], WHITE_C[1], 0.5)

  test('Bradford maps Illuminant C grey to R=G=B', () => {
    const [r, g, b] = xyzToLinearSrgb(adaptToD65(white, 'bradford'))
    expect(r).toBeCloseTo(g, 4)
    expect(g).toBeCloseTo(b, 4)
  })

  test('without adaptation the grey turns blue', () => {
    const [r, , b] = xyzToLinearSrgb(adaptToD65(white, 'none'))
    expect(b).toBeGreaterThan(r + 0.02)
  })
})

describe('sRGB helpers', () => {
  test('hex round trip', () => expect(toHex(hexToRgb('#3a7bd5'))).toBe('#3a7bd5'))
  test('hsl round trip', () => close(hslToRgb(...rgbToHsl([0.2, 0.6, 0.9])), [0.2, 0.6, 0.9], 6))
  test('L* of white and black', () => {
    expect(srgbLightness([1, 1, 1])).toBeCloseTo(100, 3)
    expect(srgbLightness([0, 0, 0])).toBeCloseTo(0, 3)
  })
})

describe('munsell data', () => {
  const index = indexChips(buildChips('bradford'))

  test('40 hues and complements', () => {
    expect(HUES).toHaveLength(40)
    expect(complementOf('5R')).toBe('5BG')
    expect(complementOf('10RP')).toBe('10G')
  })

  test('neutrals N1..N9 present and in gamut', () => {
    expect(index.neutrals.map((n) => n.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(index.neutrals.every((n) => n.inGamut)).toBe(true)
  })

  test('N5 is mid grey', () => {
    const n5 = index.neutrals[4]
    expect(n5.lab[0]).toBeGreaterThan(50)
    expect(n5.lab[0]).toBeLessThan(53)
    expect(n5.lch[1]).toBeLessThan(0.5)
  })

  test('5R 4/16 is outside sRGB', () => {
    expect(index.byKey.get('5R|4|16')?.inGamut).toBe(false)
  })
})
