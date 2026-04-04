import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  addDays,
  startOfDay,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPublicSlots } from '@/api/public'
import { Button } from '@/components/ui/button'
import type { Service, Barber } from '@/types'

interface Props {
  slug: string
  service: Service
  barber: Barber
  onSelect: (scheduledAt: string) => void
  onBack: () => void
}

function generateDays(count = 14): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(startOfDay(new Date()), i))
}

export default function StepSelectDateTime({ slug, service, barber, onSelect, onBack }: Props) {
  const days = generateDays(14)
  const [selectedDate, setSelectedDate] = useState<Date>(days[0])
  const [weekOffset, setWeekOffset] = useState(0)

  const visibleDays = days.slice(weekOffset * 7, weekOffset * 7 + 7)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['public-slots', slug, barber.id, service.id, dateStr],
    queryFn: () => getPublicSlots(slug, barber.id, service.id, dateStr),
  })

  const availableSlots = slots.filter((s) => s.available)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Escolha a data e horário</h2>
          <p className="text-sm text-gray-500">
            {service.name} com <strong>{barber.name}</strong>
          </p>
        </div>
      </div>

      {/* Date picker */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900 text-sm">
            {format(visibleDays[0], "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={weekOffset >= 1}
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {visibleDays.map((day) => (
            <div key={`label-${day.toISOString()}`} className="text-center text-xs text-gray-400 py-1">
              {format(day, 'EEEEE', { locale: ptBR })}
            </div>
          ))}
          {visibleDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
                  isSelected
                    ? 'bg-tenant-secondary text-white'
                    : isToday
                    ? 'border-2 border-tenant-secondary text-tenant-secondary'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="bg-white rounded-xl border p-4">
        <p className="font-semibold text-gray-900 text-sm mb-3">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            Nenhum horário disponível neste dia
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availableSlots.map((slot) => {
              const timeNormalized = slot.time.split(':').length === 2 ? `${slot.time}:00` : slot.time
              const scheduledAt = `${dateStr}T${timeNormalized}`
              return (
                <button
                  key={slot.time}
                  onClick={() => onSelect(scheduledAt)}
                  className="py-2.5 px-1 rounded-lg border-2 border-transparent bg-gray-50 hover:border-tenant-secondary hover:bg-gray-100 text-sm font-medium text-gray-700 transition-all text-center min-h-[44px]"
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
