import { useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { type Chip, type ChipIndex, hueAngle } from '@/lib/munsell'

// One value step is drawn as two chroma steps, close to Munsell's own ratio for equal visual distance.
const VALUE_SCALE = 2

interface Projected {
  chip: Chip
  sx: number
  sy: number
  r: number
  depth: number
}

export function Solid3D({
  index,
  showOutOfGamut,
  selected,
  onSelect,
}: {
  index: ChipIndex
  showOutOfGamut: boolean
  selected?: Chip
  onSelect: (c: Chip) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const projected = useRef<Projected[]>([])
  // Turned so the cut-away quarter faces the viewer.
  const [yaw, setYaw] = useState(160)
  const [pitch, setPitch] = useState(22)
  const [cutaway, setCutaway] = useState(true)
  const [ceiling, setCeiling] = useState(9)
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null)

  const chips = index.all.filter(
    (c) =>
      (showOutOfGamut || c.inGamut) &&
      c.value <= ceiling &&
      // Cut out the quarter between 5Y and 5G (looking at the viewer by default), like the 1943 solid figure.
      !(cutaway && c.hue !== 'N' && hueAngle(c.hue) >= 72 && hueAngle(c.hue) < 162),
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const maxC = Math.max(...index.all.filter((c) => showOutOfGamut || c.inGamut).map((c) => c.chroma))
    const extent = Math.max(maxC * 0.8, 6 * VALUE_SCALE)
    const scale = Math.min(w, h) / (2 * extent)
    const cy = Math.cos((yaw * Math.PI) / 180)
    const sy = Math.sin((yaw * Math.PI) / 180)
    const cp = Math.cos((pitch * Math.PI) / 180)
    const sp = Math.sin((pitch * Math.PI) / 180)
    const camera = extent * 4

    const project = (x: number, y: number, z: number) => {
      const x1 = x * cy - z * sy
      const z1 = x * sy + z * cy
      const y2 = y * cp - z1 * sp
      const z2 = y * sp + z1 * cp
      const f = camera / (camera + z2)
      return { sx: w / 2 + x1 * scale * f, sy: h / 2 - y2 * scale * f, depth: z2, f }
    }

    const style = getComputedStyle(canvas)
    const fg = style.getPropertyValue('color') || '#888'

    // Neutral axis from value 0 to 10.
    const a = project(0, -5 * VALUE_SCALE, 0)
    const b = project(0, 5 * VALUE_SCALE, 0)
    ctx.strokeStyle = fg
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.stroke()
    ctx.globalAlpha = 1

    const pts: Projected[] = chips.map((chip) => {
      const ang = chip.hue === 'N' ? 0 : (hueAngle(chip.hue) * Math.PI) / 180
      const x = chip.chroma * Math.cos(ang)
      const z = chip.chroma * Math.sin(ang)
      const y = (chip.value - 5) * VALUE_SCALE
      const p = project(x, y, z)
      return { chip, sx: p.sx, sy: p.sy, r: Math.max(1.5, 0.7 * scale * p.f), depth: p.depth }
    })
    pts.sort((p, q) => q.depth - p.depth)
    for (const p of pts) {
      ctx.beginPath()
      ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.chip.hex
      ctx.fill()
      if (!p.chip.inGamut) {
        ctx.setLineDash([2, 2])
        ctx.strokeStyle = fg
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])
      }
      if (selected && p.chip.notation === selected.notation) {
        ctx.lineWidth = 2.5
        ctx.strokeStyle = fg
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, p.r + 3, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    projected.current = pts

    ctx.fillStyle = fg
    ctx.font = '11px ui-sans-serif, system-ui'
    for (const v of [1, 5, 9]) {
      const p = project(0, (v - 5) * VALUE_SCALE, 0)
      ctx.fillText(`${v}`, p.sx + 6, p.sy)
    }
  })

  const pick = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Front-most chip under the pointer: last drawn wins.
    for (let i = projected.current.length - 1; i >= 0; i--) {
      const p = projected.current[i]
      if (Math.hypot(p.sx - x, p.sy - y) <= p.r + 1) return onSelect(p.chip)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-prose text-sm text-muted-foreground">
        The 1943 renotation solid. Value runs up the grey axis, hue around it, chroma outward. Drag to rotate, click a chip to
        inspect it. The shape is lopsided because each hue reaches its strongest chroma at a different value: yellow high up,
        purple-blue low down. Munsell's 1905 sphere could not hold that.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Switch id="cut" checked={cutaway} onCheckedChange={setCutaway} />
          <Label htmlFor="cut">Cut away Y to G quarter</Label>
        </div>
        <div className="flex w-72 items-center gap-3">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Up to value {ceiling}</span>
          <Slider min={1} max={9} step={1} value={[ceiling]} onValueChange={([v]) => setCeiling(v)} aria-label="Highest value shown" />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{chips.length} chips</span>
      </div>
      <canvas
        ref={canvasRef}
        className="aspect-square w-full max-w-[640px] cursor-grab touch-none text-foreground active:cursor-grabbing"
        role="img"
        aria-label="Rotatable 3D view of the Munsell colour solid"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
          setYaw(d.yaw + dx * 0.5)
          setPitch(Math.max(-89, Math.min(89, d.pitch + dy * 0.4)))
        }}
        onPointerUp={(e) => {
          if (drag.current && !drag.current.moved) pick(e)
          drag.current = null
        }}
      />
    </div>
  )
}
