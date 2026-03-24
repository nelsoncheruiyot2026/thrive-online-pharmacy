import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [uploadingRx, setUploadingRx] = useState(false)
  const fileInputRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    api.get(`/orders/${orderNumber}`)
      .then(r => setOrder(r.data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
    return () => clearInterval(pollRef.current)
  }, [orderNumber])

  const initiateMpesa = async () => {
    if (!mpesaPhone.match(/^(07|01)\d{8}$/)) {
      toast.error('Enter a valid Kenyan phone number (07XXXXXXXX)')
      return
    }
    setPaying(true)
    try {
      const { data } = await api.post('/payments/mpesa/initiate', {
        orderId: order.id,
        phone: mpesaPhone
      })
      setCheckoutId(data.data.checkoutRequestId)
      toast.success('STK Push sent! Enter your M-Pesa PIN.')
      // Poll for payment status
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/payments/mpesa/status/${data.data.checkoutRequestId}`)
          setPaymentStatus(res.data.data.status)
          if (res.data.data.status === 'COMPLETED') {
            clearInterval(pollRef.current)
            setOrder(prev => ({ ...prev, status: 'PAYMENT_CONFIRMED' }))
            toast.success('Payment successful! 🎉')
          } else if (res.data.data.status === 'FAILED') {
            clearInterval(pollRef.current)
            toast.error('Payment failed. Please try again.')
          }
        } catch { clearInterval(pollRef.current) }
      }, 5000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed')
    } finally {
      setPaying(false)
    }
  }

  const uploadPrescription = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingRx(true)
    try {
      const formData = new FormData()
      formData.append('prescription', file)
      await api.post(`/prescriptions/orders/${order.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Prescription uploaded! Our pharmacist will review it shortly.')
      setOrder(prev => ({ ...prev, status: 'PENDING_PRESCRIPTION' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingRx(false)
    }
  }

  if (loading) return <PageLoader />
  if (!order) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Order not found</p>
      <Link to="/orders" className="mt-4 inline-block btn-primary">My Orders</Link>
    </div>
  )

  const total = parseFloat(order.total)
  const requiresPrescription = order.status === 'PENDING_PRESCRIPTION'
  const needsPayment = ['PENDING_PAYMENT', 'PRESCRIPTION_APPROVED'].includes(order.status)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-500 mt-1">Order #{order.orderNumber}</p>
        <div className="mt-2"><OrderStatusBadge status={order.status} /></div>
      </div>

      {/* Prescription Upload */}
      {requiresPrescription && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
          <div className="flex gap-3 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Upload Your Prescription</p>
              <p className="text-sm text-orange-700 mt-0.5">
                Your order contains prescription medication. Please upload a valid doctor's prescription to proceed.
              </p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={uploadPrescription} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingRx}
            className="btn-primary flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {uploadingRx ? 'Uploading...' : 'Upload Prescription'}
          </button>
          <p className="text-xs text-orange-600 mt-2">Accepted formats: JPG, PNG, PDF · Max 5MB</p>
        </div>
      )}

      {/* M-Pesa Payment */}
      {needsPayment && order.paymentMethod === 'MPESA' && paymentStatus !== 'COMPLETED' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>📱</span> Complete Payment via M-Pesa
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Total: <span className="font-bold text-teal-600">KES {total.toLocaleString()}</span>
          </p>
          {checkoutId ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 text-teal-500 animate-pulse" />
              <span>Waiting for payment confirmation...</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="input-field text-sm flex-1"
              />
              <button onClick={initiateMpesa} disabled={paying} className="btn-primary whitespace-nowrap">
                {paying ? 'Sending...' : 'Pay Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                {item.product?.imageUrl
                  ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">💊</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × KES {parseFloat(item.unitPrice).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold">KES {parseFloat(item.subtotal).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>KES {parseFloat(order.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>{parseFloat(order.deliveryFee) === 0 ? 'FREE' : `KES ${parseFloat(order.deliveryFee).toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
            <span>Total</span><span>KES {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to={`/orders/${order.orderNumber}`} className="btn-secondary flex-1 text-center">
          Track Order
        </Link>
        <Link to="/products" className="btn-primary flex-1 text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
