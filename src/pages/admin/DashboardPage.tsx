import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  CheckCircle,
  Check,
  X,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { formatPhoneDisplay } from "@/components/ui/phone-input";
import { getAppointments, updateAppointmentStatus } from "@/api/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import type { AppointmentStatus } from "@/types";

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={`
        relative rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0 overflow-hidden
        transition-all duration-200
        ${accent
          ? 'bg-tenant-secondary text-white shadow-tenant-glow'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
        }
      `}
    >
      <div
        className={`
          w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0
          ${accent ? 'bg-white/20' : 'bg-tenant-secondary/10'}
        `}
      >
        <Icon className={`w-5 h-5 ${accent ? 'text-white' : 'text-tenant-secondary'}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl sm:text-3xl font-bold leading-none tabular-nums ${accent ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        <p className={`text-xs mt-1.5 uppercase tracking-wide font-semibold truncate ${accent ? 'text-white/70' : 'text-gray-400'}`}>
          {label}
        </p>
      </div>
      {accent && (
        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayAppts = [], isLoading } = useQuery({
    queryKey: ["appointments", "today", today],
    queryFn: ({ signal }) => getAppointments({ date: today }, signal),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ variant: "success", title: "Status atualizado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    },
  });

  const pending = todayAppts.filter((a) => a.status === "PENDING").length;
  const confirmed = todayAppts.filter((a) => a.status === "CONFIRMED").length;
  const completed = todayAppts.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-sm capitalize truncate mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          Hoje
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total hoje"
          value={todayAppts.length}
          icon={BarChart2}
        />
        <MetricCard
          label="Pendentes"
          value={pending}
          icon={Clock}
        />
        <MetricCard
          label="Confirmados"
          value={confirmed}
          icon={Calendar}
        />
        <MetricCard
          label="Concluídos"
          value={completed}
          icon={CheckCircle}
          accent
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/60">
          <h2 className="font-semibold text-gray-900 text-sm">Agendamentos de hoje</h2>
          {!isLoading && todayAppts.length > 0 && (
            <span className="text-xs text-gray-400 font-medium bg-white border border-gray-100 px-2.5 py-1 rounded-full">
              {todayAppts.length} {todayAppts.length !== 1 ? "agendamentos" : "agendamento"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="px-4 py-3.5 flex items-center gap-4 animate-pulse sm:px-5"
              >
                <div className="w-10 sm:w-12 h-4 bg-gray-100 rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 sm:w-32 h-4 bg-gray-100 rounded-md" />
                  <div className="w-20 sm:w-24 h-3 bg-gray-50 rounded-md" />
                </div>
                <div className="w-16 sm:w-20 h-6 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum agendamento hoje</p>
            <p className="text-gray-300 text-sm mt-1">A agenda está livre</p>
          </div>
        ) : (
          <div className="table-scroll-mobile">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">
                    Funcionario
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">
                    Serviço
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-3 py-2.5 sm:px-5 sm:py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {todayAppts.map((appt) => (
                  <tr
                    key={appt.id}
                    className="md:hover:bg-gray-50/50 transition-colors duration-100"
                  >
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5 font-mono text-xs sm:text-sm font-semibold text-gray-600 tabular-nums"
                      data-label="Horário"
                    >
                      {format(new Date(appt.scheduledAt), "HH:mm")}
                    </td>
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5"
                      data-label="Cliente"
                    >
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {appt.clientName}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 font-medium">
                        {formatPhoneDisplay(appt.clientPhone)}
                      </p>
                    </td>
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm"
                      data-label="Funcionario"
                    >
                      {appt.barberName ?? "—"}
                    </td>
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5 hidden md:table-cell text-gray-600 text-sm"
                      data-label="Serviço"
                    >
                      {appt.serviceName ?? "—"}
                    </td>
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5"
                      data-label="Status"
                    >
                      <StatusBadge status={appt.status} />
                    </td>
                    <td
                      className="px-3 py-3 sm:px-5 sm:py-3.5"
                      data-label="Ações"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Confirmar"
                            onClick={() =>
                              mutation.mutate({ id: appt.id, status: "CONFIRMED" })
                            }
                            loading={mutation.isPending}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Cancelar"
                            onClick={() =>
                              mutation.mutate({ id: appt.id, status: "CANCELLED" })
                            }
                            loading={mutation.isPending}
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {appt.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() =>
                              mutation.mutate({ id: appt.id, status: "COMPLETED" })
                            }
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
  );
}
