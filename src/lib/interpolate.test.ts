import { describe, expect, test } from 'bun:test'
import fixtures from '@/data/interpolation.json'
import { decodeSrgb, linearSrgbToXYZ, hexToRgb } from './color'
import { astmLuminance, formatSpec, hueName, hueNumber, munsellToXyY, nearestMunsell, parseMunsell, specToXYZ } from './interpolate'

describe('parse and format', () => {
  test('hue numbers put 10RP at 100 and 10R at 10', () => {
    expect(hueNumber('10RP')).toBe(100)
    expect(hueNumber('10R')).toBe(10)
    expect(hueNumber('2.5YR')).toBe(12.5)
    expect(hueName(0)).toBe('10RP')
    expect(hueName(10)).toBe('10R')
    expect(hueName(12.5)).toBe('2.5YR')
  })

  test('decimal notation', () => {
    const s = parseMunsell('2.8Y 6.95/2.3')!
    expect(s.hue).toBeCloseTo(22.8, 9)
    expect([s.value, s.chroma]).toEqual([6.95, 2.3])
    expect(parseMunsell('n 5/')).toEqual({ hue: 0, value: 5, chroma: 0 })
    expect(parseMunsell('N5')).toEqual({ hue: 0, value: 5, chroma: 0 })
    expect(parseMunsell('12R 5/4')).toBeNull()
    expect(parseMunsell('banana')).toBeNull()
    expect(formatSpec({ hue: 22.8, value: 6.95, chroma: 2.3 })).toBe('2.8Y 6.95/2.3')
  })
})

describe('interpolation', () => {
  test('ASTM D1535 value 5 is Y 19.27', () => expect(astmLuminance(5)).toBeCloseTo(19.27, 2))

  test('on-grid chips return the renotation xy', () => {
    const xyY = munsellToXyY(parseMunsell('5R 4/14')!)!
    expect(xyY[0]).toBeCloseTo(0.5734, 4)
    expect(xyY[1]).toBeCloseTo(0.3057, 4)
  })

  // Fixtures from colour-science. Its interpolation picks linear or radial per region, ours is always
  // radial in hue, so allow a few thousandths in xy.
  test.each(fixtures.map((f) => [f.spec, f] as const))('%s close to colour-science', (spec, f) => {
    const xyY = munsellToXyY(parseMunsell(spec)!)!
    expect(Math.abs(xyY[0] - f.xyY[0])).toBeLessThan(0.004)
    expect(Math.abs(xyY[1] - f.xyY[1])).toBeLessThan(0.004)
    expect(xyY[2]).toBeCloseTo(f.xyY[2], 1)
  })

  test('outside the real data returns null', () => {
    expect(munsellToXyY(parseMunsell('5PB 9/20')!)).toBeNull()
    expect(munsellToXyY(parseMunsell('5R 0.5/2')!)).toBeNull()
  })
})

describe('nearest notation', () => {
  test('round trips an interpolated colour', () => {
    const spec = parseMunsell('5.2YR 4/7')!
    const r = nearestMunsell(specToXYZ(spec, 'bradford')!, 'bradford')
    expect(r.deltaE).toBeLessThan(0.3)
    expect(r.spec.value).toBeCloseTo(4, 1)
    expect(r.spec.chroma).toBeCloseTo(7, 0)
    expect(r.notation.endsWith('YR 4/7')).toBe(true)
  })

  test('grey sRGB maps to a neutral', () => {
    const r = nearestMunsell(linearSrgbToXYZ(decodeSrgb(hexToRgb('#777777'))), 'bradford')
    expect(r.notation.startsWith('N ')).toBe(true)
  })
})
