import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import Pagination from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { format } from 'date-fns'

const STATUS_FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 10 })
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/orders?${params}`)
      .then(r => {
        setOrders(r.data.data.orders)
        setPagination(r.data.data.pagination)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === f.value
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-4">Start shopping to place your first order.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.orderNumber}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {order.items?.slice(0, 3).map(item => (
                    <div key={item.id} className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.imageUrl
                        ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">💊</div>
                      }
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="text-xs text-gray-500">+{order.items.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    {order.payment && (
                      <span className={`ml-2 font-medium ${order.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                        · Payment {order.payment.status === 'COMPLETED' ? 'Paid' : 'Pending'}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-900">
                    KES {parseFloat(order.total).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
