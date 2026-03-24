const STATUS_CONFIG = {
  PENDING_PAYMENT:       { label: 'Pending Payment',    class: 'bg-yellow-100 text-yellow-800' },
  PAYMENT_CONFIRMED:     { label: 'Payment Confirmed',  class: 'bg-blue-100 text-blue-800' },
  PENDING_PRESCRIPTION:  { label: 'Awaiting Prescription', class: 'bg-orange-100 text-orange-800' },
  PRESCRIPTION_APPROVED: { label: 'Prescription Approved', class: 'bg-teal-100 text-teal-800' },
  PRESCRIPTION_REJECTED: { label: 'Prescription Rejected', class: 'bg-red-100 text-red-800' },
  PROCESSING:            { label: 'Processing',          class: 'bg-indigo-100 text-indigo-800' },
  DISPATCHED:            { label: 'Dispatched',          class: 'bg-purple-100 text-purple-800' },
  DELIVERED:             { label: 'Delivered',           class: 'bg-green-100 text-green-800' },
  CANCELLED:             { label: 'Cancelled',           class: 'bg-gray-100 text-gray-600' },
}

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  )
}
