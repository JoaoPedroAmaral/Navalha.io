import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicBarbershop } from '@/api/public'
import { applyTenantTheme, resetTenantTheme } from '@/lib/applyTenantTheme'
import { Scissors } from 'lucide-react'
import StepSelectService from './StepSelectService'
import StepSelectBarber from './StepSelectBarber'
import StepSelectDateTime from './StepSelectDateTime'
import StepClientInfo from './StepClientInfo'
import StepSuccess from './StepSuccess'
import type { Service, Barber, Appointment } from '@/types'

export type BookingState = {
  service: Service | null
  barber: Barber | null
  scheduledAt: string | null
  appointment: Appointment | null
}

const STEPS = ['Serviço', 'Barbeiro', 'Data & Hora', 'Confirmação', 'Sucesso']

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    barber: null,
    scheduledAt: null,
    appointment: null,
  })

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => getPublicBarbershop(slug!),
    enabled: !!slug,
  })

  useEffect(() => {
    if (shop) applyTenantTheme(shop.primaryColor, shop.secondaryColor)
    return () => resetTenantTheme()
  }, [shop])

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Link inválido
      </div>
    )
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-tenant-primary flex items-center justify-center mx-auto">
            <Scissors className="w-6 h-6 text-tenant-secondary animate-pulse" />
          </div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-tenant-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          {shop?.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-tenant-secondary flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">{shop?.name ?? 'Barbearia'}</h1>
            <p className="text-xs text-white/60">Agendamento online</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-1">
              {STEPS.slice(0, 4).map((label, idx) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        idx < step
                          ? 'bg-green-500 text-white'
                          : idx === step
                          ? 'bg-tenant-secondary text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {idx < step ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-xs hidden sm:block font-medium ${
                        idx === step ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-px mx-2 ${idx < step ? 'bg-green-400' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 0 && (
          <StepSelectService
            slug={slug}
            onSelect={(service) => {
              setBooking((prev) => ({ ...prev, service, barber: null, scheduledAt: null }))
              setStep(1)
            }}
          />
        )}
        {step === 1 && booking.service && (
          <StepSelectBarber
            slug={slug}
            selectedService={booking.service}
            onSelect={(barber) => {
              setBooking((prev) => ({ ...prev, barber, scheduledAt: null }))
              setStep(2)
            }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && booking.service && booking.barber && (
          <StepSelectDateTime
            slug={slug}
            service={booking.service}
            barber={booking.barber}
            onSelect={(scheduledAt) => {
              setBooking((prev) => ({ ...prev, scheduledAt }))
              setStep(3)
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && booking.service && booking.barber && booking.scheduledAt && (
          <StepClientInfo
            slug={slug}
            booking={{
              service: booking.service,
              barber: booking.barber,
              scheduledAt: booking.scheduledAt,
              appointment: booking.appointment,
            }}
            onSuccess={(appointment) => {
              setBooking((prev) => ({ ...prev, appointment }))
              setStep(4)
            }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && booking.appointment && booking.service && booking.barber && booking.scheduledAt && (
          <StepSuccess
            appointment={booking.appointment}
            service={booking.service}
            barber={booking.barber}
            scheduledAt={booking.scheduledAt}
            shopName={shop?.name ?? 'Barbearia'}
            onNewBooking={() => {
              setStep(0)
              setBooking({ service: null, barber: null, scheduledAt: null, appointment: null })
            }}
          />
        )}
      </div>
    </div>
  )
}
