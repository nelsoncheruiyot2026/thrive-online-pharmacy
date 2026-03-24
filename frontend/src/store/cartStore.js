import { create } from 'zustand'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true })
      const { data } = await api.get('/cart')
      set({ cart: data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      await api.post('/cart/items', { productId, quantity })
      await get().fetchCart()
      toast.success('Added to cart!')
      return true
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add to cart'
      toast.error(message)
      return false
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity })
      await get().fetchCart()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart')
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`)
      await get().fetchCart()
      toast.success('Item removed')
    } catch {
      toast.error('Failed to remove item')
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart')
      set({ cart: null })
    } catch {
      toast.error('Failed to clear cart')
    }
  },

  getItemCount: () => {
    const { cart } = get()
    return cart?.itemCount || 0
  },

  getSubtotal: () => {
    const { cart } = get()
    return cart?.subtotal || '0.00'
  }
}))
