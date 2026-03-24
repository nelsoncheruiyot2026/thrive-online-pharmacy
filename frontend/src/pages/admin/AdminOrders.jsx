import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import Pagination from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PENDING_PRESCRIPTION',
  'PRESCRIPTION_APPROVED', 'PRESCRIPTION_REJECTED', 'PROCESSING',
  'DISPATCHED', 'DELIVERED', 'CANCELLED'
]

function OrderDetailModal({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [loading, setLoading] = useState(false)

  const updateStatus = async () => {
    setLoading(true)
    try {
      await api.put(`/admin/orders/${order.id}/status`, { status, trackingNumber: trackingNumber || undefined })
      toast.success('Order status updated')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-xs text-gray-500">{order.user?.firstName} {order.user?.lastName} · {order.user?.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Items</h3>
            <div className="space-y-2">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{item.product?.name} × {item.quantity}</span>
                  <span className="font-medium text-gray-900">KES {parseFloat(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-1">
                <span>Total</span>
                <span>KES {parseFloat(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-1">Customer</p>
              <p className="text-gray-600">{order.user?.firstName} {order.user?.lastName}</p>
              <p className="text-gray-500">{order.user?.email}</p>
              <p className="text-gray-500">{order.user?.phone}</p>
            </div>
            {order.address && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Delivery Address</p>
                <p className="text-gray-600">{order.address.street}</p>
                <p className="text-gray-500">{order.address.city}, {order.address.county}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="text-sm bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${order.payment?.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                {order.payment?.status || 'N/A'}
              </span>
            </div>
          </div>

          {/* Update Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Update Order</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input-field text-sm">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Number</label>
                <input
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. THP-TRK-001"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={updateStatus} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Updating...' : 'Update Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const { data } = await api.get(`/admin/orders?${params}`)
      setOrders(data.data.orders)
      setPagination(data.data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [page, search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Orders ({pagination.total || 0})</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search order # or email..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-900">{order.user?.firstName} {order.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{order.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right font-medium hidden sm:table-cell">
                      KES {parseFloat(order.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.payment?.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.payment?.status || 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {format(new Date(order.createdAt), 'dd MMM yy, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-center py-12 text-gray-500">No orders found</div>}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  )
}
