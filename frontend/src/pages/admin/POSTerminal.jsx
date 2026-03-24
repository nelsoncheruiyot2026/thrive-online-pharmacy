import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../services/api'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'

// ── Receipt component (also used for print) ─────────────────────────────
function Receipt({ sale, onClose }) {
  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Print styles injected inline */}
        <style>{`
          @media print {
            body > *:not(#receipt-root) { display: none !important; }
            #receipt-root { position: fixed; inset: 0; }
          }
        `}</style>

        <div id="receipt-root" className="p-6 font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-teal-700">THRIVE PHARMACY</p>
            <p className="text-xs text-gray-500">Nairobi, Kenya | Tel: +254 700 000 000</p>
            <p className="text-xs text-gray-500">thrivepharmacy.co.ke</p>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <p className="font-bold">SALES RECEIPT</p>
            <p className="text-xs text-gray-500">#{sale.saleNumber}</p>
            <p className="text-xs text-gray-500">
              {new Date(sale.createdAt).toLocaleString('en-KE')}
            </p>
            {sale.cashier && (
              <p className="text-xs text-gray-500">
                Cashier: {sale.cashier.firstName} {sale.cashier.lastName}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-dashed border-gray-400 py-3 space-y-1">
            {sale.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="flex-1 truncate pr-2">{item.product?.name || 'Item'}</span>
                  <span>KES {Number(item.subtotal).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 pl-2">
                  {item.quantity} × KES {Number(item.unitPrice).toLocaleString()}
                  {Number(item.discount) > 0 && ` (disc -${item.discount})`}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 py-3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>KES {Number(sale.subtotal).toLocaleString()}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- KES {Number(sale.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2">
              <span>TOTAL</span>
              <span>KES {Number(sale.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Payment</span>
              <span>{sale.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            {sale.cashTendered && (
              <>
                <div className="flex justify-between text-xs">
                  <span>Cash Tendered</span>
                  <span>KES {Number(sale.cashTendered).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Change</span>
                  <span>KES {Number(sale.changeDue || 0).toLocaleString()}</span>
                </div>
              </>
            )}
            {sale.mpesaReceiptNumber && (
              <div className="flex justify-between text-xs">
                <span>M-Pesa Ref</span>
                <span>{sale.mpesaReceiptNumber}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-400 pt-3 text-center text-xs text-gray-500 space-y-1">
            {sale.customerName && <p>Customer: {sale.customerName}</p>}
            <p>Thank you for shopping at Thrive!</p>
            <p>Exchange within 7 days with receipt.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
          >
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Payment Modal ────────────────────────────────────────────────────────
function PaymentModal({ cart, subtotal, discount, total, onConfirm, onClose, loading }) {
  const [method, setMethod] = useState('CASH')
  const [cashTendered, setCashTendered] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const change = method === 'CASH' && cashTendered
    ? Number(cashTendered) - total
    : null

  const canConfirm = () => {
    if (method === 'CASH') return !cashTendered || Number(cashTendered) >= total
    if (method === 'MPESA') return mpesaPhone.length >= 9
    return true
  }

  const handleSubmit = () => {
    onConfirm({
      paymentMethod: method,
      cashTendered: method === 'CASH' ? Number(cashTendered) : undefined,
      mpesaPhone: method === 'MPESA' ? mpesaPhone : undefined,
      mpesaReceiptNumber: method === 'MPESA' ? mpesaReceipt : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Process Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Total summary */}
          <div className="bg-teal-50 rounded-xl p-4 text-center">
            <p className="text-sm text-teal-600">Amount Due</p>
            <p className="text-3xl font-bold text-teal-700">
              KES {total.toLocaleString()}
            </p>
            {discount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Includes KES {discount.toLocaleString()} discount
              </p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'CASH', label: 'Cash', icon: BanknotesIcon },
                { value: 'MPESA', label: 'M-Pesa', icon: DevicePhoneMobileIcon },
                { value: 'CARD', label: 'Card', icon: CreditCardIcon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    method === value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash fields */}
          {method === 'CASH' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cash Tendered (KES)</label>
              <input
                type="number"
                value={cashTendered}
                onChange={e => setCashTendered(e.target.value)}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {change !== null && (
                <div className={`mt-2 p-3 rounded-lg text-center font-semibold ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {change >= 0
                    ? `Change: KES ${change.toLocaleString()}`
                    : `Insufficient — short by KES ${Math.abs(change).toLocaleString()}`}
                </div>
              )}
            </div>
          )}

          {/* M-Pesa fields */}
          {method === 'MPESA' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Customer Phone (M-Pesa)</label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">M-Pesa Receipt No. (optional)</label>
                <input
                  type="text"
                  value={mpesaReceipt}
                  onChange={e => setMpesaReceipt(e.target.value)}
                  placeholder="e.g. QAB1234XYZ"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                Ask customer to send KES {total.toLocaleString()} to Till/Paybill, then enter the M-Pesa message code above.
              </p>
            </div>
          )}

          {/* Optional customer info */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canConfirm() || loading}
            className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main POS Terminal ────────────────────────────────────────────────────
export default function POSTerminal() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState([])       // [{ product, quantity, discount }]
  const [saleDiscount, setSaleDiscount] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef(null)
  const searchTimerRef = useRef(null)

  // Focus search on mount
  useEffect(() => { searchRef.current?.focus() }, [])

  // Debounced product search
  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    if (searchQuery.trim().length < 2) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get('/pos/products/search', { params: { q: searchQuery } })
        setSearchResults(data.data || [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        )
      }
      return [...prev, { product, quantity: 1, discount: 0 }]
    })
    setSearchQuery('')
    setSearchResults([])
    searchRef.current?.focus()
  }, [])

  const updateQty = (productId, delta) => {
    setCart(prev => prev
      .map(i => i.product.id === productId
        ? { ...i, quantity: Math.max(1, Math.min(i.quantity + delta, i.product.stock)) }
        : i
      )
    )
  }

  const updateItemDiscount = (productId, val) => {
    setCart(prev => prev.map(i =>
      i.product.id === productId ? { ...i, discount: Number(val) || 0 } : i
    ))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSaleDiscount(0)
    setError('')
  }

  const subtotal = cart.reduce(
    (sum, i) => sum + (Number(i.product.price) - i.discount) * i.quantity, 0
  )
  const total = Math.max(0, subtotal - saleDiscount)

  const handleCompleteSale = async (paymentInfo) => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.price,
          discount: i.discount,
        })),
        discount: saleDiscount,
        ...paymentInfo,
      }
      const { data } = await api.post('/pos/sales', payload)
      setCompletedSale(data.data)
      setShowPayment(false)
      clearCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full gap-0 -m-4 sm:-m-6 bg-gray-100">
      {/* ── Left: Product Search ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU or scan barcode…"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {searchResults.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-teal-400 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-600 text-lg">💊</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight truncate group-hover:text-teal-700">{product.name}</p>
                      {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-teal-700 font-bold text-sm">
                      KES {Number(product.price).toLocaleString()}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                    </span>
                  </div>
                  {product.requiresPrescription && (
                    <p className="text-xs text-orange-600 mt-1">⚠ Rx required</p>
                  )}
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 && !searching ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <MagnifyingGlassIcon className="h-10 w-10 mb-2 opacity-40" />
              <p>No products found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-5xl mb-3">🔍</span>
              <p className="text-sm">Search or scan a product to add it to the sale</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart / Order Summary ──────────────────────────────── */}
      <div className="w-96 flex flex-col bg-white overflow-hidden">
        {/* Cart header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="font-bold text-gray-900">Current Sale</h2>
            <p className="text-xs text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
            >
              <TrashIcon className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-4">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm text-center">Add products from the left panel</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{item.product.name}</p>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">
                        KES {Number(item.product.price).toLocaleString()} each
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {/* Qty controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Item discount */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Disc</span>
                      <input
                        type="number"
                        min="0"
                        value={item.discount || ''}
                        onChange={e => updateItemDiscount(item.product.id, e.target.value)}
                        placeholder="0"
                        className="w-16 text-xs border border-gray-200 rounded px-1 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    {/* Line total */}
                    <span className="text-sm font-bold text-gray-900">
                      KES {((Number(item.product.price) - item.discount) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & checkout */}
        <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            {/* Order-level discount */}
            <div className="flex items-center justify-between text-gray-600">
              <span>Discount (KES)</span>
              <input
                type="number"
                min="0"
                value={saleDiscount || ''}
                onChange={e => setSaleDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right border border-gray-200 rounded px-2 py-0.5 text-sm focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-300 pt-2">
              <span>Total</span>
              <span className="text-teal-700">KES {total.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Charge KES {total.toLocaleString()}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          subtotal={subtotal}
          discount={saleDiscount}
          total={total}
          onConfirm={handleCompleteSale}
          onClose={() => setShowPayment(false)}
          loading={loading}
        />
      )}

      {/* Receipt Modal */}
      {completedSale && (
        <Receipt
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  )
}
