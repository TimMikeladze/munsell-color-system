import type { ReactNode } from 'react'
import { ChipSwatch } from '@/components/chip-swatch'
import { type Chip, type ChipIndex, chipKey } from '@/lib/munsell'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' as const }

// Small line drawings of each solid. Approximate shapes, not reproductions.
const SHAPES: Record<string, ReactNode> = {
  doublePyramid: (
    <>
      <path d="M40 6 L12 40 L40 74 L68 40 Z" {...S} />
      <path d="M12 40 L48 48 L68 40" {...S} />
      <path d="M40 6 L48 48 L40 74" {...S} />
    </>
  ),
  pyramid: (
    <>
      <path d="M40 8 L10 66 L52 74 L70 58 Z" {...S} />
      <path d="M40 8 L52 74" {...S} />
    </>
  ),
  sphere: (
    <>
      <circle cx="40" cy="40" r="32" {...S} />
      <ellipse cx="40" cy="40" rx="32" ry="9" {...S} />
      <line x1="40" y1="8" x2="40" y2="72" {...S} strokeDasharray="3 3" />
    </>
  ),
  hemisphere: (
    <>
      <path d="M8 52 A32 32 0 0 1 72 52" {...S} />
      <ellipse cx="40" cy="52" rx="32" ry="9" {...S} />
    </>
  ),
  cone: (
    <>
      <path d="M40 72 L8 22 M40 72 L72 22" {...S} />
      <ellipse cx="40" cy="22" rx="32" ry="9" {...S} />
    </>
  ),
  cube: (
    <>
      <path d="M40 6 L70 22 L70 56 L40 74 L10 56 L10 22 Z" {...S} />
      <path d="M10 22 L40 40 L70 22 M40 40 L40 74" {...S} />
    </>
  ),
  slantedCone: (
    <>
      <path d="M36 6 L8 44 L44 74 L72 36 Z" {...S} />
      <ellipse cx="40" cy="40" rx="33" ry="8" transform="rotate(-14 40 40)" {...S} />
    </>
  ),
}

const SOLIDS: { year: number; who: string; shape: keyof typeof SHAPES; what: string }[] = [
  { year: 1758, who: 'Tobias Mayer', shape: 'doublePyramid', what: 'Double triangular pyramid' },
  { year: 1772, who: 'Johann Heinrich Lambert', shape: 'pyramid', what: 'Triangular pyramid' },
  { year: 1810, who: 'Philipp Otto Runge', shape: 'sphere', what: 'Sphere (Farbenkugel)' },
  { year: 1839, who: 'Michel Eugène Chevreul', shape: 'hemisphere', what: 'Hemisphere' },
  { year: 1860, who: 'Hermann von Helmholtz', shape: 'cone', what: 'Cone' },
  { year: 1868, who: 'William Benson', shape: 'cube', what: 'Tilted cube' },
  { year: 1895, who: 'August Kirschmann', shape: 'slantedCone', what: 'Slanted double cone' },
]

const MUNSELL_STEPS = [
  { year: 1898, text: 'Albert H. Munsell, art teacher at the Massachusetts Normal Art School, starts on a decimal notation for colour.' },
  { year: 1905, text: 'A Color Notation. Colours placed in a sphere.' },
  { year: 1912, text: '"A Pigment Color System and Notation", presented to the American Psychological Association.' },
  { year: 1929, text: 'Munsell Book of Color, with removable pages for 40 hues.' },
  { year: 1943, text: 'Optical Society of America renotation: every chip remeasured and given xyY under Illuminant C. This app runs on that data.' },
]

/** Vertical section through 5Y (right) and 5PB (left): every real chip, with a sphere outline for scale. */
function Section({ index, selected, onSelect }: { index: ChipIndex; selected?: Chip; onSelect: (c: Chip) => void }) {
  const cell = 14
  const maxC = 22
  const pad = 20
  const width = (2 * maxC + 2) / 2 * cell + 2 * pad
  const height = 11 * cell + 2 * pad
  const cx = width / 2
  const yOf = (v: number) => pad + (10 - v) * cell
  const xOf = (c: number, side: 1 | -1) => cx + side * (c / 2) * cell
  const chips: { chip: Chip; side: 1 | -1 }[] = []
  for (const [hue, side] of [['5Y', 1], ['5PB', -1]] as const) {
    for (let v = 1; v <= 9; v++) {
      for (let c = 2; c <= maxC; c += 2) {
        const chip = index.byKey.get(chipKey(hue, v, c))
        if (chip) chips.push({ chip, side })
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[560px] text-muted-foreground" role="group" aria-label="Vertical section of the Munsell solid through 5Y and 5PB">
      <circle cx={cx} cy={yOf(5)} r={5 * cell} fill="none" stroke="currentColor" strokeDasharray="4 4" />
      <line x1={cx} y1={yOf(10)} x2={cx} y2={yOf(0)} stroke="currentColor" />
      {index.neutrals.map((n) => (
        <rect key={n.value} x={cx - cell / 2 + 1} y={yOf(n.value) - cell / 2 + 1} width={cell - 2} height={cell - 2} rx={2} fill={n.hex} />
      ))}
      {chips.map(({ chip, side }) => {
        const isSel = selected?.notation === chip.notation
        return (
          <rect
            key={chip.notation}
            x={xOf(chip.chroma, side) - cell / 2 + 1}
            y={yOf(chip.value) - cell / 2 + 1}
            width={cell - 2}
            height={cell - 2}
            rx={2}
            fill={chip.hex}
            stroke={isSel ? 'var(--foreground)' : chip.inGamut ? 'none' : 'currentColor'}
            strokeDasharray={chip.inGamut || isSel ? undefined : '2 2'}
            strokeWidth={isSel ? 2 : 1}
            className="cursor-pointer"
            onClick={() => onSelect(chip)}
          >
            <title>
              {chip.notation}
              {chip.inGamut ? '' : ' (outside sRGB)'}
            </title>
          </rect>
        )
      })}
      <text x={pad} y={pad - 6} className="fill-current text-[10px]">5PB</text>
      <text x={width - pad} y={pad - 6} textAnchor="end" className="fill-current text-[10px]">5Y</text>
    </svg>
  )
}

export function History({ index, selected, onSelect }: { index: ChipIndex; selected?: Chip; onSelect: (c: Chip) => void }) {
  const peakY = index.all.filter((c) => c.hue === '5Y').reduce((a, c) => (c.chroma > a.chroma ? c : a))
  const peakPB = index.all.filter((c) => c.hue === '5PB').reduce((a, c) => (c.chroma > a.chroma ? c : a))
  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Colour solids before Munsell</h2>
        <p className="text-sm text-muted-foreground">
          People had been arranging colours in 3D for 150 years. Every one of these picked a regular shape first and fitted
          colours to it; none came from measuring how people see colour differences.
        </p>
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {SOLIDS.map((s) => (
            <li key={s.year} className="flex flex-col items-center gap-1 text-center">
              <svg viewBox="0 0 80 80" className="size-16 text-foreground" aria-hidden>
                {SHAPES[s.shape]}
              </svg>
              <span className="text-sm font-medium tabular-nums">{s.year}</span>
              <span className="text-xs">{s.who}</span>
              <span className="text-xs text-muted-foreground">{s.what}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Munsell's system</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {MUNSELL_STEPS.map((m) => (
            <li key={m.year} className="grid grid-cols-[3.5rem_1fr] gap-2">
              <span className="font-medium tabular-nums">{m.year}</span>
              <span className="text-muted-foreground">{m.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Sphere vs measured solid</h2>
        <p className="text-sm text-muted-foreground">
          A vertical cut through 5PB (left) and 5Y (right), every renotation chip, with a sphere of radius 5 values drawn
          dashed for scale. Yellow keeps getting stronger toward the top and peaks at {peakY.notation}; purple-blue peaks low at{' '}
          {peakPB.notation}. Munsell found the same thing and gave up the sphere: equal visual steps don't fit a regular shape.
          Dashed chips are outside sRGB, including Wikipedia's example of bright yellow the screen can't show.
        </p>
        <Section index={index} selected={selected} onSelect={onSelect} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ChipSwatch chip={peakY} className="size-5" selected={selected?.notation === peakY.notation} onSelect={onSelect} />
          {peakY.notation}
          <ChipSwatch chip={peakPB} className="ml-4 size-5" selected={selected?.notation === peakPB.notation} onSelect={onSelect} />
          {peakPB.notation}
        </div>
      </section>
    </div>
  )
}
