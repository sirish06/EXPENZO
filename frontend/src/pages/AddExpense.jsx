import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { expenseService } from '../services/expenseService'
import { groupService } from '../services/groupService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi'
import { CURRENCIES, getCurrencySymbol } from '../utils/currencies'

const CATEGORIES = ['food', 'travel', 'rent', 'party', 'shopping', 'utilities', 'other']
const categoryEmoji = { food: '🍔', travel: '✈️', rent: '🏠', party: '🎉', shopping: '🛒', utilities: '💡', other: '💰' }
const SPLIT_TYPES = [
  { key: 'equal', label: '⚖️ Equal' },
  { key: 'custom', label: '✏️ Custom' },
  { key: 'percentage', label: '📊 Percentage' },
  { key: 'shares', label: '🔢 Shares' }
]

const AddExpense = () => {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    currency: 'INR',
    category: 'other',
    splitType: 'equal',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paidBy: ''  // will be set to current user after group loads
  })
  // Per-member amounts/percentages/shares
  const [memberValues, setMemberValues] = useState({})
  const [includedMembers, setIncludedMembers] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await groupService.getById(groupId)
        setGroup(data)
        const memberIds = data.members.map(m => m._id)
        setIncludedMembers(memberIds)
        setForm(f => ({ ...f, paidBy: user._id }))
        const init = {}
        memberIds.forEach(id => { init[id] = '' })
        setMemberValues(init)
      } catch {
        toast.error('Failed to load group')
        navigate(`/groups/${groupId}`)
      }
    }
    load()
  }, [groupId])

  const toggleMember = (memberId) => {
    setIncludedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  const currencySymbol = getCurrencySymbol(form.currency)
  const amountNum = parseFloat(form.amount) || 0

  const perPerson = () => {
    if (!form.amount || includedMembers.length === 0) return 0
    return (amountNum / includedMembers.length).toFixed(2)
  }

  const getTotal = () =>
    Object.entries(memberValues)
      .filter(([id]) => includedMembers.includes(id))
      .reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0)

  const getPercentageTotal = () =>
    Object.entries(memberValues)
      .filter(([id]) => includedMembers.includes(id))
      .reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0)

  const getTotalShares = () =>
    Object.entries(memberValues)
      .filter(([id]) => includedMembers.includes(id))
      .reduce((sum, [, v]) => sum + (parseFloat(v) || 1), 0)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (includedMembers.length === 0) { toast.error('Select at least one member'); return }

    // Validate custom split
    if (form.splitType === 'custom') {
      const total = getTotal()
      if (Math.abs(total - amountNum) > 0.01) {
        toast.error(`Split total (${currencySymbol}${total.toFixed(2)}) must equal expense amount (${currencySymbol}${amountNum.toFixed(2)})`)
        return
      }
    }

    // Validate percentage split
    if (form.splitType === 'percentage') {
      const total = getPercentageTotal()
      if (Math.abs(total - 100) > 0.01) {
        toast.error(`Percentages must add up to 100% (currently ${total.toFixed(1)}%)`)
        return
      }
    }

    setLoading(true)
    try {
      let splitBetween = []

      if (form.splitType === 'equal') {
        splitBetween = includedMembers.map(uid => ({ user: uid }))
      } else if (form.splitType === 'custom') {
        splitBetween = includedMembers.map(uid => ({
          user: uid,
          amount: parseFloat(memberValues[uid]) || 0
        }))
      } else if (form.splitType === 'percentage') {
        splitBetween = includedMembers.map(uid => ({
          user: uid,
          percentage: parseFloat(memberValues[uid]) || 0
        }))
      } else if (form.splitType === 'shares') {
        splitBetween = includedMembers.map(uid => ({
          user: uid,
          shares: parseFloat(memberValues[uid]) || 1
        }))
      }

      await expenseService.add({
        title: form.title,
        amount: parseFloat(form.amount),
        currency: form.currency,
        groupId,
        splitType: form.splitType,
        splitBetween,
        category: form.category,
        date: form.date,
        notes: form.notes,
        paidBy: form.paidBy
      })

      toast.success('Expense added! 🎉')
      navigate(`/groups/${groupId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  if (!group) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  const totalShares = getTotalShares()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <FiArrowLeft size={18} /> Back to {group.name}
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Expense</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Dinner at Spice Garden"
                className="input-field"
              />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Amount ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="input-field pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</label>
              <div className="relative">
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="input-field appearance-none pr-10 cursor-pointer"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              {form.currency !== 'INR' && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Balances will be calculated in INR using static exchange rates.
                </p>
              )}
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paid By *</label>
              <div className="relative">
                <select
                  value={form.paidBy}
                  onChange={e => setForm({ ...form, paidBy: e.target.value })}
                  className="input-field appearance-none pr-10 cursor-pointer"
                >
                  {group.members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m._id === user._id ? `${m.name} (You)` : m.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                      form.category === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>{categoryEmoji[cat]}</span> {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SPLIT_TYPES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, splitType: key })}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      form.splitType === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Members & split values */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Split Between ({includedMembers.length} selected)
              </label>
              <div className="space-y-2 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                {group.members.map(m => {
                  const included = includedMembers.includes(m._id)
                  const val = memberValues[m._id] || ''
                  return (
                    <div key={m._id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => toggleMember(m._id)}
                        className="w-4 h-4 rounded accent-primary-600"
                      />
                      <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs flex-shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white flex-1">
                        {m._id === user._id ? `${m.name} (You)` : m.name}
                      </span>

                      {/* Equal: show per-person amount */}
                      {form.splitType === 'equal' && included && (
                        <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                          {currencySymbol}{perPerson()}
                        </span>
                      )}

                      {/* Custom: amount input */}
                      {form.splitType === 'custom' && included && (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">{currencySymbol}</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={val}
                            onChange={e => setMemberValues({ ...memberValues, [m._id]: e.target.value })}
                            placeholder="0.00"
                            className="w-28 pl-5 pr-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}

                      {/* Percentage: % input */}
                      {form.splitType === 'percentage' && included && (
                        <div className="relative">
                          <input
                            type="number" min="0" max="100" step="0.01"
                            value={val}
                            onChange={e => setMemberValues({ ...memberValues, [m._id]: e.target.value })}
                            placeholder="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="ml-1 text-gray-400 text-xs">%</span>
                        </div>
                      )}

                      {/* Shares: ratio input */}
                      {form.splitType === 'shares' && included && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number" min="0.1" step="0.1"
                            value={val}
                            onChange={e => setMemberValues({ ...memberValues, [m._id]: e.target.value })}
                            placeholder="1"
                            className="w-16 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-400">
                            {totalShares > 0 && amountNum > 0
                              ? `≈ ${currencySymbol}${((parseFloat(val || 1) / totalShares) * amountNum).toFixed(2)}`
                              : 'share'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Validation feedback */}
              {form.splitType === 'custom' && form.amount && (
                <div className={`mt-2 text-sm font-medium ${
                  Math.abs(getTotal() - amountNum) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                }`}>
                  Total split: {currencySymbol}{getTotal().toFixed(2)} / {currencySymbol}{amountNum.toFixed(2)}
                </div>
              )}
              {form.splitType === 'percentage' && (
                <div className={`mt-2 text-sm font-medium ${
                  Math.abs(getPercentageTotal() - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                }`}>
                  Total: {getPercentageTotal().toFixed(1)}% / 100%
                </div>
              )}
              {form.splitType === 'shares' && amountNum > 0 && totalShares > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Total shares: {totalShares.toFixed(1)} — each share worth {currencySymbol}{(amountNum / totalShares).toFixed(2)}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional details..."
                rows={2}
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/groups/${groupId}`)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddExpense
