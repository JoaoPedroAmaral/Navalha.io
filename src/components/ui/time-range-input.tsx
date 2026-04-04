import * as React from 'react'
import { cn } from '@/lib/utils'

function parseTimeRange(value: string): { start: string; end: string } {
  const match = value.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/)
  if (match) return { start: match[1], end: match[2] }
  return { start: '', end: '' }
}

export type TimeRangeInputProps = {
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
}

const TimeRangeInput = React.forwardRef<HTMLDivElement, TimeRangeInputProps>(
  ({ value = '', onChange, className, disabled }, ref) => {
    const parsed = parseTimeRange(value)
    const [start, setStart] = React.useState(parsed.start)
    const [end, setEnd] = React.useState(parsed.end)

    // Sync internal state when parent value changes (e.g. hydration from API)
    React.useEffect(() => {
      const { start: s, end: e } = parseTimeRange(value)
      setStart(s)
      setEnd(e)
    }, [value])

    function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
      const next = e.target.value
      setStart(next)
      onChange?.(next && end ? `${next} - ${end}` : '')
    }

    function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
      const next = e.target.value
      setEnd(next)
      onChange?.(start && next ? `${start} - ${next}` : '')
    }

    const inputClass = cn(
      'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <input
          type="time"
          value={start}
          onChange={handleStartChange}
          disabled={disabled}
          className={inputClass}
        />
        <span className="text-sm text-muted-foreground shrink-0">—</span>
        <input
          type="time"
          value={end}
          onChange={handleEndChange}
          disabled={disabled}
          className={inputClass}
        />
      </div>
    )
  }
)
TimeRangeInput.displayName = 'TimeRangeInput'

export { TimeRangeInput }
