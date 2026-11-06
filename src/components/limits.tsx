import { SeriesLineChart, type SeriesRow } from '@/charts/line-chart'
import { hueNumber } from '@/lib/interpolate'
import { type Chip, type ChipIndex, FAMILIES, HUES } from '@/lib/munsell'

const VALUES = [9, 8, 7, 6, 5, 4, 3, 2, 1]
const REAL = 'Renotation (real surfaces)'
const SRGB = 'Inside sRGB'

function maxChip(index: ChipIndex, hue: string, value: number | undefined, gamutOnly: boolean): Chip | undefined {
  let best: Chip | undefined
  for (const c of index.all) {
    if (c.hue !== hue || (value !== undefined && c.value !== value) || (gamutOnly && !c.inGamut)) continue
    if (!best || c.chroma > best.chroma) best = c
  }
  return best
}

export function Limits({ index, selected, onSelect }: { index: ChipIndex; selected?: Chip; onSelect: (c: Chip) => void }) {
  const chromaRows: SeriesRow[] = []
  const peakRows: SeriesRow[] = []
  for (const h of HUES) {
    const x = hueNumber(h)
    const real = maxChip(index, h, undefined, false)
    const srgb = maxChip(index, h, undefined, true)
    if (real) {
      chromaRows.push({ id: `r-${h}`, series: REAL, x, y: real.chroma, label: real.notation })
      peakRows.push({ id: `p-${h}`, series: 'Peak value', x, y: real.value, label: real.notation })
    }
    if (srgb) chromaRows.push({ id: `s-${h}`, series: SRGB, x, y: srgb.chroma, label: srgb.notation })
  }
  const overall = index.all.reduce((a, c) => (c.chroma > a.chroma ? c : a))

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Chroma limit map</h2>
        <p className="text-sm text-muted-foreground">
          Every hue page against every value. Each cell is the strongest chip sRGB can show. The big number is that chip's
          chroma, the small one is the highest chroma in the renotation data, which a pigment can reach but a screen can't.
          Chroma has no fixed top: the data's maximum is {overall.notation}. Wikipedia puts "vivid" surface colours around
          chroma 8.
        </p>
        <div className="overflow-x-auto overscroll-x-contain pb-2">
          <table className="border-separate border-spacing-0.5 text-[10px] tabular-nums">
            <thead>
              <tr>
                <th />
                {HUES.map((h) => (
                  <th key={h} className="w-[22px] font-normal text-muted-foreground">
                    {h.startsWith('5') && !h.startsWith('5.') ? h.slice(1) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VALUES.map((v) => (
                <tr key={v}>
                  <th className="pr-1 text-right font-normal text-muted-foreground">{v}</th>
                  {HUES.map((h) => {
                    const chip = maxChip(index, h, v, true)
                    const real = maxChip(index, h, v, false)
                    if (!chip) return <td key={h} className="h-8 w-[22px] rounded-[2px] bg-muted/40" />
                    const ink = chip.lab[0] > 60 ? '#000' : '#fff'
                    const isSel = selected?.notation === chip.notation
                    return (
                      <td key={h} className="p-0">
                        <button
                          type="button"
                          onClick={() => onSelect(chip)}
                          title={`${chip.notation}; renotation max ${real?.notation}`}
                          className={`flex h-8 w-[22px] flex-col items-center justify-center rounded-[2px] leading-tight ${isSel ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}`}
                          style={{ background: chip.hex, color: ink }}
                        >
                          <span className="text-[11px] font-medium">{chip.chroma}</span>
                          <span className="opacity-70">{real?.chroma}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Column labels mark the 5-step of each family: {FAMILIES.join(', ')}.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Max chroma around the hue circle</h2>
        <p className="text-sm text-muted-foreground">
          Highest chroma per hue at any value. The gap between the lines is what sRGB loses. It is widest in the greens: 5G
          to 10G reach chroma 28 as surfaces but only 10 on screen. The other bump is around 7.5PB, the ultramarine corner.
        </p>
        <SeriesLineChart
          rows={chromaRows}
          series={[REAL, SRGB]}
          xLabel="Hue number (0 and 100 = 10RP)"
          yLabel="Chroma"
          ariaLabel="Maximum Munsell chroma per hue, renotation data against what fits in sRGB"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Value where each hue peaks</h2>
        <p className="text-sm text-muted-foreground">
          The value of each hue's highest-chroma renotation chip. Yellows peak at value 8 or 9, the purple-blue to purple
          range at 1 to 3. Earlier
          colour solids put every full colour on one equator; this is the measurement that broke that idea.
        </p>
        <SeriesLineChart
          rows={peakRows}
          series={['Peak value']}
          xLabel="Hue number (0 and 100 = 10RP)"
          yLabel="Munsell value"
          ariaLabel="Munsell value at which each hue reaches its highest chroma"
          format={(r) => r.label}
          height={240}
        />
      </section>
    </div>
  )
}
