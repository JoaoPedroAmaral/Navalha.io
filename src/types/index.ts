export type Role = 'OWNER' | 'BARBER' | 'SUPER_ADMIN'

export interface User {
  sub: string
  tenantId: string
  role: Role
  jti: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  ownerEmail: string
  trialEndsAt: string
  subscriptionActive: boolean
}

export interface Barber {
  id: string
  name: string
  phone: string
  active: boolean
  services: Service[]
}

export interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
  active: boolean
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface Appointment {
  id: string
  barberId: string
  barberName?: string
  serviceId: string
  serviceName?: string
  clientId?: string
  clientName: string
  clientPhone: string
  scheduledAt: string
  endsAt: string
  status: AppointmentStatus
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface WorkSchedule {
  id?: string
  barberId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  active: boolean
}

export interface BillingStatus {
  subscriptionActive: boolean
  trialEndsAt: string | null
  mpStatus: string | null
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface BookingPayload {
  clientName: string
  clientPhone: string
  barberId: string
  serviceId: string
  scheduledAt: string
}

export interface PublicBarbershop {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  openingHours?: string | null
  operationDays?: string | null
  contactPhone?: string | null
  instagramUrl?: string | null
  mapsUrl?: string | null
}
