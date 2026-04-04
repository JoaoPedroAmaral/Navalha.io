import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, Calendar, Clock, User, Scissors, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Appointment, Service, Barber } from '@/types'

interface Props {
  appointment: Appointment
  service: Service
  barber: Barber
  scheduledAt: string
  shopName: string
  onNewBooking: () => void
}

export default function StepSuccess({
  service,
  barber,
  scheduledAt,
  shopName,
  onNewBooking,
}: Readonly<Props>) {
  const scheduledDate = new Date(scheduledAt)

  return (
    <div className="space-y-6 text-center">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendamento confirmado!</h2>
          <p className="text-gray-500 mt-1">Até breve em {shopName}</p>
        </div>
      </div>

      {/* Appointment details */}
      <div className="bg-white rounded-xl border p-5 text-left space-y-3">
        <p className="font-semibold text-gray-900 text-sm text-center mb-4">
          Detalhes do agendamento
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Scissors className="w-4 h-4 text-tenant-secondary shrink-0" />
          <span className="font-medium text-gray-900">{service.name}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <User className="w-4 h-4 text-tenant-secondary shrink-0" />
          <span>Com <strong>{barber.name}</strong></span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-tenant-secondary shrink-0" />
          <span>
            {format(scheduledDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-tenant-secondary shrink-0" />
          <span>{format(scheduledDate, 'HH:mm')}</span>
        </div>

      </div>

      {/* CTA */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Anote o horário e apareça na barbearia alguns minutos antes.
        </p>
        
        <Button
          variant="gold"
          className="w-full"
          size="lg"
          onClick={onNewBooking}
        >
          <Plus className="w-4 h-4" />
          Fazer outro agendamento
        </Button>
      </div>
    </div>
  )
}
