import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCartIcon, ExclamationTriangleIcon, StarIcon,
  CheckCircleIcon, ArrowLeftIcon, MinusIcon, PlusIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { PageLoader } from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCartStore()
  const { user } = useAuthStore()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${slug}`)
      .then(r => { setProduct(r.data.data); setSelectedImage(0) })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    setAdding(true)
    await addToCart(product.id, qty)
    setAdding(false)
  }

  if (loading) return <PageLoader />
  if (!product) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      <Link to="/products" className="mt-4 inline-block btn-primary">Back to Products</Link>
    </div>
  )

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean)
  const avgRating = product.avgRating || 0
  const isOutOfStock = product.stock === 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-teal-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category?.slug}`} className="hover:text-teal-600">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">💊</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? 'border-teal-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.requiresPrescription && (
              <span className="flex-shrink-0 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200">
                Prescription Required
              </span>
            )}
          </div>

          {product.manufacturer && (
            <p className="text-sm text-gray-500 mb-2">By {product.manufacturer}</p>
          )}

          {/* Rating */}
          {product._count?.reviews > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <StarSolid key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{avgRating.toFixed(1)} ({product._count.reviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">
              KES {parseFloat(product.price).toLocaleString()}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                KES {parseFloat(product.compareAtPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-4">
            {isOutOfStock ? (
              <span className="text-red-600 text-sm font-medium">Out of Stock</span>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-green-600 text-sm font-medium">
                  In Stock ({product.stock} available)
                </span>
              </>
            )}
          </div>

          {/* Prescription warning */}
          {product.requiresPrescription && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Prescription Required</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  A valid prescription from a licensed doctor is required. You'll upload it during checkout.
                </p>
              </div>
            </div>
          )}

          {/* Dosage */}
          {product.dosage && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Recommended Dosage</p>
              <p className="text-sm text-blue-800">{product.dosage}</p>
            </div>
          )}

          {/* Qty + Add to Cart */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-50 transition-colors"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="p-3 hover:bg-gray-50 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Product Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Meta */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            {product.category && (
              <div>
                <span className="text-gray-500">Category:</span>
                <Link to={`/products?category=${product.category.slug}`} className="ml-1 text-teal-600 hover:underline">
                  {product.category.name}
                </Link>
              </div>
            )}
            {product.manufacturer && (
              <div>
                <span className="text-gray-500">Brand:</span>
                <span className="ml-1 text-gray-900">{product.manufacturer}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-12 border-t border-gray-100 pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {review.user?.firstName} {review.user?.lastName?.charAt(0)}.
                  </p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <StarSolid key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
