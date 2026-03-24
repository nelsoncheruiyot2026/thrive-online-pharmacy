import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

// Layouts
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import ProductsPage from './pages/customer/ProductsPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import LoginPage from './pages/customer/LoginPage'
import RegisterPage from './pages/customer/RegisterPage'
import ProfilePage from './pages/customer/ProfilePage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPrescriptions from './pages/admin/AdminPrescriptions'
import AdminCustomers from './pages/admin/AdminCustomers'
import POSTerminal from './pages/admin/POSTerminal'
import POSSales from './pages/admin/POSSales'

// Auth stores
import { useAuthStore } from './store/authStore'

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role === 'CUSTOMER') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <Routes>
      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected customer routes */}
        <Route path="/checkout" element={
          <ProtectedRoute><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/order-confirmation/:orderNumber" element={
          <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/orders/:orderNumber" element={
          <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="prescriptions" element={<AdminPrescriptions />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="pos" element={<POSTerminal />} />
        <Route path="pos/sales" element={<POSSales />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-teal-600">404</h1>
            <p className="text-xl text-gray-600 mt-2">Page not found</p>
            <a href="/" className="mt-4 inline-block btn-primary">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App
