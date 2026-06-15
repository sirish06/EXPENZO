import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { CURRENCIES } from '../utils/currencies'
import { FiUser, FiMail, FiGlobe, FiSave, FiChevronDown } from 'react-icons/fi'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    preferredCurrency: user?.preferredCurrency || 'INR'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated successfully! ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your account settings</p>

        {/* Avatar */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-lg">{user?.name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <span className="inline-block mt-1.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
              {user?.preferredCurrency || 'INR'} preferred
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address <span className="text-gray-400 text-xs">(cannot be changed)</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Preferred Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Preferred Currency
              </label>
              <div className="relative">
                <FiGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                <select
                  value={form.preferredCurrency}
                  onChange={e => setForm({ ...form, preferredCurrency: e.target.value })}
                  className="input-field pl-10 appearance-none pr-10 cursor-pointer"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Balances will be displayed in this currency where possible.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><FiSave size={15} /> Save Changes</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
