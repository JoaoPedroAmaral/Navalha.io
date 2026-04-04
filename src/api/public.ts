import axios from 'axios'
import type { PublicBarbershop, Service, Barber, Product, TimeSlot, BookingPayload, Appointment } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function getPublicBarbershop(slug: string): Promise<PublicBarbershop> {
  const { data } = await axios.get(`${BASE_URL}/api/public/${slug}`)
  return data
}

export async function getPublicServices(slug: string): Promise<Service[]> {
  const { data } = await axios.get(`${BASE_URL}/api/public/${slug}/services`)
  return data
}

export async function getPublicBarbers(slug: string): Promise<Barber[]> {
  const { data } = await axios.get(`${BASE_URL}/api/public/${slug}/barbers`)
  return data
}

export async function getPublicSlots(
  slug: string,
  barberId: string,
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  const { data } = await axios.get(`${BASE_URL}/api/public/${slug}/slots`, {
    params: { barberId, serviceId, date },
  })
  return data
}

export async function getPublicProducts(slug: string): Promise<Product[]> {
  const { data } = await axios.get(`${BASE_URL}/api/public/${slug}/products`)
  return data
}

export async function bookAppointment(slug: string, payload: BookingPayload): Promise<Appointment> {
  const { data } = await axios.post(`${BASE_URL}/api/public/${slug}/book`, payload)
  return data
}
