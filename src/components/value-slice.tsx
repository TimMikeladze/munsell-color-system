import { Slider } from '@/components/ui/slider'
import { type Chip, type ChipIndex, hueAngle } from '@/lib/munsell'

export function ValueSlice({
  index,
  value,
  onValue,
  showOutOfGamut,
  selected,
  onSelect,
}: {
  index: ChipIndex
  value: number
  onValue: (v: number) => void
  showOutOfGamut: boolean
  selected?: Chip
  onSelect: (c: Chip) => void
}) {
  const chips = index.all.filter((c) => c.value === value && c.hue !== 'N' && (showOutOfGamut || c.inGamut))
  const neutral = index.neutrals.find((n) => n.value === value)
  const maxC = Math.max(...index.all.filter((c) => showOutOfGamut || c.inGamut).map((c) => c.chroma))
  const size = 560
  const c = size / 2
  const inner = 18
  const k = (c - inner - 16) / maxC
  const radius = (chroma: number) => inner + chroma * k
  const pos = (hue: string, chroma: number) => {
    const a = ((hueAngle(hue) - 90) * Math.PI) / 180
    const r = radius(chroma)
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const
  }
  const rings = Array.from({ length: Math.floor(maxC / 4) }, (_, i) => (i + 1) * 4)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-md items-center gap-4">
        <span className="w-20 text-sm text-muted-foreground">Value {value}</span>
        <Slider min={1} max={9} step={1} value={[value]} onValueChange={([v]) => onValue(v)} aria-label="Munsell value" />
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        Horizontal cut through the Munsell tree at value {value}. Angle is hue, distance from the centre is chroma. Each ring
        is 4 chroma steps. {chips.length} chips{showOutOfGamut ? '' : ' inside sRGB'} at this value.
      </p>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[560px]" role="group" aria-label={`Munsell chips at value ${value}`}>
        {rings.map((ch) => (
          <g key={ch}>
            <circle cx={c} cy={c} r={radius(ch)} fill="none" stroke="var(--border)" />
            <text x={c + 3} y={c - radius(ch) - 2} className="fill-muted-foreground text-[9px]">
              /{ch}
            </text>
          </g>
        ))}
        {neutral && (
          <circle
            cx={c}
            cy={c}
            r={inner - 4}
            fill={neutral.hex}
            stroke={selected?.notation === neutral.notation ? 'var(--foreground)' : 'var(--border)'}
            strokeWidth={selected?.notation === neutral.notation ? 2.5 : 1}
            className="cursor-pointer"
            onClick={() => onSelect(neutral)}
          >
            <title>{neutral.notation}</title>
          </circle>
        )}
        {chips.map((chip) => {
          const [x, y] = pos(chip.hue, chip.chroma)
          const r = Math.min(8, Math.max(3, radius(chip.chroma) * 0.075))
          const isSel = selected?.notation === chip.notation
          return (
            <circle
              key={chip.notation}
              cx={x}
              cy={y}
              r={isSel ? r + 2 : r}
              fill={chip.hex}
              stroke={isSel ? 'var(--foreground)' : chip.inGamut ? 'none' : 'var(--foreground)'}
              strokeWidth={isSel ? 2.5 : 1}
              strokeDasharray={chip.inGamut ? undefined : '2 2'}
              className="cursor-pointer"
              onClick={() => onSelect(chip)}
            >
              <title>{chip.notation}{chip.inGamut ? '' : ' (outside sRGB)'}</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}
