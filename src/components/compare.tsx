import { SeriesLineChart, type SeriesRow } from '@/charts/line-chart'
import { ChipSwatch } from '@/components/chip-swatch'
import { Rings } from '@/components/rings'
import { hslToRgb, srgbLightness, toPolar, xyzToLab, linearSrgbToXYZ, decodeSrgb, toHex } from '@/lib/color'
import { type Chip, type ChipIndex, FAMILIES, HUES, strongest } from '@/lib/munsell'

const HSL_SERIES = 'HSL, S 100% L 50%'
const MUNSELL_SERIES = 'Munsell value 5, max sRGB chroma'

function hslRows(): SeriesRow[] {
  return Array.from({ length: 72 }, (_, i) => {
    const h = i * 5
    const rgb = hslToRgb(h, 1, 0.5)
    const lab = xyzToLab(linearSrgbToXYZ(decodeSrgb(rgb)))
    return { id: `hsl-${h}`, series: HSL_SERIES, x: toPolar(lab)[2], y: lab[0], label: `hsl(${h} 100% 50%)` }
  }).sort((a, b) => a.x - b.x)
}

function munsellRows(index: ChipIndex): SeriesRow[] {
  return HUES.flatMap((h) => {
    const chip = strongest(index, h, 5, true)
    return chip ? [{ id: `m-${h}`, series: MUNSELL_SERIES, x: chip.lch[2], y: chip.lab[0], label: chip.notation }] : []
  }).sort((a, b) => a.x - b.x)
}

const fmt = (n: number, d = 1) => n.toFixed(d)

export function Compare({
  index,
  noAdaptation,
  selected,
  onSelect,
}: {
  index: ChipIndex
  noAdaptation: ChipIndex
  selected?: Chip
  onSelect: (c: Chip) => void
}) {
  const principal = FAMILIES.map((f) => strongest(index, `5${f}`, 5, true)).filter((c): c is Chip => !!c)
  const rows = [...munsellRows(index), ...hslRows()]

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Equal value vs equal HSL lightness</h2>
        <p className="text-sm text-muted-foreground">
          Top row: the ten principal Munsell hues at value 5, each at the highest chroma sRGB can show. Bottom row: the same
          hue angle in HSL with S at 100% and L at 50%. Munsell value is built so these look equally light; HSL lightness is not.
          The number under each swatch is CIE L*.
        </p>
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="text-xs tabular-nums">
            <tbody>
              <tr>
                <th className="pr-3 text-left font-normal text-muted-foreground">Munsell</th>
                {principal.map((c) => (
                  <td key={c.notation} className="px-1 text-center">
                    <ChipSwatch chip={c} className="size-12" selected={selected?.notation === c.notation} onSelect={onSelect} />
                    <div>{c.notation}</div>
                    <div className="text-muted-foreground">L* {fmt(c.lab[0])}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <th className="pr-3 text-left font-normal text-muted-foreground">HSL</th>
                {principal.map((c) => {
                  const rgb = hslToRgb(c.hsl[0], 1, 0.5)
                  return (
                    <td key={c.notation} className="px-1 pt-3 text-center">
                      <div className="mx-auto size-12 rounded-[3px]" style={{ background: toHex(rgb) }} />
                      <div>hsl {Math.round(c.hsl[0])}°</div>
                      <div className="text-muted-foreground">L* {fmt(srgbLightness(rgb))}</div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">L* around the hue circle</h2>
        <p className="text-sm text-muted-foreground">
          HSL at 50% lightness swings from about 30 L* (blue) to about 97 L* (yellow). Munsell value 5 stays flat near 51
          because every chip on a value row has the same luminance Y.
        </p>
        <SeriesLineChart
          rows={rows}
          series={[MUNSELL_SERIES, HSL_SERIES]}
          xLabel="CIELAB hue angle (degrees)"
          yLabel="CIE L*"
          ariaLabel="CIE L* across hue angle for fully saturated HSL colours and Munsell value 5 chips"
          format={(r) => `${r.label} · L* ${r.y.toFixed(1)}`}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Hue rings and their lightness</h2>
        <p className="text-sm text-muted-foreground">
          Top: three hue circles. Munsell 5/6 is the ring Wikipedia shows, value 5 and chroma 6 for all 40 hues. HSL is S 100%
          L 50%. OKLCH uses N5's lightness (0.578) and chroma 0.09. Bottom: each segment replaced by the grey with the same L*.
          A ring that holds lightness constant turns into a flat grey.
        </p>
        <Rings index={index} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">The value scale</h2>
        <p className="text-sm text-muted-foreground">
          Value is close to L* / 10 because both are fitted to how we see lightness steps. HSL lightness of the same greys is
          shown for contrast; it tracks the gamma-encoded byte, not perception.
        </p>
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="text-sm tabular-nums">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pr-4 text-left font-normal">Chip</th>
                <th className="pr-4 text-right font-normal">Y</th>
                <th className="pr-4 text-right font-normal">L*</th>
                <th className="pr-4 text-right font-normal">L* / 10</th>
                <th className="pr-4 text-right font-normal">OKLCH L</th>
                <th className="pr-4 text-right font-normal">HSL L</th>
                <th className="text-left font-normal">Hex</th>
              </tr>
            </thead>
            <tbody>
              {index.neutrals.map((n) => (
                <tr key={n.value}>
                  <td className="py-0.5 pr-4">
                    <span className="flex items-center gap-2">
                      <ChipSwatch chip={n} className="size-5" selected={selected?.notation === n.notation} onSelect={onSelect} />
                      {n.notation}
                    </span>
                  </td>
                  <td className="pr-4 text-right">{fmt(n.xyY[2], 2)}</td>
                  <td className="pr-4 text-right">{fmt(n.lab[0])}</td>
                  <td className="pr-4 text-right">{fmt(n.lab[0] / 10, 2)}</td>
                  <td className="pr-4 text-right">{fmt(n.oklch[0], 3)}</td>
                  <td className="pr-4 text-right">{fmt(n.hsl[2] * 100)}%</td>
                  <td className="font-mono text-xs">{n.hex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Illuminant C vs D65</h2>
        <p className="text-sm text-muted-foreground">
          The renotation data is measured under Illuminant C. sRGB assumes D65. With a Bradford transform from C to D65 the
          greys come out R=G=B. Feed the C data straight into the sRGB matrix and they turn blue, which is the cast Werth's
          2024 version had. {index.all.filter((c) => c.inGamut).length} chips are in gamut with Bradford,{' '}
          {noAdaptation.all.filter((c) => c.inGamut).length} without.
        </p>
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="text-xs tabular-nums">
            <tbody>
              {[
                ['Bradford C to D65', index],
                ['No adaptation', noAdaptation],
              ].map(([label, idx]) => (
                <tr key={label as string}>
                  <th className="pr-3 text-left font-normal text-muted-foreground">{label as string}</th>
                  {(idx as ChipIndex).neutrals.map((n) => (
                    <td key={n.value} className="px-0.5 pb-2 text-center">
                      <div className="mx-auto h-10 w-12 rounded-[3px]" style={{ background: n.hex }} />
                      <div className="font-mono">{n.hex}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
