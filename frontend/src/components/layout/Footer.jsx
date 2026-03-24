import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-white">Thrive Pharmacy</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Your trusted online pharmacy in Kenya. Quality medications, vitamins,
              and health products delivered to your doorstep.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p>📍 Nairobi, Kenya</p>
              <p>📞 +254 700 000 000</p>
              <p>✉️ support@thrivepharmacy.co.ke</p>
              <p>🕐 Mon-Sat: 8:00 AM - 8:00 PM</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-teal-400 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=over-the-counter" className="hover:text-teal-400 transition-colors">OTC Medicines</Link></li>
              <li><Link to="/products?category=vitamins-supplements" className="hover:text-teal-400 transition-colors">Vitamins</Link></li>
              <li><Link to="/orders" className="hover:text-teal-400 transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Create Account</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Sign In</Link></li>
              <li><span className="hover:text-teal-400 cursor-pointer">FAQ</span></li>
              <li><span className="hover:text-teal-400 cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-teal-400 cursor-pointer">Terms & Conditions</span></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Thrive Pharmacy. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span className="flex items-center space-x-1">
              <span>🏥</span>
              <span>Licensed by PPB Kenya</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🔒</span>
              <span>SSL Secured</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
