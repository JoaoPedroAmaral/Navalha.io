import * as React from 'react'
import {
  startOfMonth,
  getDaysInMonth,
  getDay,
  format,
  parseISO,
  isToday,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './popover'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecionar data',
  className,
}: DatePickerProps) {
  const today = new Date()

  const parsedValue = value ? parseISO(value) : null

  const [viewYear, setViewYear] = React.useState(
    parsedValue ? parsedValue.getFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    parsedValue ? parsedValue.getMonth() : today.getMonth()
  )
  const [open, setOpen] = React.useState(false)

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function handleSelectDay(day: number) {
    const selected = new Date(viewYear, viewMonth, day)
    onChange(format(selected, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const firstDayOfMonth = startOfMonth(new Date(viewYear, viewMonth))
  const totalDays = getDaysInMonth(firstDayOfMonth)
  const startWeekday = getDay(firstDayOfMonth)

  const monthLabel = format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy', {
    locale: ptBR,
  })

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-[160px] items-center gap-2 rounded-md border border-[var(--tenant-secondary)]/30 bg-white px-3 text-sm text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-[var(--tenant-secondary)] focus:ring-offset-2',
            className
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
          {parsedValue ? (
            <span>{format(parsedValue, 'dd/MM/yyyy')}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto">
        <div className="p-3 space-y-2">
          {/* Month navigation header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--tenant-text-on-primary)] hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.10)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold capitalize text-[var(--tenant-text-on-primary)]">
              {monthLabel}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--tenant-text-on-primary)] hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.10)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 gap-0.5">
            {dayLabels.map((label) => (
              <div
                key={label}
                className="flex h-8 w-8 items-center justify-center text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.50)]"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="h-8 w-8" />
              }

              const cellDate = new Date(viewYear, viewMonth, day)
              const isSelected = parsedValue ? isSameDay(cellDate, parsedValue) : false
              const isTodayDate = isToday(cellDate)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm text-[var(--tenant-text-on-primary)] transition-colors',
                    isSelected
                      ? 'bg-[var(--tenant-secondary)] text-white hover:bg-[var(--tenant-secondary)]'
                      : 'hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.10)]',
                    !isSelected && isTodayDate && 'ring-1 ring-[var(--tenant-secondary)]/50'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
