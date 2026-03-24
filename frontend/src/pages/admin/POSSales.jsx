import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  PrinterIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'

const PAYMENT_ICONS = {
  CASH: BanknotesIcon,
  MPESA: DevicePhoneMobileIcon,
  CARD: CreditCardIcon,
  CASH_ON_DELIVERY: BanknotesIcon,
}

const STATUS_COLORS = {
  COMPLETED: 'bg-green-100 text-green-700',
  VOIDED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-yellow-100 text-yellow-700',
}

function SaleDetailModal({ saleNumber, onClose }) {
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/pos/sales/${saleNumber}`)
      .then(r => setSale(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [saleNumber])

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl p-8 flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <span className="text-gray-600">Loading…</span>
      </div>
    </div>
  )

  if (!sale) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Sale #{sale.saleNumber}</h2>
            <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleString('en-KE')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
            <div className="space-y-2">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.product?.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} × KES {Number(item.unitPrice).toLocaleString()}
                      {Number(item.discount) > 0 && ` − ${item.discount} disc`}
                    </p>
                  </div>
                  <span className="font-semibold">KES {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>KES {Number(sale.subtotal).toLocaleString()}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>− KES {Number(sale.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1">
              <span>Total</span>
              <span className="text-teal-700">KES {Number(sale.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="space-y-1 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Method</span>
              <span>{sale.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            {sale.cashTendered && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Tendered</span>
                  <span>KES {Number(sale.cashTendered).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Change</span>
                  <span>KES {Number(sale.changeDue || 0).toLocaleString()}</span>
                </div>
              </>
            )}
            {sale.mpesaReceiptNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Ref</span>
                <span className="font-mono">{sale.mpesaReceiptNumber}</span>
              </div>
            )}
          </div>

          {/* Cashier / Customer */}
          <div className="space-y-1 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff & Customer</p>
            {sale.cashier && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cashier</span>
                <span>{sale.cashier.firstName} {sale.cashier.lastName}</span>
              </div>
            )}
            {sale.customerName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span>{sale.customerName}</span>
              </div>
            )}
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[sale.status]}`}>
              {sale.status}
            </span>
            {sale.notes && <p className="text-xs text-gray-500">{sale.notes}</p>}
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700 text-sm font-medium"
          >
            <PrinterIcon className="h-4 w-4" /> Reprint Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POSSales() {
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    status: '',
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const fetchSales = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 25, ...filters }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = await api.get('/pos/sales', { params })
      setSales(data.data || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/pos/stats')
      setStats(data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSales(1)
    fetchStats()
  }, [])

  const handleFilter = () => fetchSales(1)

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.quantity, 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Revenue", value: `KES ${Number(stats.today.revenue).toLocaleString()}`, sub: `${stats.today.transactions} sales`, color: 'teal' },
            { label: "This Week", value: `KES ${Number(stats.week.revenue).toLocaleString()}`, sub: `${stats.week.transactions} sales`, color: 'blue' },
            { label: "This Month", value: `KES ${Number(stats.month.revenue).toLocaleString()}`, sub: `${stats.month.transactions} sales`, color: 'purple' },
            { label: "Top Product Today", value: stats.topProducts[0]?.name || '—', sub: stats.topProducts[0] ? `${stats.topProducts[0].quantitySold} units` : '', color: 'orange' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 truncate">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment method breakdown */}
      {stats?.paymentBreakdown?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Payment Mix</h3>
          <div className="flex gap-4 flex-wrap">
            {stats.paymentBreakdown.map(pb => {
              const Icon = PAYMENT_ICONS[pb.paymentMethod] || BanknotesIcon
              return (
                <div key={pb.paymentMethod} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{pb.paymentMethod.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-sm text-teal-700">KES {Number(pb._sum.total).toLocaleString()}</span>
                  <span className="text-xs text-gray-400">({pb._count.id} txns)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Sales</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Payment</label>
            <select
              value={filters.paymentMethod}
              onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="MPESA">M-Pesa</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOIDED">Voided</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleFilter}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700"
          >
            <MagnifyingGlassIcon className="h-4 w-4" /> Apply
          </button>
          <div className="text-sm text-gray-500">
            {pagination.total} sale{pagination.total !== 1 ? 's' : ''} · KES {totalRevenue.toLocaleString()} · {totalItems} items
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Sales</h3>
          <button onClick={() => { fetchSales(1); fetchStats(); }} className="text-gray-400 hover:text-gray-600">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ShoppingBagIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No sales found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Sale #</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Cashier</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(sale => {
                  const Icon = PAYMENT_ICONS[sale.paymentMethod] || BanknotesIcon
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-700">{sale.saleNumber}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">{sale.cashier?.firstName} {sale.cashier?.lastName}</td>
                      <td className="px-4 py-3 text-gray-500">{sale.customerName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Icon className="h-3.5 w-3.5" />
                          {sale.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        KES {Number(sale.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sale.status] || 'bg-gray-100 text-gray-600'}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedSale(sale.saleNumber)}
                          className="text-gray-400 hover:text-teal-600 p-1 rounded hover:bg-teal-50"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSales(pagination.page - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchSales(pagination.page + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale detail modal */}
      {selectedSale && (
        <SaleDetailModal
          saleNumber={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  )
}
