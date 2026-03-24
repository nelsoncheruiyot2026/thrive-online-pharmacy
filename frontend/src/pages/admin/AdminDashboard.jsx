import { useState, useEffect } from 'react'
import {
  ShoppingCartIcon, CurrencyDollarIcon, UsersIcon,
  ClipboardDocumentListIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { PageLoader } from '../../components/common/LoadingSpinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import api from '../../services/api'

function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', trend }) {
  const colors = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${parseFloat(trend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <ArrowTrendingUpIcon className={`h-3 w-3 ${parseFloat(trend) < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { overview, revenueByDay, orderStatusBreakdown, lowStockProducts } = stats || {}

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`KES ${parseFloat(overview?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`KES ${parseFloat(overview?.monthlyRevenue || 0).toLocaleString()} this month`}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={overview?.totalOrders || 0}
          subtitle={`${overview?.monthlyOrders || 0} this month`}
          icon={ShoppingCartIcon}
          color="blue"
          trend={overview?.orderGrowth}
        />
        <StatCard
          title="Customers"
          value={overview?.totalCustomers || 0}
          subtitle={`${overview?.newCustomers || 0} new this month`}
          icon={UsersIcon}
          color="teal"
        />
        <StatCard
          title="Pending Actions"
          value={(overview?.pendingPrescriptions || 0) + (overview?.pendingOrders || 0)}
          subtitle={`${overview?.pendingPrescriptions || 0} prescriptions · ${overview?.pendingOrders || 0} orders`}
          icon={ClipboardDocumentListIcon}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart (simple bar chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Revenue – Last 7 Days</h3>
          <div className="flex items-end gap-2 h-40">
            {revenueByDay?.map(({ date, revenue }) => {
              const maxRevenue = Math.max(...(revenueByDay.map(d => d.revenue)), 1)
              const height = revenue > 0 ? Math.max(8, (revenue / maxRevenue) * 100) : 4
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{revenue > 0 ? `${(revenue/1000).toFixed(0)}K` : ''}</span>
                  <div
                    className="w-full bg-teal-500 rounded-t-md transition-all"
                    style={{ height: `${height}%` }}
                    title={`KES ${revenue.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-400 rotate-45 origin-left">{date.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Order Status</h3>
          <div className="space-y-2">
            {orderStatusBreakdown?.slice(0, 6).map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <OrderStatusBadge status={status} />
                <span className="font-bold text-gray-900 text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">Low Stock Alert</h3>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-1">
              {lowStockProducts.length} products
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold text-gray-700">Product</th>
                  <th className="text-right pb-2 font-semibold text-gray-700">Stock</th>
                  <th className="text-right pb-2 font-semibold text-gray-700">Threshold</th>
                  <th className="text-right pb-2 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-900">{product.name}</td>
                    <td className="py-2 text-right font-medium text-orange-600">{product.stock}</td>
                    <td className="py-2 text-right text-gray-500">{product.lowStockThreshold}</td>
                    <td className="py-2 text-right">
                      {product.stock === 0
                        ? <span className="badge badge-red">Out of Stock</span>
                        : <span className="badge badge-yellow">Low Stock</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
