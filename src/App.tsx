import { useMemo, useState } from 'react'
import { Compare } from '@/components/compare'
import { History } from '@/components/history'
import { HuePage } from '@/components/hue-page'
import { Inspector } from '@/components/inspector'
import { Limits } from '@/components/limits'
import { Notation } from '@/components/notation'
import { Notes } from '@/components/notes'
import { Soil } from '@/components/soil'
import { Solid3D } from '@/components/solid-3d'
import { ValueSlice } from '@/components/value-slice'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Adaptation } from '@/lib/color'
import { parseMunsell, specChip } from '@/lib/interpolate'
import { buildChips, chipKey, indexChips, type Chip } from '@/lib/munsell'

const TABS = [
  ['hue', 'Hue page'],
  ['value', 'Value slice'],
  ['solid', 'Solid'],
  ['limits', 'Limits'],
  ['notation', 'Notation'],
  ['compare', 'Compare'],
  ['soil', 'Soil & uses'],
  ['history', 'History'],
  ['notes', 'Notes'],
] as const

export default function App() {
  const bradford = useMemo(() => indexChips(buildChips('bradford')), [])
  const none = useMemo(() => indexChips(buildChips('none')), [])
  const [mode, setMode] = useState<Adaptation>('bradford')
  const [showOutOfGamut, setShowOutOfGamut] = useState(false)
  const [hue, setHue] = useState('5R')
  const [value, setValue] = useState(5)
  // Selection is kept as a notation so it survives switching the adaptation and works for interpolated chips.
  const [selectedNotation, setSelectedNotation] = useState('5R 4/14')

  const index = mode === 'bradford' ? bradford : none
  const selected = resolve(selectedNotation)
  const select = (c: Chip) => setSelectedNotation(c.notation)

  function resolve(notation: string): Chip | undefined {
    const spec = parseMunsell(notation)
    if (!spec) return undefined
    const m = /^(\S+)\s+([\d.]+)\/([\d.]*)$/.exec(notation)
    const onGrid = m && index.byKey.get(chipKey(m[1], Number(m[2]), Number(m[3] || 0)))
    return onGrid || specChip(spec, mode) || undefined
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Munsell study</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            The 1943 renotation chips converted to sRGB, based on{' '}
            <a className="underline" href="https://www.andrewwerth.com/aboutmunsell/">
              Andrew Werth's virtual Munsell wheel
            </a>{' '}
            and the{' '}
            <a className="underline" href="https://en.wikipedia.org/wiki/Munsell_color_system">
              Wikipedia article
            </a>
            , lined up against HSL, CIELAB and OKLCH.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch id="adapt" checked={mode === 'bradford'} onCheckedChange={(on) => setMode(on ? 'bradford' : 'none')} />
            <Label htmlFor="adapt">Adapt Illuminant C to D65</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="oog" checked={showOutOfGamut} onCheckedChange={setShowOutOfGamut} />
            <Label htmlFor="oog">Show out of gamut</Label>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <Tabs defaultValue="hue" className="min-w-0 flex-1">
          <TabsList className="h-auto flex-wrap justify-start">
            {TABS.map(([id, label]) => (
              <TabsTrigger key={id} value={id} className="flex-none">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="hue" className="pt-4">
            <HuePage index={index} hue={hue} onHue={setHue} showOutOfGamut={showOutOfGamut} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="value" className="pt-4">
            <ValueSlice index={index} value={value} onValue={setValue} showOutOfGamut={showOutOfGamut} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="solid" className="pt-4">
            <Solid3D index={index} showOutOfGamut={showOutOfGamut} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="limits" className="pt-4">
            <Limits index={index} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="notation" className="pt-4">
            <Notation mode={mode} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="compare" className="pt-4">
            <Compare index={bradford} noAdaptation={none} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="soil" className="pt-4">
            <Soil mode={mode} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="history" className="pt-4">
            <History index={index} selected={selected} onSelect={select} />
          </TabsContent>
          <TabsContent value="notes" className="pt-4">
            <Notes />
          </TabsContent>
        </Tabs>

        <aside className="rounded-lg border bg-card p-4 xl:sticky xl:top-6 xl:w-80 xl:shrink-0" aria-label="Selected chip">
          <Inspector chip={selected} />
        </aside>
      </div>
    </div>
  )
}
