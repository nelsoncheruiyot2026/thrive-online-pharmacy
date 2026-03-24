import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { UserIcon, LockClosedIcon, MapPinIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [addresses, setAddresses] = useState([])
  const [loadingAddr, setLoadingAddr] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)

  const profileForm = useForm({ defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone } })
  const passwordForm = useForm()
  const addressForm = useForm()

  useEffect(() => {
    api.get('/users/addresses').then(r => setAddresses(r.data.data)).catch(() => {})
  }, [])

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data)
      updateUser(res.data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const changePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return }
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword })
      toast.success('Password changed!')
      passwordForm.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    }
  }

  const saveAddress = async (data) => {
    setLoadingAddr(true)
    try {
      const res = await api.post('/users/addresses', data)
      setAddresses(prev => [...prev, res.data.data])
      setShowAddAddress(false)
      addressForm.reset()
      toast.success('Address saved')
    } catch {
      toast.error('Failed to save address')
    } finally { setLoadingAddr(false) }
  }

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success('Address deleted')
    } catch { toast.error('Failed to delete address') }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'password', label: 'Password', icon: LockClosedIcon },
    { id: 'addresses', label: 'Addresses', icon: MapPinIcon },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Sidebar */}
        <div className="sm:w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-100 last:border-0 ${
                    activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* User info card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mt-3 text-center">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-teal-700 font-bold text-xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5">Personal Information</h2>
              <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input {...profileForm.register('firstName', { required: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input {...profileForm.register('lastName', { required: true })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={user?.email} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input {...profileForm.register('phone')} placeholder="0712345678" className="input-field" />
                </div>
                <button type="submit" className="btn-primary">Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5">Change Password</h2>
              <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                {[
                  { name: 'currentPassword', label: 'Current Password' },
                  { name: 'newPassword', label: 'New Password' },
                  { name: 'confirmPassword', label: 'Confirm New Password' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="password"
                      {...passwordForm.register(field.name, { required: true })}
                      className="input-field"
                    />
                  </div>
                ))}
                <button type="submit" className="btn-primary">Change Password</button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Delivery Addresses</h2>
                <button onClick={() => setShowAddAddress(true)} className="btn-secondary text-sm flex items-center gap-1.5">
                  <PlusIcon className="h-4 w-4" /> Add Address
                </button>
              </div>

              {addresses.length === 0 && !showAddAddress && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <MapPinIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No saved addresses</p>
                </div>
              )}

              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{addr.label}</span>
                        {addr.isDefault && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-sm text-gray-600">{addr.street}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.county}</p>
                    </div>
                    <button onClick={() => deleteAddress(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {showAddAddress && (
                <div className="border border-teal-200 bg-teal-50 rounded-xl p-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">New Address</h3>
                  <form onSubmit={addressForm.handleSubmit(saveAddress)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Label</label>
                        <input {...addressForm.register('label')} defaultValue="Home" className="input-field text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">County *</label>
                        <input {...addressForm.register('county', { required: true })} placeholder="Nairobi" className="input-field text-sm mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Street *</label>
                      <input {...addressForm.register('street', { required: true })} placeholder="123 Kenyatta Ave" className="input-field text-sm mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">City *</label>
                        <input {...addressForm.register('city', { required: true })} placeholder="Nairobi" className="input-field text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Postal Code</label>
                        <input {...addressForm.register('postalCode')} placeholder="00100" className="input-field text-sm mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={loadingAddr} className="btn-primary text-sm py-2">{loadingAddr ? 'Saving...' : 'Save'}</button>
                      <button type="button" onClick={() => setShowAddAddress(false)} className="btn-secondary text-sm py-2">Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
