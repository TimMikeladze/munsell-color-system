import { useState } from 'react'
import { ChipSwatch } from '@/components/chip-swatch'
import { Label } from '@/components/ui/label'
import { type Adaptation, decodeSrgb, hexToRgb, linearSrgbToXYZ } from '@/lib/color'
import { hueName, nearestMunsell, parseMunsell, specChip } from '@/lib/interpolate'
import { type Chip, FAMILIES } from '@/lib/munsell'

const EXAMPLES = ['5P 5/10', '2.8Y 6.95/2.3', '8.7GY 6/5', '10YR 3/1', 'N 5/', '5Y 8.5/14']

function HueStrip({ mode, onSelect }: { mode: Adaptation; onSelect: (c: Chip) => void }) {
  const cells = Array.from({ length: 100 }, (_, i) => specChip({ hue: i + 1, value: 6, chroma: 6 }, mode))
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[repeat(100,minmax(0,1fr))]">
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            className="h-10"
            title={c?.notation}
            aria-label={c?.notation ?? `hue ${i + 1}`}
            style={{ background: c?.hex ?? 'transparent' }}
            onClick={() => c && onSelect(c)}
          />
        ))}
      </div>
      <div className="grid grid-cols-10 text-[10px] text-muted-foreground">
        {FAMILIES.map((f, i) => (
          <div key={f} className="flex justify-between border-l border-border px-0.5">
            <span>{i * 10}</span>
            <span className="font-medium text-foreground">{f}</span>
            <span />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Notation({ mode, selected, onSelect }: { mode: Adaptation; selected?: Chip; onSelect: (c: Chip) => void }) {
  const [text, setText] = useState('2.8Y 6.95/2.3')
  const [hex, setHex] = useState('#c06030')

  const spec = parseMunsell(text)
  const chip = spec ? specChip(spec, mode) : null
  const nearest = nearestMunsell(linearSrgbToXYZ(decodeSrgb(hexToRgb(hex))), mode)
  const nearestChip = specChip(nearest.spec, mode)

  let error = ''
  if (!spec) error = 'Not a notation. Try 5R 4/14, 2.8Y 6.95/2.3 or N 5/.'
  else if (!chip) error = 'Outside the renotation data: no real surface colour at that hue, value and chroma.'

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Decode a notation</h2>
        <p className="text-sm text-muted-foreground">
          Hue, value, chroma: <code className="rounded bg-muted px-1">H V/C</code>. Any decimal works, as long as it sits
          inside the measured chips. Off-grid notations are interpolated from the nearest renotation chips: radially in hue
          around the grey axis, linearly in chroma, and in luminance between values.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="spec">Notation</Label>
            <input
              id="spec"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="h-9 w-48 rounded-md border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {EXAMPLES.map((e) => (
              <button key={e} type="button" onClick={() => setText(e)} className="rounded-md border px-2 py-1 font-mono text-xs hover:bg-muted">
                {e}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <p className="text-sm">{error}</p>
        ) : (
          chip &&
          spec && (
            <div className="flex flex-wrap items-center gap-4">
              <ChipSwatch chip={chip} className="size-20 hover:scale-105" selected={selected?.notation === chip.notation} onSelect={onSelect} />
              <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">Hue</dt>
                <dd>
                  {spec.chroma < 0.05 ? 'neutral' : `${hueName(spec.hue)}, hue number ${spec.hue.toFixed(1)} of 100`}
                </dd>
                <dt className="text-muted-foreground">Value</dt>
                <dd>{spec.value}, Y {chip.xyY[2].toFixed(2)}</dd>
                <dt className="text-muted-foreground">Chroma</dt>
                <dd>{spec.chroma}</dd>
                <dt className="text-muted-foreground">xy (C)</dt>
                <dd>
                  {chip.xyY[0].toFixed(4)}, {chip.xyY[1].toFixed(4)}
                </dd>
                <dt className="text-muted-foreground">sRGB</dt>
                <dd>
                  <span className="font-mono">{chip.hex}</span> {chip.inGamut ? '' : '(outside sRGB, clipped)'}
                </dd>
              </dl>
            </div>
          )
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Find the notation for any colour</h2>
        <p className="text-sm text-muted-foreground">
          Picks the closest renotation chip in OKLab, then nudges hue, value and chroma until the interpolated colour stops
          getting closer. ΔE is OKLab distance x 100; under 1 is invisible side by side.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="pick">Colour</Label>
            <div className="flex items-center gap-2">
              <input id="pick" type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border bg-transparent" />
              <input
                aria-label="Hex"
                value={hex}
                onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && setHex(e.target.value.toLowerCase())}
                className="h-9 w-28 rounded-md border bg-background px-2 font-mono text-sm"
              />
            </div>
          </div>
          <span className="text-muted-foreground">&rarr;</span>
          {nearestChip && (
            <div className="flex items-center gap-3">
              <div className="flex overflow-hidden rounded-md border">
                <div className="size-16" style={{ background: hex }} title="Input" />
                <div className="size-16" style={{ background: nearestChip.hex }} title="Munsell" />
              </div>
              <div className="flex flex-col">
                <button type="button" className="text-left text-xl font-medium underline-offset-4 hover:underline" onClick={() => onSelect(nearestChip)}>
                  {nearest.notation}
                </button>
                <span className="text-sm tabular-nums text-muted-foreground">ΔE {nearest.deltaE.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">The 100-step hue circle</h2>
        <p className="text-sm text-muted-foreground">
          Ten families, five principal (R, Y, G, B, P) and five in between (YR, GY, BG, PB, RP). Munsell picked five instead
          of three primaries or four unique hues so the circle would divide by ten. Each family splits into steps 1 to 10, so
          hue number = family x 10 + step and 10RP closes the circle at 100. Book pages only use 2.5, 5, 7.5, 10. The strip is
          all 100 integer hues at 6/6, interpolated.
        </p>
        <HueStrip mode={mode} onSelect={onSelect} />
      </section>
    </div>
  )
}
