import { Link } from 'react-router-dom'
import { ShoppingCartIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    await addToCart(product.id)
  }

  const isOutOfStock = product.stock === 0
  const price = parseFloat(product.price)
  const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null
  const discount = compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : null

  return (
    <Link to={`/products/${product.slug}`} className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">💊</span>
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {product.requiresPrescription && (
          <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs font-medium px-1.5 py-0.5 rounded border border-orange-200">
            Rx
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs text-teal-600 font-medium mb-1">{product.category?.name}</p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
          {product.name}
        </h3>

        {product.manufacturer && (
          <p className="text-xs text-gray-400 mt-0.5">{product.manufacturer}</p>
        )}

        {/* Rating */}
        {product._count?.reviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <StarIcon className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-gray-500">({product._count.reviews})</span>
          </div>
        )}

        {/* Prescription warning */}
        {product.requiresPrescription && (
          <div className="flex items-center gap-1 mt-1.5">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs text-orange-600">Prescription required</span>
          </div>
        )}

        {/* Price & Cart */}
        <div className="flex items-center justify-between mt-2.5">
          <div>
            <span className="text-base font-bold text-gray-900">
              KES {price.toLocaleString()}
            </span>
            {compareAtPrice && (
              <span className="text-xs text-gray-400 line-through ml-1">
                KES {compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              title="Add to cart"
            >
              <ShoppingCartIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
