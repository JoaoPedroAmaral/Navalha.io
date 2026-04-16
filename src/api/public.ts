import axios from 'axios'
import type { PublicBarbershop, Service, Barber, Product, TimeSlot, BookingPayload, Appointment } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const publicApi = axios.create({ baseURL: BASE_URL })

export async function getPublicBarbershop(slug: string, signal?: AbortSignal): Promise<PublicBarbershop> {
  const { data } = await publicApi.get(`/api/public/${slug}`, { signal })
  return data
}

export async function getPublicServices(slug: string, signal?: AbortSignal): Promise<Service[]> {
  const { data } = await publicApi.get(`/api/public/${slug}/services`, { signal })
  return data
}

export async function getPublicBarbers(slug: string, signal?: AbortSignal): Promise<Barber[]> {
  const { data } = await publicApi.get(`/api/public/${slug}/barbers`, { signal })
  return data
}

export async function getPublicSlots(
  slug: string,
  barberId: string,
  serviceId: string,
  date: string,
  signal?: AbortSignal,
): Promise<TimeSlot[]> {
  const { data } = await publicApi.get(`/api/public/${slug}/slots`, {
    params: { barberId, serviceId, date },
    signal,
  })
  return data
}

export async function getPublicProducts(slug: string, signal?: AbortSignal): Promise<Product[]> {
  const { data } = await publicApi.get(`/api/public/${slug}/products`, { signal })
  return data
}

export async function bookAppointment(slug: string, payload: BookingPayload): Promise<Appointment> {
  const { data } = await publicApi.post(`/api/public/${slug}/book`, payload)
  return data
}
