import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, Calendar, Clock, User, Scissors, UserPlus } from 'lucide-react'
import { bookAppointment } from '@/api/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Simulated known customers for the selector demo.
// In production this would come from an API query.
const KNOWN_CUSTOMERS = [
  { id: '1', name: 'Carlos Souza', phone: '11987654321' },
  { id: '2', name: 'Rafael Lima', phone: '11912345678' },
  { id: '3', name: 'Pedro Alves', phone: '11955554444' },
]

const NEW_CUSTOMER_VALUE = '__new__'

const clientSchema = z.object({
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(8, 'Telefone obrigatório'),
  clientBirthdate: z.string().optional(),
})
type ClientForm = z.infer<typeof clientSchema>

// ---------------------------------------------------------------------------
// BirthdatePicker — three-select day/month/year, writes "yyyy-MM-dd" string
// ---------------------------------------------------------------------------

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i)

interface BirthdatePickerProps {
  value: string
  onChange: (value: string) => void
}

function BirthdatePicker({ value, onChange }: BirthdatePickerProps) {
  const parts = value ? value.split('-') : ['', '', '']
  const year = parts[0] ?? ''
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''

  function buildValue(y: string, m: string, d: string): string {
    if (!y || !m || !d) return ''
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const daysInMonth = year && month
    ? getDaysInMonth(new Date(Number(year), Number(month) - 1))
    : 31

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function handleYear(y: string) {
    const clampedDay = day && Number(day) > getDaysInMonth(new Date(Number(y), Number(month) - 1))
      ? '1'
      : day
    onChange(buildValue(y, month, clampedDay))
  }

  function handleMonth(m: string) {
    const clampedDay = day && Number(day) > getDaysInMonth(new Date(Number(year), Number(m) - 1))
      ? '1'
      : day
    onChange(buildValue(year, m, clampedDay))
  }

  function handleDay(d: string) {
    onChange(buildValue(year, month, d))
  }

  const selectTriggerClass =
    'h-10 border-gray-200 bg-white text-gray-900 text-sm focus:ring-[var(--tenant-secondary)] focus:border-[var(--tenant-secondary)]'

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={day} onValueChange={handleDay}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder="Dia" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>
              {String(d).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={handleMonth}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year} onValueChange={handleYear}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function StepClientInfo({ slug, booking, onSuccess, onBack }: Props) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const isNewCustomer = selectedCustomerId === NEW_CUSTOMER_VALUE || selectedCustomerId === ''

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) })

  function handleCustomerSelect(value: string) {
    setSelectedCustomerId(value)
    if (value === NEW_CUSTOMER_VALUE || value === '') {
      setValue('clientName', '')
      setValue('clientPhone', '')
      setValue('clientBirthdate', '')
      return
    }
    const customer = KNOWN_CUSTOMERS.find((c) => c.id === value)
    if (customer) {
      setValue('clientName', customer.name, { shouldValidate: true })
      setValue('clientPhone', customer.phone, { shouldValidate: true })
      setValue('clientBirthdate', '')
    }
  }

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
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-tenant-secondary shrink-0 mt-0.5" />
            <span className="break-words">
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
        {/* Customer selector */}
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cliente existente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_CUSTOMER_VALUE}>
                <span className="flex items-center gap-2 text-tenant-secondary font-semibold">
                  <UserPlus className="w-3.5 h-3.5" />
                  Novo cliente
                </span>
              </SelectItem>
              {KNOWN_CUSTOMERS.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Name and phone — always visible, pre-filled when existing customer selected */}
        <div className="space-y-1.5">
          <Label htmlFor="clientName">Nome</Label>
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

        {/* Birthdate — shown only for new customers */}
        {isNewCustomer && (
          <div className="space-y-1.5">
            <Label>
              Data de nascimento{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Controller
              control={control}
              name="clientBirthdate"
              render={({ field }) => (
                <BirthdatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        <Button type="submit" variant="gold" className="w-full" loading={isSubmitting} size="lg">
          Confirmar agendamento
        </Button>
      </form>
    </div>
  )
}
