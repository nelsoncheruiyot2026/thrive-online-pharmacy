import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TruckIcon, ShieldCheckIcon, ClockIcon, PhoneIcon,
  ArrowRightIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import ProductCard from '../../components/common/ProductCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const CATEGORY_ICONS = {
  'prescription-drugs': '💊',
  'over-the-counter': '🩺',
  'vitamins-supplements': '🌿',
  'first-aid': '🩹',
  'mother-baby': '👶',
  'personal-care': '🧴',
  'sexual-health': '❤️',
  'chronic-conditions': '💙',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/categories')
    ]).then(([featuredRes, catRes]) => {
      setFeatured(featuredRes.data.data)
      setCategories(catRes.data.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Kenya's Trusted Online Pharmacy
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Your Health,<br />Delivered to<br />
              <span className="text-yellow-300">Your Doorstep</span>
            </h1>
            <p className="text-teal-100 text-lg mb-8">
              Order genuine medications, vitamins, and health products from licensed pharmacists.
              Fast delivery across Nairobi and Kenya.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medications, vitamins..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                />
              </div>
              <button type="submit" className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors whitespace-nowrap">
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {['Paracetamol', 'Vitamins', 'Antibiotics', 'First Aid'].map(term => (
                <button
                  key={term}
                  onClick={() => navigate(`/products?search=${term}`)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: TruckIcon, title: 'Fast Delivery', desc: 'Same-day in Nairobi' },
              { icon: ShieldCheckIcon, title: 'Genuine Products', desc: 'PPB certified medications' },
              { icon: ClockIcon, title: '24/7 Support', desc: 'Always here to help' },
              { icon: PhoneIcon, title: 'Expert Advice', desc: 'Certified pharmacists' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/products" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1">
            View all <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.slice(0, 8).map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <span className="text-2xl mb-2">{CATEGORY_ICONS[cat.slug] || '💊'}</span>
                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-teal-600 leading-tight">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{cat._count?.products || 0}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Top-selling medications and health products</p>
            </div>
            <Link to="/products" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1">
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner className="py-8" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Prescription CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h3 className="text-2xl font-bold mb-2">Have a Prescription?</h3>
            <p className="text-teal-100 max-w-md">
              Upload your doctor's prescription during checkout. Our licensed pharmacists
              will review and approve within 2 hours.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-teal-100">
              <li>✅ Verified by certified pharmacists</li>
              <li>✅ Secure prescription storage</li>
              <li>✅ Fast 2-hour review</li>
            </ul>
          </div>
          <Link
            to="/products?requiresPrescription=true"
            className="bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            View Prescription Drugs
          </Link>
        </div>
      </section>

      {/* Why Thrive */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why Choose Thrive Pharmacy?</h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto">Kenya's most trusted online pharmacy, serving thousands of customers with quality healthcare products.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🏆', title: 'Licensed & Certified', desc: 'Fully licensed by Pharmacy and Poisons Board (PPB) Kenya. All products are genuine and quality-tested.' },
              { emoji: '📱', title: 'Pay with M-Pesa', desc: 'Seamless M-Pesa STK Push payments. No cash needed — pay securely from your phone.' },
              { emoji: '🚀', title: 'Same-Day Delivery', desc: 'Order before 2 PM and get same-day delivery in Nairobi. Next-day delivery across Kenya.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="text-4xl mb-3">{emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
