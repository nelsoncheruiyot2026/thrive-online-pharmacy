import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STEPS = ['Delivery', 'Payment', 'Review']

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, fetchCart } = useCartStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('MPESA')
  const [loading, setLoading] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    fetchCart()
    api.get('/users/addresses').then(r => {
      setAddresses(r.data.data)
      const def = r.data.data.find(a => a.isDefault)
      if (def) setSelectedAddress(def.id)
    }).catch(() => {})
  }, [fetchCart])

  const items = cart?.items || []
  const requiresPrescription = items.some(i => i.product?.requiresPrescription)
  const subtotal = parseFloat(cart?.subtotal || 0)
  const deliveryFee = subtotal >= 5000 ? 0 : 200
  const total = subtotal + deliveryFee

  const saveNewAddress = async (data) => {
    try {
      const res = await api.post('/users/addresses', { ...data, isDefault: true })
      setAddresses(prev => [...prev, res.data.data])
      setSelectedAddress(res.data.data.id)
      setShowNewAddress(false)
      toast.success('Address saved')
    } catch {
      toast.error('Failed to save address')
    }
  }

  const placeOrder = async () => {
    if (!selectedAddress && !showNewAddress) {
      toast.error('Please select or add a delivery address')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/orders', {
        addressId: selectedAddress,
        paymentMethod,
        notes: orderNotes
      })
      navigate(`/order-confirmation/${data.data.orderNumber}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (!cart || items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              i <= step ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <CheckCircleIcon className="h-5 w-5" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:inline ${i <= step ? 'text-teal-600' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-2 transition-colors ${i < step ? 'bg-teal-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 0: Delivery */}
          {step === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Delivery Address</h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                      selectedAddress === addr.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => { setSelectedAddress(addr.id); setShowNewAddress(false) }}
                        className="mt-0.5 text-teal-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{addr.label}</span>
                          {addr.isDefault && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600">{addr.street}, {addr.city}, {addr.county}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!showNewAddress ? (
                <button
                  onClick={() => { setShowNewAddress(true); setSelectedAddress(null) }}
                  className="text-sm text-teal-600 font-medium hover:text-teal-700"
                >
                  + Add new address
                </button>
              ) : (
                <form onSubmit={handleSubmit(saveNewAddress)} className="space-y-3 mt-4 border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-900 text-sm">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Label</label>
                      <input {...register('label')} defaultValue="Home" className="input-field text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">County *</label>
                      <input {...register('county', { required: true })} placeholder="e.g. Nairobi" className="input-field text-sm mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Street Address *</label>
                    <input {...register('street', { required: true })} placeholder="e.g. 123 Kenyatta Ave" className="input-field text-sm mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">City *</label>
                      <input {...register('city', { required: true })} placeholder="e.g. Nairobi" className="input-field text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Postal Code</label>
                      <input {...register('postalCode')} placeholder="e.g. 00100" className="input-field text-sm mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-2">Save Address</button>
                    <button type="button" onClick={() => setShowNewAddress(false)} className="btn-secondary text-sm py-2">Cancel</button>
                  </div>
                </form>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Order Notes (optional)</label>
                <textarea
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Special instructions for your order..."
                  rows={2}
                  className="input-field text-sm mt-1"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    if (!selectedAddress && !showNewAddress) { toast.error('Please select a delivery address'); return }
                    if (!selectedAddress) { toast.error('Save your address first'); return }
                    setStep(1)
                  }}
                  className="btn-primary"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Payment Method</h2>

              {[
                { value: 'MPESA', label: 'M-Pesa', desc: 'Pay via M-Pesa STK Push. You\'ll receive a prompt on your phone.', emoji: '📱' },
                { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay cash when your order is delivered.', emoji: '💵' },
                { value: 'CARD', label: 'Card Payment', desc: 'Pay with debit/credit card (coming soon).', emoji: '💳', disabled: true },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer mb-3 transition-colors ${
                  opt.disabled ? 'opacity-50 cursor-not-allowed border-gray-100' :
                  paymentMethod === opt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    disabled={opt.disabled}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="mt-0.5 text-teal-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="font-semibold text-sm text-gray-900">{opt.label}</span>
                      {opt.disabled && <span className="text-xs text-gray-400">(Coming soon)</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}

              {requiresPrescription && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                  <div className="flex gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800">
                      <strong>Prescription required:</strong> You'll need to upload a prescription after placing your order. Your order will be processed once the prescription is approved.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(0)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Review Your Order</h2>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.imageUrl
                        ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">💊</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      KES {(parseFloat(item.product?.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address & payment summary */}
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Delivery</p>
                  {selectedAddress && (() => {
                    const addr = addresses.find(a => a.id === selectedAddress)
                    return addr ? <p className="text-gray-600">{addr.street}, {addr.city}</p> : null
                  })()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Payment</p>
                  <p className="text-gray-600">
                    {paymentMethod === 'MPESA' ? '📱 M-Pesa' : paymentMethod === 'CARD' ? '💳 Card' : '💵 Cash on Delivery'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? <><LoadingSpinner size="sm" /><span>Placing Order...</span></> : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 h-fit sticky top-24">
          <h2 className="font-bold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Delivery</span>
              <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                {deliveryFee === 0 ? 'FREE' : `KES ${deliveryFee.toLocaleString()}`}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
