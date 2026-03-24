import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ProductCard from '../../components/common/ProductCard'
import Pagination from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currentPage = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const requiresPrescription = searchParams.get('requiresPrescription') || ''
  const sort = searchParams.get('sort') || 'createdAt'
  const order = searchParams.get('order') || 'desc'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage)
      params.set('limit', '12')
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (requiresPrescription) params.set('requiresPrescription', requiresPrescription)
      params.set('sort', sort)
      params.set('order', order)

      const { data } = await api.get(`/products?${params}`)
      setProducts(data.data.products)
      setPagination(data.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, category, minPrice, maxPrice, requiresPrescription, sort, order])

  useEffect(() => {
    fetchProducts()
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {})
  }, [fetchProducts])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    setSearchParams(next)
  }

  const hasActiveFilters = category || minPrice || maxPrice || requiresPrescription

  const Filters = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="category" value="" checked={!category} onChange={() => updateFilter('category', '')} className="text-teal-600" />
            <span className="text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="category" value={cat.slug} checked={category === cat.slug} onChange={() => updateFilter('category', cat.slug)} className="text-teal-600" />
              <span className="text-sm text-gray-700">{cat.name}</span>
              <span className="text-xs text-gray-400 ml-auto">({cat._count?.products || 0})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price (KES)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="input-field text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      {/* Prescription */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Type</h3>
        <div className="space-y-2">
          {[
            { value: '', label: 'All Products' },
            { value: 'false', label: 'Over-the-Counter' },
            { value: 'true', label: 'Prescription Only' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rx"
                value={opt.value}
                checked={requiresPrescription === opt.value}
                onChange={() => updateFilter('requiresPrescription', opt.value)}
                className="text-teal-600"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 font-medium">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : 'All Products'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total || 0} products found
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filters {hasActiveFilters && <span className="bg-teal-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">!</span>}
          </button>

          {/* Sort */}
          <select
            value={`${sort}-${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split('-')
              const next = new URLSearchParams(searchParams)
              next.set('sort', s)
              next.set('order', o)
              setSearchParams(next)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            <Filters />
          </div>
        </aside>

        {/* Mobile Filters Drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <div className="fixed inset-y-0 right-0 w-72 bg-white overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)}><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <Filters />
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={(p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', p)
                  setSearchParams(next)
                  window.scrollTo(0, 0)
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
