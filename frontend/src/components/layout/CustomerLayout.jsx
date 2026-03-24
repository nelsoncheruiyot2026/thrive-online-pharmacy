import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useEffect } from 'react'

export default function CustomerLayout() {
  const { user } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user, fetchCart])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
