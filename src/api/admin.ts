import { api } from './axios'
import type {
  Appointment,
  AppointmentStatus,
  Barber,
  Product,
  Service,
  WorkSchedule,
  BillingStatus,
} from '@/types'

// Appointments
export async function getAppointments(params?: {
  date?: string
  status?: AppointmentStatus
}): Promise<Appointment[]> {
  const { data } = await api.get('/api/admin/appointments', { params })
  return data
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const { data } = await api.put(`/api/admin/appointments/${id}`, { status })
  return data
}

export async function createAppointment(payload: {
  barberId: string
  serviceId: string
  clientName: string
  clientPhone: string
  scheduledAt: string
}): Promise<Appointment> {
  const { data } = await api.post('/api/admin/appointments', payload)
  return data
}

// Barbers
export async function getBarbers(): Promise<Barber[]> {
  const { data } = await api.get('/api/admin/barbers')
  return data
}

export async function createBarber(payload: { name: string; phone: string }): Promise<Barber> {
  const { data } = await api.post('/api/admin/barbers', payload)
  return data
}

export async function updateBarber(
  id: string,
  payload: { name: string; phone: string; serviceIds: string[] }
): Promise<Barber> {
  const { data } = await api.put(`/api/admin/barbers/${id}`, payload)
  return data
}

export async function deleteBarber(id: string): Promise<void> {
  await api.delete(`/api/admin/barbers/${id}`)
}

// Services
export async function getServices(): Promise<Service[]> {
  const { data } = await api.get('/api/admin/services')
  return data
}

export async function createService(payload: {
  name: string
  durationMinutes: number
  price: number
}): Promise<Service> {
  const { data } = await api.post('/api/admin/services', payload)
  return data
}

export async function updateService(
  id: string,
  payload: Partial<{ name: string; durationMinutes: number; price: number; active: boolean }>
): Promise<Service> {
  const { data } = await api.put(`/api/admin/services/${id}`, payload)
  return data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/api/admin/services/${id}`)
}

// Products
export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get('/api/admin/products')
  return data
}

export async function createProduct(payload: {
  name: string
  price: number
  description?: string
}): Promise<Product> {
  const { data } = await api.post('/api/admin/products', payload)
  return data
}

export async function updateProduct(
  id: string,
  payload: Partial<{ name: string; price: number; description: string; active: boolean }>
): Promise<Product> {
  const { data } = await api.put(`/api/admin/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/api/admin/products/${id}`)
}

// Schedule
export async function getSchedule(barberId: string): Promise<WorkSchedule[]> {
  const { data } = await api.get(`/api/admin/schedule/${barberId}`)
  return data
}

export async function saveSchedule(
  barberId: string,
  schedule: WorkSchedule[]
): Promise<WorkSchedule[]> {
  const { data } = await api.put(`/api/admin/schedule/${barberId}`, schedule)
  return data
}

// Branding
export interface BrandingData {
  name?: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  openingHours?: string | null
  operationDays?: string | null
  contactPhone?: string | null
  instagramUrl?: string | null
  mapsUrl?: string | null
}

export async function getAdminBranding(): Promise<BrandingData> {
  const { data } = await api.get('/api/admin/branding')
  return data
}

export async function updateBranding(payload: {
  name?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  openingHours?: string
  operationDays?: string
  contactPhone?: string
  instagramUrl?: string
  mapsUrl?: string
}): Promise<void> {
  await api.patch('/api/admin/branding', payload)
}

// Billing
export async function getBilling(): Promise<BillingStatus> {
  const { data } = await api.get('/api/admin/billing')
  return data
}

export async function createCheckout(): Promise<{ checkoutUrl: string }> {
  const { data } = await api.post('/api/admin/billing/checkout')
  return data
}

export async function cancelSubscription(): Promise<void> {
  await api.delete('/api/admin/billing/subscription')
}
