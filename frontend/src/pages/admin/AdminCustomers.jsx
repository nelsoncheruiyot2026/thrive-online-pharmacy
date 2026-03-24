import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import Pagination from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search) params.set('search', search)
    try {
      const { data } = await api.get(`/admin/customers?${params}`)
      setCustomers(data.data.customers)
      setPagination(data.data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [page, search])

  const toggleStatus = async (id, currentStatus, name) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} account for ${name}?`)) return
    try {
      await api.put(`/admin/customers/${id}/toggle`)
      toast.success(`Account ${action}d`)
      fetchCustomers()
    } catch { toast.error('Failed to update account') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Customers ({pagination.total || 0})</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, email or phone..."
          className="input-field pl-9 text-sm"
        />
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Contact</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Orders</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Joined</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 text-sm font-bold">
                            {customer.firstName?.[0]}{customer.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                          <p className="text-xs text-gray-400 hidden sm:block">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-600">{customer.email}</p>
                      <p className="text-gray-400 text-xs">{customer.phone || 'No phone'}</p>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="font-semibold text-gray-900">{customer._count?.orders || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {format(new Date(customer.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(customer.id, customer.isActive, `${customer.firstName} ${customer.lastName}`)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          customer.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {customer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <UserCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No customers found</p>
              </div>
            )}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
