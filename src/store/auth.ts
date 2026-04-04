import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  familyId: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  setFamilyId: (id: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      familyId: null,

      login: async (email, password) => {
        const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
        localStorage.setItem('token', res.token)
        set({ user: res.user, token: res.token })
        const { families } = await api.get<{ families: { id: string }[] }>('/families/mine')
        if (families?.length) set({ familyId: families[0].id })
      },

      register: async (email, name, password) => {
        const res = await api.post<{ token: string; user: User }>('/auth/register', { email, name, password })
        localStorage.setItem('token', res.token)
        set({ user: res.user, token: res.token })
        const { families } = await api.get<{ families: { id: string }[] }>('/families/mine')
        if (families?.length) set({ familyId: families[0].id })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, familyId: null })
      },

      setFamilyId: (id) => set({ familyId: id }),
    }),
    {
      name: 'nestory-auth',
      partialize: (s) => ({ user: s.user, token: s.token, familyId: s.familyId }),
    }
  )
)
