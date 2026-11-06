import { ChipSwatch } from '@/components/chip-swatch'
import { type Chip, type ChipIndex, FAMILY_NAMES, HUES, chipKey, complementOf, familyOf, hueAngle } from '@/lib/munsell'

const VALUES = [9, 8, 7, 6, 5, 4, 3, 2, 1]

function HueRing({ index, hue, onHue }: { index: ChipIndex; hue: string; onHue: (h: string) => void }) {
  const size = 260
  const r0 = 78
  const r1 = 122
  const c = size / 2
  const pt = (deg: number, r: number) => {
    // 5R at the top, hues run clockwise.
    const a = ((deg - 90) * Math.PI) / 180
    return [c + r * Math.cos(a), c + r * Math.sin(a)]
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px]" role="group" aria-label="Munsell hue circle">
      {HUES.map((h) => {
        // Each hue at its most chromatic sRGB chip, whatever value that lands on.
        const chip = index.all
          .filter((c) => c.hue === h && c.inGamut)
          .reduce<Chip | undefined>((best, c) => (!best || c.chroma > best.chroma ? c : best), undefined)
        const a = hueAngle(h)
        const [x0, y0] = pt(a - 4.5, r0)
        const [x1, y1] = pt(a - 4.5, r1)
        const [x2, y2] = pt(a + 4.5, r1)
        const [x3, y3] = pt(a + 4.5, r0)
        const active = h === hue || h === complementOf(hue)
        return (
          <path
            key={h}
            d={`M${x0},${y0} L${x1},${y1} A${r1},${r1} 0 0 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 0 ${x0},${y0}Z`}
            fill={chip?.hex ?? '#888'}
            stroke={active ? 'var(--foreground)' : 'var(--background)'}
            strokeWidth={active ? 2 : 1}
            className="cursor-pointer"
                        onClick={() => onHue(h)}
            role="button"
            aria-label={h}
          >
            <title>{h}</title>
          </path>
        )
      })}
      {(['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'] as const).map((f) => {
        const [x, y] = pt(hueAngle(`5${f}`), 62)
        return (
          <text key={f} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[11px]">
            {f}
          </text>
        )
      })}
      <text x={c} y={c - 6} textAnchor="middle" className="fill-foreground text-[18px] font-medium">
        {hue}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">
        vs {complementOf(hue)}
      </text>
    </svg>
  )
}

export function HuePage({
  index,
  hue,
  onHue,
  showOutOfGamut,
  selected,
  onSelect,
}: {
  index: ChipIndex
  hue: string
  onHue: (h: string) => void
  showOutOfGamut: boolean
  selected?: Chip
  onSelect: (c: Chip) => void
}) {
  const comp = complementOf(hue)
  const visible = (c: Chip | undefined) => (c && (showOutOfGamut || c.inGamut) ? c : undefined)
  const maxFor = (h: string) =>
    Math.max(2, ...index.all.filter((c) => c.hue === h && (showOutOfGamut || c.inGamut)).map((c) => c.chroma))
  const right = Array.from({ length: maxFor(hue) / 2 }, (_, i) => (i + 1) * 2)
  const left = Array.from({ length: maxFor(comp) / 2 }, (_, i) => (i + 1) * 2).reverse()

  const cell = (h: string, v: number, ch: number) => {
    const chip = visible(index.byKey.get(chipKey(h, v, ch)))
    return chip ? (
      <ChipSwatch chip={chip} selected={selected?.notation === chip.notation} onSelect={onSelect} />
    ) : (
      <span className="size-7" />
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col items-center gap-2 lg:w-[260px] lg:shrink-0">
        <HueRing index={index} hue={hue} onHue={onHue} />
        <p className="text-center text-sm text-muted-foreground">
          {FAMILY_NAMES[familyOf(hue)]} page {hue}, opposite {FAMILY_NAMES[familyOf(comp)]} {comp}. Click the ring to change hue.
        </p>
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-2">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `2rem repeat(${left.length}, 1.75rem) 1.75rem repeat(${right.length}, 1.75rem)` }}>
          <span />
          <span className="text-xs text-muted-foreground" style={{ gridColumn: `span ${left.length}` }}>
            &larr; {comp} chroma
          </span>
          <span className="text-center text-xs text-muted-foreground">N</span>
          <span className="text-right text-xs text-muted-foreground" style={{ gridColumn: `span ${right.length}` }}>
            {hue} chroma &rarr;
          </span>
          {VALUES.map((v) => (
            <div key={v} className="contents">
              <span className="flex items-center justify-end pr-1 text-xs tabular-nums text-muted-foreground">{v}</span>
              {left.map((ch) => (
                <span key={`l${ch}`}>{cell(comp, v, ch)}</span>
              ))}
              <span>{cell('N', v, 0)}</span>
              {right.map((ch) => (
                <span key={`r${ch}`}>{cell(hue, v, ch)}</span>
              ))}
            </div>
          ))}
          <span className="pr-1 text-right text-xs text-muted-foreground">V/C</span>
          {left.map((ch) => (
            <span key={`lc${ch}`} className="text-center text-[10px] tabular-nums text-muted-foreground">{ch}</span>
          ))}
          <span className="text-center text-[10px] text-muted-foreground">0</span>
          {right.map((ch) => (
            <span key={`rc${ch}`} className="text-center text-[10px] tabular-nums text-muted-foreground">{ch}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
