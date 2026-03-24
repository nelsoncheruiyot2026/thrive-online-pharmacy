import { useState, useEffect } from 'react'
import { EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Pagination from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', class: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved',       class: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected',       class: 'bg-red-100 text-red-800' },
}

function PrescriptionModal({ rx, onClose, onReviewed }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const review = async (status) => {
    setLoading(true)
    try {
      await api.put(`/admin/prescriptions/${rx.id}/review`, { status, reviewNotes: notes })
      toast.success(`Prescription ${status.toLowerCase()}`)
      onReviewed()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Review Prescription</h2>
            <p className="text-xs text-gray-500">
              {rx.user?.firstName} {rx.user?.lastName} · Order #{rx.order?.orderNumber}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Patient & Order info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Patient</p>
              <p className="font-medium text-gray-900">{rx.user?.firstName} {rx.user?.lastName}</p>
              <p className="text-gray-600">{rx.user?.email}</p>
              <p className="text-gray-600">{rx.user?.phone}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Order</p>
              <p className="font-medium text-gray-900">#{rx.order?.orderNumber}</p>
              <p className="text-gray-600">KES {parseFloat(rx.order?.total || 0).toLocaleString()}</p>
              <p className="text-gray-400 text-xs mt-1">{format(new Date(rx.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>

          {/* Items requiring prescription */}
          {rx.order?.items?.filter(i => i.product?.requiresPrescription).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Prescription Medications</p>
              <div className="space-y-1">
                {rx.order.items.filter(i => i.product?.requiresPrescription).map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">{item.product?.name}</span>
                    <span className="font-medium">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescription image */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Prescription Document</p>
            {rx.imageUrl ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {rx.imageUrl.toLowerCase().includes('.pdf') ? (
                  <a href={rx.imageUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-teal-600">
                    <span className="text-3xl">📄</span>
                    <div>
                      <p className="font-medium text-sm">View PDF Prescription</p>
                      <p className="text-xs text-gray-400">Click to open in new tab</p>
                    </div>
                  </a>
                ) : (
                  <a href={rx.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={rx.imageUrl}
                      alt="Prescription"
                      className="w-full max-h-72 object-contain bg-gray-50 hover:opacity-90 transition-opacity"
                    />
                  </a>
                )}
                <div className="p-2 text-center border-t border-gray-100">
                  <a href={rx.imageUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-teal-600 hover:underline">
                    Open full size ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                No prescription uploaded
              </div>
            )}
          </div>

          {/* Review notes */}
          {rx.status === 'PENDING' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Pharmacist Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes for the customer if rejecting or approving with conditions..."
                className="input-field text-sm"
              />
            </div>
          )}

          {/* Prior review info */}
          {rx.status !== 'PENDING' && rx.reviewNotes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Review Notes</p>
              <p className="text-sm text-gray-600">{rx.reviewNotes}</p>
              {rx.reviewedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Reviewed {format(new Date(rx.reviewedAt), 'dd MMM yyyy, HH:mm')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {rx.status === 'PENDING' ? (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={() => review('REJECTED')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => review('APPROVED')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Approve
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full btn-secondary">Close</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [selectedRx, setSelectedRx] = useState(null)

  const fetchPrescriptions = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (statusFilter) params.set('status', statusFilter)
    try {
      const { data } = await api.get(`/admin/prescriptions?${params}`)
      setPrescriptions(data.data.prescriptions)
      setPagination(data.data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPrescriptions() }, [page, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Prescriptions ({pagination.total || 0})</h2>
        {pagination.total > 0 && statusFilter === 'PENDING' && (
          <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
            {pagination.total} pending review
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === s
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prescriptions.map(rx => {
                  const cfg = STATUS_CONFIG[rx.status]
                  return (
                    <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{rx.user?.firstName} {rx.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{rx.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-700">#{rx.order?.orderNumber}</p>
                        <p className="text-xs text-gray-400">KES {parseFloat(rx.order?.total || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg?.class}`}>
                          {cfg?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {format(new Date(rx.createdAt), 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedRx(rx)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {prescriptions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <p>No prescriptions {statusFilter ? `with status "${statusFilter}"` : 'found'}</p>
              </div>
            )}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}

      {selectedRx && (
        <PrescriptionModal
          rx={selectedRx}
          onClose={() => setSelectedRx(null)}
          onReviewed={fetchPrescriptions}
        />
      )}
    </div>
  )
}
