import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,

  initAuth: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      try {
        set({ token, user: JSON.parse(user) })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken } = data.data

      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      set({ user, token: accessToken, loading: false })
      return { success: true, user }
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (userData) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', userData)
      const { user, accessToken, refreshToken } = data.data

      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      set({ user, token: accessToken, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData }
    localStorage.setItem('user', JSON.stringify(updated))
    set({ user: updated })
  },

  isAdmin: () => {
    const { user } = get()
    return user?.role === 'ADMIN' || user?.role === 'PHARMACIST'
  }
}))
