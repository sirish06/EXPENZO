import { useState, useEffect } from 'react'
import { groupService } from '../services/groupService'
import { expenseService } from '../services/expenseService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { FiFilter, FiSearch, FiDownload } from 'react-icons/fi'
import { formatAmount } from '../utils/currencies'

const CATEGORIES = ['all', 'food', 'travel', 'rent', 'party', 'shopping', 'utilities', 'other']
const categoryEmoji = { food: '🍔', travel: '✈️', rent: '🏠', party: '🎉', shopping: '🛒', utilities: '💡', other: '💰' }

const TransactionHistory = () => {
  const { user } = useAuth()
  const [allExpenses, setAllExpenses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: grps } = await groupService.getAll()
        setGroups(grps)
        const allExp = []
        for (const g of grps) {
          const { data: exps } = await expenseService.getByGroup(g._id)
          exps.forEach(e => allExp.push({ ...e, groupName: g.name, groupId: g._id }))
        }
        allExp.sort((a, b) => new Date(b.date) - new Date(a.date))
        setAllExpenses(allExp)
        setFiltered(allExp)
      } catch { toast.error('Failed to load transactions') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    let result = allExpenses
    if (selectedGroup !== 'all') result = result.filter(e => e.groupId === selectedGroup)
    if (selectedCategory !== 'all') result = result.filter(e => e.category === selectedCategory)
    if (search) result = result.filter(e => (e.title || e.description || '').toLowerCase().includes(search.toLowerCase()))
    setFiltered(result)
  }, [selectedGroup, selectedCategory, search, allExpenses])

  const myShare = (exp) => {
    const split = exp.splitBetween?.find(s => s.user?._id === user._id)
    return split ? (split.amountInINR ?? split.amount) : 0
  }

  const exportCSV = () => {
    const headers = ['Title', 'Amount', 'Currency', 'Amount (INR)', 'Paid By', 'Split Type', 'Category', 'Date', 'Group', 'Notes']
    const rows = filtered.map(e => [
      `"${e.title || e.description || ''}"`,
      e.amount,
      e.currency || 'INR',
      e.amountInINR ?? e.amount,
      e.paidBy?.name || '',
      e.splitType || '',
      e.category || '',
      new Date(e.date).toLocaleDateString('en-IN'),
      `"${e.groupName || ''}"`,
      `"${e.notes || ''}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
          <button onClick={exportCSV} disabled={filtered.length === 0} className="btn-secondary flex items-center gap-2 text-sm">
            <FiDownload size={15} /> Export CSV
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="input-field pl-10" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="input-field pl-10 pr-8 appearance-none cursor-pointer">
              <option value="all">All Groups</option>
              {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-field appearance-none cursor-pointer capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : `${categoryEmoji[c]} ${c}`}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No transactions found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card py-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="font-bold text-gray-900 dark:text-white">₹{filtered.reduce((s, e) => s + (e.amountInINR ?? e.amount), 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">in INR</p>
              </div>
              <div className="card py-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Paid by Me</p>
                <p className="font-bold text-green-600 dark:text-green-400">₹{filtered.filter(e => e.paidBy?._id === user._id).reduce((s, e) => s + (e.amountInINR ?? e.amount), 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">in INR</p>
              </div>
              <div className="card py-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">My Share</p>
                <p className="font-bold text-red-500 dark:text-red-400">₹{filtered.reduce((s, e) => s + myShare(e), 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">in INR</p>
              </div>
            </div>

            {filtered.map(exp => (
              <div key={exp._id} className="card hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {categoryEmoji[exp.category] || '💰'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{exp.title || exp.description}</p>
                        {exp.currency && exp.currency !== 'INR' && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">{exp.currency}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{exp.groupName}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{formatAmount(exp.amount, exp.currency)}</p>
                    {exp.paidBy?._id === user._id ? (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">You paid</p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{exp.paidBy?.name} paid · <span className="text-red-500 dark:text-red-400">₹{myShare(exp).toFixed(2)}</span></p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory
