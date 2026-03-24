import { useState, useEffect, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import api from '../../services/api'
import toast from 'react-hot-toast'

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price || '',
    compareAtPrice: product?.compareAtPrice || '',
    stock: product?.stock || 0,
    categoryId: product?.categoryId || '',
    requiresPrescription: product?.requiresPrescription || false,
    isFeatured: product?.isFeatured || false,
    manufacturer: product?.manufacturer || '',
    dosage: product?.dosage || '',
    sku: product?.sku || '',
  })
  const fileRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (fileRef.current?.files?.length) {
        Array.from(fileRef.current.files).forEach(f => formData.append('images', f))
      }

      if (product) {
        await api.put(`/products/${product.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product updated')
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally { setLoading(false) }
  }

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
              <input value={form.name} onChange={set('name')} required className="input-field text-sm" placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price (KES) *</label>
              <input type="number" step="0.01" value={form.price} onChange={set('price')} required className="input-field text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Compare At Price</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={set('compareAtPrice')} className="input-field text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
              <input type="number" value={form.stock} onChange={set('stock')} required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.categoryId} onChange={set('categoryId')} required className="input-field text-sm">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={set('manufacturer')} className="input-field text-sm" placeholder="e.g. Pfizer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
              <input value={form.sku} onChange={set('sku')} className="input-field text-sm" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
            <input value={form.shortDescription} onChange={set('shortDescription')} className="input-field text-sm" placeholder="One-line description" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Description *</label>
            <textarea value={form.description} onChange={set('description')} required rows={4} className="input-field text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dosage Instructions</label>
            <input value={form.dosage} onChange={set('dosage')} className="input-field text-sm" placeholder="e.g. 500mg twice daily with food" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Product Images</label>
            <input type="file" ref={fileRef} multiple accept="image/*" className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-xs file:font-medium" />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.requiresPrescription} onChange={set('requiresPrescription')} className="text-teal-600" />
              <span className="text-sm text-gray-700">Requires Prescription</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} className="text-teal-600" />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'add' | product object

  const fetchProducts = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 15 })
    if (search) params.set('search', search)
    try {
      const { data } = await api.get(`/products?${params}`)
      setProducts(data.data.products)
      setPagination(data.data.pagination)
    } catch (console.error)
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page, search])
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {}) }, [])

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This will hide it from the store.`)) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted')
      fetchProducts()
    } catch { toast.error('Failed to delete product') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Products ({pagination.total || 0})</h2>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search products..."
          className="input-field pl-9 text-sm"
        />
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Rx</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm">💊</div>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                          {p.isFeatured && <span className="text-xs text-yellow-600">⭐ Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right font-medium">KES {parseFloat(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={p.stock === 0 ? 'text-red-600 font-medium' : p.stock <= 10 ? 'text-orange-600' : 'text-gray-700'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {p.requiresPrescription && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">Rx</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id, p.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">No products found</div>
            )}
          </div>

          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}

      {modal && (
        <ProductFormModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts() }}
        />
      )}
    </div>
  )
}
