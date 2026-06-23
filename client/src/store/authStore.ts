import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  gender: 'male' | 'female'
  starBalance: number
  totalStars: number
  totalScore: number
  ladderScore: number
  ladderSolved: number
  avatarFrame: string | null
  classId: number
  skin: {
    face: string
    hair: string
    coat: string
  }
}

interface AuthStore {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'codequest-auth'
    }
  )
)
