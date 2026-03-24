import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, ArrowUpTrayIcon, TruckIcon } from '@heroicons/react/24/outline'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TIMELINE = [
  { status: 'PENDING_PAYMENT', label: 'Order Placed' },
  { status: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'DISPATCHED', label: 'Dispatched' },
  { status: 'DELIVERED', label: 'Delivered' },
]

const STATUS_ORDER = ['PENDING_PAYMENT','PAYMENT_CONFIRMED','PENDING_PRESCRIPTION','PRESCRIPTION_APPROVED','PROCESSING','DISPATCHED','DELIVERED']

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [uploadingRx, setUploadingRx] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get(`/orders/${orderNumber}`)
      .then(r => setOrder(r.data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
  }, [orderNumber])

  const initiateMpesa = async () => {
    if (!mpesaPhone.match(/^(07|01)\d{8}$/)) { toast.error('Enter valid phone number'); return }
    setPaying(true)
    try {
      const { data } = await api.post('/payments/mpesa/initiate', { orderId: order.id, phone: mpesaPhone })
      toast.success('STK Push sent! Enter your M-Pesa PIN.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally { setPaying(false) }
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
      toast.success('Prescription uploaded successfully!')
      setOrder(prev => ({ ...prev, status: 'PENDING_PRESCRIPTION' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setUploadingRx(false) }
  }

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await api.post(`/orders/${order.orderNumber}/cancel`)
      setOrder(prev => ({ ...prev, status: 'CANCELLED' }))
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel order')
    }
  }

  if (loading) return <PageLoader />
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const needsPayment = ['PENDING_PAYMENT', 'PRESCRIPTION_APPROVED'].includes(order.status)
  const needsPrescription = ['PENDING_PRESCRIPTION', 'PRESCRIPTION_REJECTED'].includes(order.status)
  const canCancel = ['PENDING_PAYMENT', 'PENDING_PRESCRIPTION'].includes(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/orders" className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Placed {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
          <div className="flex items-center justify-between">
            {TIMELINE.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.status)
              const isDone = currentStatusIndex >= stepIndex
              const isCurrent = currentStatusIndex === stepIndex
              return (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1.5 text-center leading-tight ${isDone ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {i < TIMELINE.length - 1 && (
                    <div className={`absolute mt-4 h-0.5 w-full ${isDone ? 'bg-teal-600' : 'bg-gray-200'}`} style={{ position: 'relative', width: '100%', top: '-24px', zIndex: -1 }} />
                  )}
                </div>
              )
            })}
          </div>
          {order.trackingNumber && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
              <TruckIcon className="h-4 w-4 text-teal-600" />
              <span>Tracking: <strong>{order.trackingNumber}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Prescription */}
      {needsPrescription && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-orange-900 text-sm mb-1">
            {order.status === 'PRESCRIPTION_REJECTED' ? '❌ Prescription Rejected' : '⏳ Prescription Required'}
          </p>
          <p className="text-sm text-orange-700 mb-3">
            {order.status === 'PRESCRIPTION_REJECTED'
              ? `${order.prescription?.reviewNotes || 'Your prescription was rejected. Please upload a valid one.'}`
              : 'Upload a doctor\'s prescription to proceed with your order.'}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={uploadPrescription} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingRx} className="btn-primary text-sm flex items-center gap-2">
            <ArrowUpTrayIcon className="h-4 w-4" />
            {uploadingRx ? 'Uploading...' : 'Upload Prescription'}
          </button>
        </div>
      )}

      {/* M-Pesa */}
      {needsPayment && order.paymentMethod === 'MPESA' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">📱 Pay with M-Pesa</h3>
          <p className="text-sm text-gray-600 mb-3">Amount: <strong className="text-teal-600">KES {parseFloat(order.total).toLocaleString()}</strong></p>
          <div className="flex gap-2">
            <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="07XXXXXXXX" className="input-field text-sm flex-1" />
            <button onClick={initiateMpesa} disabled={paying} className="btn-primary whitespace-nowrap">{paying ? 'Sending...' : 'Pay'}</button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                {item.product?.imageUrl
                  ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">💊</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product?.slug}`} className="text-sm font-medium text-gray-900 hover:text-teal-600 truncate block">
                  {item.product?.name}
                </Link>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × KES {parseFloat(item.unitPrice).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold">KES {parseFloat(item.subtotal).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>KES {parseFloat(order.subtotal).toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{parseFloat(order.deliveryFee) === 0 ? 'FREE' : `KES ${parseFloat(order.deliveryFee).toLocaleString()}`}</span></div>
          <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>KES {parseFloat(order.total).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Delivery Address</h3>
          <p className="text-sm text-gray-600">{order.address.street}, {order.address.city}, {order.address.county}</p>
        </div>
      )}

      {/* Cancel */}
      {canCancel && (
        <button onClick={cancelOrder} className="text-sm text-red-600 hover:text-red-700 font-medium">
          Cancel Order
        </button>
      )}
    </div>
  )
}
