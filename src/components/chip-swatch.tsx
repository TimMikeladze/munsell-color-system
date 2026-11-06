import type { Chip } from '@/lib/munsell'
import { cn } from '@/lib/utils'

// Out-of-gamut chips render clipped to sRGB with a hatch so they never pass for accurate colour.
const HATCH = 'repeating-linear-gradient(135deg, rgba(255,255,255,.55) 0 2px, transparent 2px 6px)'

export function ChipSwatch({
  chip,
  selected,
  onSelect,
  className,
}: {
  chip: Chip
  selected?: boolean
  onSelect?: (chip: Chip) => void
  className?: string
}) {
  return (
    <button
      type="button"
      title={`${chip.notation}${chip.inGamut ? '' : ' (outside sRGB)'}`}
      aria-label={chip.notation}
      aria-pressed={selected}
      onClick={() => onSelect?.(chip)}
      className={cn(
        'size-7 rounded-[3px] outline-offset-2 transition-transform hover:z-10 hover:scale-125 focus-visible:outline-2 focus-visible:outline-ring',
        selected && 'z-10 scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background',
        className,
      )}
      style={{ background: chip.inGamut ? chip.hex : `${HATCH}, ${chip.hex}` }}
    />
  )
}
