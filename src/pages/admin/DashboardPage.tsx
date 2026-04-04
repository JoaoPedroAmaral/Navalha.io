import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle, Check, X, TrendingUp } from 'lucide-react'
import { getAppointments, updateAppointmentStatus } from '@/api/admin'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import type { AppointmentStatus } from '@/types'

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
  borderClass,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  borderClass: string
}) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderClass} shadow-sm p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">{label}</p>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
          <TrendingUp className="w-3.5 h-3.5" />
          Hoje
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Total hoje"
          value={todayAppts.length}
          icon={Calendar}
          colorClass="bg-blue-500"
          borderClass="border-blue-400"
        />
        <MetricCard
          label="Pendentes"
          value={pending}
          icon={Clock}
          colorClass="bg-amber-500"
          borderClass="border-amber-400"
        />
        <MetricCard
          label="Confirmados"
          value={confirmed}
          icon={CheckCircle}
          colorClass="bg-emerald-500"
          borderClass="border-emerald-400"
        />
        <MetricCard
          label="Concluídos"
          value={completed}
          icon={CheckCircle}
          colorClass="bg-tenant-secondary"
          borderClass="border-amber-600"
        />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50/80 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Agendamentos de hoje</h2>
          {!isLoading && todayAppts.length > 0 && (
            <span className="text-xs text-gray-500">{todayAppts.length} agendamento{todayAppts.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse sm:px-5">
                <div className="w-10 sm:w-12 h-4 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 sm:w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-20 sm:w-24 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-16 sm:w-20 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhum agendamento hoje</p>
            <p className="text-gray-300 text-sm mt-1">A agenda está livre</p>
          </div>
        ) : (
          <div className="table-scroll-mobile">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Horário</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Barbeiro</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Serviço</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((appt) => (
                  <tr key={appt.id} className="border-b last:border-0 md:hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-mono text-xs sm:text-sm font-semibold text-gray-700" data-label="Horário">
                      {format(new Date(appt.scheduledAt), 'HH:mm')}
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5" data-label="Cliente">
                      <p className="font-semibold text-gray-900 text-sm">{appt.clientName}</p>
                      <p className="text-gray-400 text-xs">{appt.clientPhone}</p>
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm" data-label="Barbeiro">
                      {appt.barberName ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 hidden md:table-cell text-gray-600 text-sm" data-label="Serviço">
                      {appt.serviceName ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5" data-label="Status">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5" data-label="Ações">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Confirmar"
                            onClick={() => mutation.mutate({ id: appt.id, status: 'CONFIRMED' })}
                            loading={mutation.isPending}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
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
                            className="text-red-500 border-red-200 hover:bg-red-50"
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
