import { Badge } from '@/components/ui/badge'
import type { AppointmentStatus } from '@/types'

const labels: Record<AppointmentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

const variants: Record<AppointmentStatus, 'pending' | 'confirmed' | 'cancelled' | 'completed'> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
