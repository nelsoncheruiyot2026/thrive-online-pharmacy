import { Link, useNavigate } from 'react-router-dom'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingCartIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, loading, updateQuantity, removeItem } = useCartStore()
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your cart</h2>
        <p className="text-gray-500 mb-6">Please sign in to add items to your cart and checkout.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
        <p className="mt-3 text-sm text-gray-500">
          New here? <Link to="/register" className="text-teal-600 font-medium">Create account</Link>
        </p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner className="py-24" />

  const items = cart?.items || []
  const requiresPrescription = items.some(item => item.product?.requiresPrescription)
  const subtotal = parseFloat(cart?.subtotal || 0)
  const deliveryFee = subtotal >= 5000 ? 0 : 200
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our products and add items to your cart.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {requiresPrescription && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Prescription Required</p>
                <p className="text-sm text-orange-700">Your cart contains prescription medications. You'll need to upload a valid prescription during checkout.</p>
              </div>
            </div>
          )}

          {items.map(item => {
            const product = item.product
            if (!product) return null
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
                {/* Image */}
                <Link to={`/products/${product.slug}`} className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">💊</div>
                  }
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/products/${product.slug}`} className="font-semibold text-gray-900 hover:text-teal-600 text-sm line-clamp-2">
                        {product.name}
                      </Link>
                      {product.requiresPrescription && (
                        <span className="text-xs text-orange-600 font-medium">Rx Required</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-50 transition-colors"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= product.stock}
                        className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="font-bold text-gray-900">
                      KES {(parseFloat(product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart?.itemCount || 0} items)</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `KES ${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              {subtotal < 5000 && (
                <p className="text-xs text-gray-400">
                  Add KES {(5000 - subtotal).toLocaleString()} more for free delivery
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-4 py-3"
            >
              Proceed to Checkout
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            <Link to="/products" className="block text-center text-sm text-teal-600 hover:text-teal-700 mt-3">
              Continue Shopping
            </Link>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">🔒 Secure checkout · M-Pesa accepted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
