import axios from 'axios'
import type { AuthTokens } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await axios.post(`${BASE_URL}/api/auth/login`, { email, password })
  return data
}

export async function logout(): Promise<void> {
  const { api } = await import('./axios')
  await api.post('/api/auth/logout')
}
