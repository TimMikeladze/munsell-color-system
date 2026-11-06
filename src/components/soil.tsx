import { useState } from 'react'
import { ChipSwatch } from '@/components/chip-swatch'
import type { Adaptation } from '@/lib/color'
import { hueNumber, specChip } from '@/lib/interpolate'
import type { Chip } from '@/lib/munsell'

// Hue pages and grid of the USDA-style soil book. Odd chromas and value 2.5 are not in the renotation tables.
const SOIL_HUES = ['10R', '2.5YR', '5YR', '7.5YR', '10YR', '2.5Y', '5Y']
const SOIL_VALUES = [8, 7, 6, 5, 4, 3, 2.5, 2]
const SOIL_CHROMAS = [1, 2, 3, 4, 6, 8]

export function Soil({ mode, selected, onSelect }: { mode: Adaptation; selected?: Chip; onSelect: (c: Chip) => void }) {
  const [hue, setHue] = useState('10YR')
  const h = hueNumber(hue) % 100

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          The USDA adopted Munsell notation for soil in the 1930s, and field soil books are still cut to it. A soil scientist
          holds a moist ped behind the holes in a page and reads off something like <code className="rounded bg-muted px-1">10YR 3/2</code>.
          Soil books cover the reds to yellows that soils actually come in, at low chroma.
        </p>
        <p>
          The same notation shows up elsewhere: dental shade guides for restorations, ANSI skin and hair colour in forensic
          pathology, and beer colour, where Degrees Lovibond trace back to a Munsell-based scale.
        </p>
        <p>
          The pages below rebuild the soil grid from the 1943 data. Chromas 1 and 3 and value 2.5 are not in the renotation
          tables, so those chips are interpolated. Real soil books also carry gley pages for grey-green and blue soils, left
          out here.
        </p>
      </section>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Soil hue page">
        {SOIL_HUES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === hue}
            onClick={() => setHue(s)}
            className={`rounded-md border px-3 py-1 font-mono text-sm ${s === hue ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="border-separate border-spacing-1.5 text-xs tabular-nums">
          <thead>
            <tr>
              <th className="pr-2 text-right font-normal text-muted-foreground">V \ C</th>
              {SOIL_CHROMAS.map((c) => (
                <th key={c} className="font-normal text-muted-foreground">
                  /{c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOIL_VALUES.map((v) => (
              <tr key={v}>
                <th className="pr-2 text-right font-normal text-muted-foreground">{v}</th>
                {SOIL_CHROMAS.map((c) => {
                  const chip = specChip({ hue: h, value: v, chroma: c }, mode)
                  const interpolated = c % 2 === 1 || !Number.isInteger(v)
                  return (
                    <td key={c} className="text-center">
                      {chip ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <ChipSwatch chip={chip} className="h-10 w-14 hover:scale-110" selected={selected?.notation === chip.notation} onSelect={onSelect} />
                          <span className={interpolated ? 'text-muted-foreground italic' : 'text-muted-foreground'}>
                            {hue} {v}/{c}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Italic labels are interpolated.</p>
    </div>
  )
}
