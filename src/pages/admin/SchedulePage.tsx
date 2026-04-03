import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBarbers, getSchedule, saveSchedule } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import type { DayOfWeek, WorkSchedule } from '@/types'

const DAYS: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'MONDAY', label: 'Segunda-feira' },
  { key: 'TUESDAY', label: 'Terça-feira' },
  { key: 'WEDNESDAY', label: 'Quarta-feira' },
  { key: 'THURSDAY', label: 'Quinta-feira' },
  { key: 'FRIDAY', label: 'Sexta-feira' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
]

function defaultSchedule(barberId: string): WorkSchedule[] {
  return DAYS.map((d) => ({
    barberId,
    dayOfWeek: d.key,
    startTime: '09:00',
    endTime: '18:00',
    active: d.key !== 'SUNDAY',
  }))
}

export default function SchedulePage() {
  const qc = useQueryClient()
  const [selectedBarberId, setSelectedBarberId] = useState('')
  // localEdits stores only the user-modified rows keyed by dayOfWeek
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<WorkSchedule>>>({})

  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: getBarbers,
  })

  const { data: fetchedSchedule, isLoading } = useQuery({
    queryKey: ['schedule', selectedBarberId],
    queryFn: () => getSchedule(selectedBarberId),
    enabled: !!selectedBarberId,
  })

  // Derived: base schedule from server or defaults, then apply local edits
  const schedule = useMemo<WorkSchedule[]>(() => {
    const base =
      fetchedSchedule && fetchedSchedule.length > 0
        ? fetchedSchedule
        : selectedBarberId
        ? defaultSchedule(selectedBarberId)
        : []
    return base.map((row) => ({
      ...row,
      ...(localEdits[row.dayOfWeek] ?? {}),
    }))
  }, [fetchedSchedule, selectedBarberId, localEdits])

  function handleBarberChange(barberId: string) {
    setSelectedBarberId(barberId)
    setLocalEdits({})
  }

  const saveMutation = useMutation({
    mutationFn: () => saveSchedule(selectedBarberId, schedule),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['schedule', selectedBarberId] })
      setLocalEdits({})
      toast({ variant: 'success', title: 'Agenda salva com sucesso' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar agenda' }),
  })

  function updateDay(dayKey: DayOfWeek, field: keyof WorkSchedule, value: unknown) {
    setLocalEdits((prev) => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] ?? {}), [field]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurar Agenda</h1>

      <div className="max-w-xs">
        <Select
          value={selectedBarberId}
          onValueChange={handleBarberChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar barbeiro" />
          </SelectTrigger>
          <SelectContent>
            {barbers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedBarberId ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Selecione um barbeiro para configurar a agenda
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b">
            <p className="font-semibold text-gray-900">Horários semanais</p>
            <p className="text-sm text-gray-500">Configure os dias e horários de atendimento</p>
          </div>
          <div className="divide-y">
            {DAYS.map((day) => {
              const row = schedule.find((r) => r.dayOfWeek === day.key)
              if (!row) return null
              return (
                <div
                  key={day.key}
                  className={`flex flex-wrap items-center gap-4 px-5 py-4 ${
                    !row.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-40 shrink-0">
                    <Checkbox
                      checked={row.active}
                      onCheckedChange={(checked) =>
                        updateDay(day.key, 'active', checked === true)
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={row.startTime}
                      disabled={!row.active}
                      onChange={(e) => updateDay(day.key, 'startTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-gray-400 text-sm">até</span>
                    <Input
                      type="time"
                      value={row.endTime}
                      disabled={!row.active}
                      onChange={(e) => updateDay(day.key, 'endTime', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-5 py-4 border-t flex justify-end">
            <Button
              variant="gold"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Salvar agenda
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
