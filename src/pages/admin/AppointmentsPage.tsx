import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Check, X as XIcon, CheckCircle, Calendar } from "lucide-react";
import { formatPhoneDisplay } from "@/components/ui/phone-input";
import {
  getAppointments,
  updateAppointmentStatus,
  createAppointment,
  getBarbers,
  getServices,
} from "@/api/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/useToast";
import { DatePicker } from "@/components/ui/date-picker";
import type { AppointmentStatus } from "@/types";

// ─── Time/date select helpers ────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

function buildYears() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1].map(String);
}

function parseDateParts(date: string): [string, string, string] {
  const [y = "", m = "", d = ""] = date.split("-");
  return [y, m, d];
}

function buildDate(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

interface DateSelectProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: boolean;
}

function DateSelect({ value, onChange, placeholder }: DateSelectProps) {
  const [year, month, day] = parseDateParts(value);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => buildYears(), []);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [year, month]);

  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  const setDay = (d: string) => onChange(buildDate(year || String(currentYear), month || "01", d));
  const setMonth = (m: string) => onChange(buildDate(year || String(currentYear), m, day || "01"));
  const setYear = (y: string) => onChange(buildDate(y, month || "01", day || "01"));

  return (
    <div className="flex items-center gap-1">
      <Select value={day} onValueChange={setDay}>
        <SelectTrigger className="w-[68px]">
          <SelectValue placeholder={placeholder ? "Dia" : undefined} />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[72px]">
          <SelectValue placeholder={placeholder ? "Mês" : undefined} />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder={placeholder ? "Ano" : undefined} />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
}

function TimeSelect({ value, onChange }: TimeSelectProps) {
  const parts = value.split(":");
  const hour = parts[0] || "";
  const minute = parts[1] || "";
  return (
    <div className="flex items-center gap-1">
      <Select value={hour} onValueChange={(h) => onChange(`${h}:${minute}`)}>
        <SelectTrigger className="w-[72px]">
          <SelectValue placeholder="Hora" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}h
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-gray-400 text-xs font-semibold">:</span>
      <Select value={minute} onValueChange={(m) => onChange(`${hour}:${m}`)}>
        <SelectTrigger className="w-[68px]">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}min
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const apptSchema = z.object({
  barberId: z.string().min(1, "Selecione um Funcionario"),
  serviceId: z.string().min(1, "Selecione um serviço"),
  clientName: z.string().min(2, "Nome obrigatório"),
  clientPhone: z.string().min(8, "Telefone obrigatório"),
  scheduledDate: z.string().min(1, "Data obrigatória"),
  scheduledTime: z.string().min(1, "Horário obrigatório"),
});
type ApptForm = z.infer<typeof apptSchema>;

const STATUS_OPTIONS: Array<{ value: AppointmentStatus | ""; label: string }> =
  [
    { value: "", label: "Todos" },
    { value: "PENDING", label: "Pendente" },
    { value: "CONFIRMED", label: "Confirmado" },
    { value: "CANCELLED", label: "Cancelado" },
    { value: "COMPLETED", label: "Concluído" },
  ];

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", dateFilter, statusFilter],
    queryFn: ({ signal }) =>
      getAppointments(
        { date: dateFilter || undefined, status: (statusFilter as AppointmentStatus) || undefined },
        signal,
      ),
    placeholderData: (prev) => prev,
  });

  const { data: barbers = [] } = useQuery({
    queryKey: ["barbers"],
    queryFn: ({ signal }) => getBarbers(signal),
    staleTime: 1000 * 60 * 5,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => getServices(signal),
    staleTime: 1000 * 60 * 5,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ variant: "success", title: "Status atualizado" });
    },
    onError: () =>
      toast({ variant: "destructive", title: "Erro ao atualizar" }),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApptForm>({ resolver: zodResolver(apptSchema) });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ variant: "success", title: "Agendamento criado" });
      setDialogOpen(false);
      reset();
    },
    onError: () =>
      toast({ variant: "destructive", title: "Erro ao criar agendamento" }),
  });

  async function onSubmit(data: ApptForm) {
    const scheduledAt = `${data.scheduledDate}T${data.scheduledTime}:00`;
    await createMutation.mutateAsync({
      barberId: data.barberId,
      serviceId: data.serviceId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      scheduledAt,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <Button
          variant="gold"
          onClick={() => setDialogOpen(true)}
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo agendamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker
          value={dateFilter}
          onChange={setDateFilter}
          placeholder="Filtrar por data"
        />
        <Select
          value={statusFilter === "" ? "__all__" : statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v === "__all__" ? "" : (v as AppointmentStatus))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value === "" ? "__all__" : opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(dateFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter("");
              setStatusFilter("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center gap-4 animate-pulse sm:px-5"
              >
                <div className="w-12 sm:w-16 h-4 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 sm:w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-20 sm:w-24 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-16 sm:w-20 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              Nenhum agendamento encontrado
            </p>
            <p className="text-gray-300 text-sm mt-1">Tente mudar os filtros</p>
          </div>
        ) : (
          <div className="table-scroll-mobile">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Data/Hora
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                    Funcionario
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">
                    Serviço
                  </th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Ações rápidas
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b last:border-0 md:hover:bg-gray-50/60 transition-colors"
                  >
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-mono text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap"
                      data-label="Data/Hora"
                    >
                      {format(new Date(appt.scheduledAt), "dd/MM HH:mm")}
                    </td>
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3.5"
                      data-label="Cliente"
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {appt.clientName}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatPhoneDisplay(appt.clientPhone)}
                      </p>
                    </td>
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm"
                      data-label="Funcionario"
                    >
                      {appt.barberName ?? "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3.5 hidden md:table-cell text-gray-600 text-sm"
                      data-label="Serviço"
                    >
                      {appt.serviceName ?? "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3.5"
                      data-label="Status"
                    >
                      <StatusBadge status={appt.status} />
                    </td>
                    <td
                      className="px-3 py-2.5 sm:px-5 sm:py-3"
                      data-label="Ações"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {appt.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              statusMutation.mutate({
                                id: appt.id,
                                status: "CONFIRMED",
                              })
                            }
                            title="Confirmar"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {appt.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() =>
                              statusMutation.mutate({
                                id: appt.id,
                                status: "COMPLETED",
                              })
                            }
                            title="Marcar como concluído"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Concluir</span>
                          </Button>
                        )}
                        {(appt.status === "PENDING" ||
                          appt.status === "CONFIRMED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              statusMutation.mutate({
                                id: appt.id,
                                status: "CANCELLED",
                              })
                            }
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
              <Label>Funcionario</Label>
              <Controller
                control={control}
                name="barberId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar Funcionario" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers
                        .filter((b) => b.active)
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.barberId && (
                <p className="text-xs text-destructive">
                  {errors.barberId.message}
                </p>
              )}
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
                      {services
                        .filter((s) => s.active)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceId && (
                <p className="text-xs text-destructive">
                  {errors.serviceId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do cliente</Label>
                <Input placeholder="João Silva" {...register("clientName")} />
                {errors.clientName && (
                  <p className="text-xs text-destructive">
                    {errors.clientName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Controller
                  control={control}
                  name="clientPhone"
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="(11) 99999-9999"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      name={field.name}
                    />
                  )}
                />
                {errors.clientPhone && (
                  <p className="text-xs text-destructive">
                    {errors.clientPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Controller
                  control={control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <DateSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder
                    />
                  )}
                />
                {errors.scheduledDate && (
                  <p className="text-xs text-destructive">
                    {errors.scheduledDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Horário</Label>
                <Controller
                  control={control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <TimeSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.scheduledTime && (
                  <p className="text-xs text-destructive">
                    {errors.scheduledTime.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
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
  );
}
