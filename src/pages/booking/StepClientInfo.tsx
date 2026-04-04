import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, Calendar, Clock, User, Scissors } from 'lucide-react'
import { bookAppointment } from '@/api/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import type { BookingState } from './BookingPage'
import type { Appointment } from '@/types'

interface BookingFilled {
  service: NonNullable<BookingState['service']>
  barber: NonNullable<BookingState['barber']>
  scheduledAt: NonNullable<BookingState['scheduledAt']>
  appointment: Appointment | null
}

interface Props {
  slug: string
  booking: BookingFilled
  onSuccess: (appointment: Appointment) => void
  onBack: () => void
}

const clientSchema = z.object({
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(8, 'Telefone obrigatório'),
})
type ClientForm = z.infer<typeof clientSchema>

export default function StepClientInfo({ slug, booking, onSuccess, onBack }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) })

  async function onSubmit(data: ClientForm) {
    try {
      const appointment = await bookAppointment(slug, {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        barberId: booking.barber.id,
        serviceId: booking.service.id,
        scheduledAt: booking.scheduledAt,
      })
      onSuccess(appointment)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao realizar agendamento',
        description: 'Tente novamente ou escolha outro horário.',
      })
    }
  }

  const scheduledDate = new Date(booking.scheduledAt)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Confirmar agendamento</h2>
          <p className="text-sm text-gray-500">Preencha seus dados</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <p className="font-semibold text-gray-900 text-sm">Resumo</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Scissors className="w-4 h-4 text-tenant-secondary shrink-0" />
            <span>
              <strong>{booking.service.name}</strong> — {formatCurrency(booking.service.price)} |{' '}
              {booking.service.durationMinutes} min
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <User className="w-4 h-4 text-tenant-secondary shrink-0" />
            <span>{booking.barber.name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-tenant-secondary shrink-0" />
            <span>
              {format(scheduledDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-tenant-secondary shrink-0" />
            <span>{format(scheduledDate, 'HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="clientName">Seu nome</Label>
          <Input id="clientName" placeholder="João da Silva" {...register('clientName')} />
          {errors.clientName && (
            <p className="text-xs text-destructive">{errors.clientName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clientPhone">WhatsApp / Telefone</Label>
          <Controller
            control={control}
            name="clientPhone"
            render={({ field }) => (
              <PhoneInput
                id="clientPhone"
                placeholder="(11) 99999-9999"
                value={field.value ?? ''}
                onChange={field.onChange}
                name={field.name}
              />
            )}
          />
          {errors.clientPhone && (
            <p className="text-xs text-destructive">{errors.clientPhone.message}</p>
          )}
        </div>

        <Button type="submit" variant="gold" className="w-full" loading={isSubmitting} size="lg">
          Confirmar agendamento
        </Button>
      </form>
    </div>
  )
}
