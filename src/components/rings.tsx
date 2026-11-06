import { type Vec3, encodeSrgb, hslToRgb, oklchToRgb, srgbLightness, toHex } from '@/lib/color'
import { type ChipIndex, HUES, chipKey } from '@/lib/munsell'

/** sRGB grey with the given CIE L*. */
function greyFor(lStar: number): string {
  const fy = (lStar + 16) / 116
  const Y = lStar > 8 ? fy ** 3 : lStar / (24389 / 27)
  return toHex(encodeSrgb([Y, Y, Y]))
}

interface Ring {
  name: string
  colors: Vec3[]
  note: string
}

function Ring({ ring, grey }: { ring: Ring; grey: boolean }) {
  const n = ring.colors.length
  const size = 180
  const c = size / 2
  const r0 = 52
  const r1 = 84
  const pt = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [c + r * Math.cos(a), c + r * Math.sin(a)]
  }
  const lstars = ring.colors.map(srgbLightness)
  const spread = Math.max(...lstars) - Math.min(...lstars)
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40" role="img" aria-label={`${ring.name}${grey ? ' as greys' : ''}`}>
        {ring.colors.map((rgb, i) => {
          const a0 = (i / n) * 360 - 180 / n
          const a1 = ((i + 1) / n) * 360 - 180 / n + 0.4
          const [x0, y0] = pt(a0, r0)
          const [x1, y1] = pt(a0, r1)
          const [x2, y2] = pt(a1, r1)
          const [x3, y3] = pt(a1, r0)
          return (
            <path
              key={i}
              d={`M${x0},${y0} L${x1},${y1} A${r1},${r1} 0 0 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 0 ${x0},${y0}Z`}
              fill={grey ? greyFor(lstars[i]) : toHex(rgb)}
            />
          )
        })}
        {grey && (
          <text x={c} y={c + 4} textAnchor="middle" className="fill-foreground text-[12px] tabular-nums">
            ΔL* {spread.toFixed(1)}
          </text>
        )}
      </svg>
      {!grey && <figcaption className="text-center text-xs text-muted-foreground">{ring.name}</figcaption>}
      {grey && <figcaption className="max-w-40 text-center text-xs text-muted-foreground">{ring.note}</figcaption>}
    </figure>
  )
}

export function Rings({ index }: { index: ChipIndex }) {
  const munsell = HUES.map((h) => index.byKey.get(chipKey(h, 5, 6))?.rgb ?? [0.5, 0.5, 0.5]) as Vec3[]
  const rings: Ring[] = [
    { name: 'Munsell 5/6', colors: munsell, note: 'Every chip has Y 19.27, so the greys match.' },
    {
      name: 'HSL S 100% L 50%',
      colors: Array.from({ length: 40 }, (_, i) => hslToRgb(i * 9, 1, 0.5)),
      note: 'Yellow and cyan come out near white, blue near black.',
    },
    {
      name: 'OKLCH 0.578 0.09',
      colors: Array.from({ length: 40 }, (_, i) => oklchToRgb(0.578, 0.09, i * 9 + 25)),
      note: 'Lightness holds, hue spacing differs from Munsell.',
    },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {rings.map((r) => (
        <div key={r.name} className="flex flex-col items-center gap-2">
          <Ring ring={r} grey={false} />
          <Ring ring={r} grey />
        </div>
      ))}
    </div>
  )
}
