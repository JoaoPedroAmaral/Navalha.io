import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle, Check, X } from 'lucide-react'
import { getAppointments, updateAppointmentStatus } from '@/api/admin'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import type { AppointmentStatus } from '@/types'

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: todayAppts = [], isLoading } = useQuery({
    queryKey: ['appointments', 'today', today],
    queryFn: () => getAppointments({ date: today }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ variant: 'success', title: 'Status atualizado' })
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' })
    },
  })

  const pending = todayAppts.filter((a) => a.status === 'PENDING').length
  const confirmed = todayAppts.filter((a) => a.status === 'CONFIRMED').length
  const completed = todayAppts.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Hoje"
          value={todayAppts.length}
          icon={Calendar}
          color="bg-blue-500"
        />
        <MetricCard
          label="Pendentes"
          value={pending}
          icon={Clock}
          color="bg-yellow-500"
        />
        <MetricCard
          label="Confirmados"
          value={confirmed}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <MetricCard
          label="Concluídos"
          value={completed}
          icon={CheckCircle}
          color="bg-gold"
        />
      </div>

      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Agendamentos de hoje</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : todayAppts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum agendamento hoje</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Horário</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Barbeiro</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Serviço</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Ações rápidas</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((appt) => (
                  <tr key={appt.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-700">
                      {format(new Date(appt.scheduledAt), 'HH:mm')}
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
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Confirmar"
                            onClick={() => mutation.mutate({ id: appt.id, status: 'CONFIRMED' })}
                            loading={mutation.isPending}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Cancelar"
                            onClick={() => mutation.mutate({ id: appt.id, status: 'CANCELLED' })}
                            loading={mutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => mutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                            loading={mutation.isPending}
                          >
                            Concluir
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
    </div>
  )
}
