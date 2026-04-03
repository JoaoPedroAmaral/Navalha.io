import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Plus, Check, X as XIcon, CheckCircle } from 'lucide-react'
import {
  getAppointments,
  updateAppointmentStatus,
  createAppointment,
  getBarbers,
  getServices,
} from '@/api/admin'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import type { AppointmentStatus } from '@/types'

const apptSchema = z.object({
  barberId: z.string().min(1, 'Selecione um barbeiro'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(8, 'Telefone obrigatório'),
  scheduledDate: z.string().min(1, 'Data obrigatória'),
  scheduledTime: z.string().min(1, 'Horário obrigatório'),
})
type ApptForm = z.infer<typeof apptSchema>

const STATUS_OPTIONS: Array<{ value: AppointmentStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'COMPLETED', label: 'Concluído' },
]

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateFilter, statusFilter],
    queryFn: () =>
      getAppointments({
        date: dateFilter || undefined,
        status: (statusFilter as AppointmentStatus) || undefined,
      }),
  })

  const { data: barbers = [] } = useQuery({ queryKey: ['barbers'], queryFn: getBarbers })
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: getServices })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ variant: 'success', title: 'Status atualizado' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao atualizar' }),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApptForm>({ resolver: zodResolver(apptSchema) })

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ variant: 'success', title: 'Agendamento criado' })
      setDialogOpen(false)
      reset()
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao criar agendamento' }),
  })

  async function onSubmit(data: ApptForm) {
    const scheduledAt = `${data.scheduledDate}T${data.scheduledTime}:00`
    await createMutation.mutateAsync({
      barberId: data.barberId,
      serviceId: data.serviceId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      scheduledAt,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <Button variant="gold" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo agendamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(dateFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter('')
              setStatusFilter('')
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum agendamento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Data/Hora</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Barbeiro</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Serviço</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Ações rápidas</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {format(new Date(appt.scheduledAt), 'dd/MM HH:mm')}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{appt.clientName}</p>
                      <p className="text-gray-400 text-xs">{appt.clientPhone}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-gray-600">
                      {appt.barberName ?? '—'}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-600">
                      {appt.serviceName ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {appt.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMutation.mutate({ id: appt.id, status: 'CONFIRMED' })}
                            title="Confirmar"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => statusMutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                            title="Concluir"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMutation.mutate({ id: appt.id, status: 'CANCELLED' })}
                            title="Cancelar"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Barbeiro</Label>
              <Controller
                control={control}
                name="barberId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar barbeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers.filter((b) => b.active).map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.barberId && <p className="text-xs text-destructive">{errors.barberId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Controller
                control={control}
                name="serviceId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter((s) => s.active).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do cliente</Label>
                <Input placeholder="João Silva" {...register('clientName')} />
                {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Controller
                  control={control}
                  name="clientPhone"
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="(11) 99999-9999"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      name={field.name}
                    />
                  )}
                />
                {errors.clientPhone && <p className="text-xs text-destructive">{errors.clientPhone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" {...register('scheduledDate')} />
                {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Horário</Label>
                <Input type="time" {...register('scheduledTime')} />
                {errors.scheduledTime && <p className="text-xs text-destructive">{errors.scheduledTime.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="gold" loading={isSubmitting}>
                Criar agendamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
