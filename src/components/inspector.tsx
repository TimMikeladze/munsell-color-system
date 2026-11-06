import { Badge } from '@/components/ui/badge'
import { type Chip, FAMILY_NAMES, familyOf } from '@/lib/munsell'

const f = (n: number, d = 1) => n.toFixed(d)

export function Inspector({ chip }: { chip?: Chip }) {
  if (!chip) {
    return <p className="text-sm text-muted-foreground">Click any chip to inspect it.</p>
  }
  const [x, y, Y] = chip.xyY
  const rows: [string, string][] = [
    ['Hue', chip.hue === 'N' ? 'Neutral (no hue)' : `${chip.hue}, ${FAMILY_NAMES[familyOf(chip.hue)]}`],
    ['Value', `${chip.value} of 10`],
    ['Chroma', chip.hue === 'N' ? '0' : String(chip.chroma)],
    ['xyY (C)', `${f(x, 4)}, ${f(y, 4)}, ${f(Y, 2)}`],
    ['sRGB', chip.rgb.map((c) => Math.round(c * 255)).join(', ')],
    ['Linear sRGB', chip.linear.map((c) => f(c, 3)).join(', ')],
    ['CIELAB', chip.lab.map((c) => f(c)).join(', ')],
    ['LCh', `${f(chip.lch[0])} ${f(chip.lch[1])} ${f(chip.lch[2])}°`],
    ['OKLCH', `${f(chip.oklch[0], 3)} ${f(chip.oklch[1], 3)} ${f(chip.oklch[2])}°`],
    ['HSL', `${f(chip.hsl[0], 0)}° ${f(chip.hsl[1] * 100, 0)}% ${f(chip.hsl[2] * 100, 0)}%`],
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="h-28 rounded-md border" style={{ background: chip.hex }} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-medium">{chip.notation}</span>
        <span className="font-mono text-sm">{chip.hex}</span>
      </div>
      {!chip.inGamut && (
        <Badge variant="outline" className="w-fit">
          Outside sRGB, shown clipped
        </Badge>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
