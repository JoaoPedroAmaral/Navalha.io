import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { decodeJwt } from '@/lib/jwt'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => {
        const user = decodeJwt(accessToken)
        set({ accessToken, refreshToken, user })
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null })
      },
    }),
    {
      name: 'barbearia-auth',
    }
  )
)
