import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { groupService } from '../services/groupService'
import { expenseService } from '../services/expenseService'
import { balanceService } from '../services/balanceService'
import { settlementService } from '../services/settlementService'
import { activityService } from '../services/activityService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import ActivityFeed from '../components/ActivityFeed'
import { FiPlus, FiArrowLeft, FiEdit2, FiTrash2, FiUsers, FiArrowRight, FiDollarSign, FiPieChart, FiInfo, FiCopy, FiRefreshCw, FiLogOut, FiUserMinus, FiActivity, FiDownload, FiFilter } from 'react-icons/fi'
import { formatAmount } from '../utils/currencies'
import { CURRENCIES } from '../utils/currencies'

const categoryEmoji = { food: '🍔', travel: '✈️', rent: '🏠', party: '🎉', shopping: '🛒', utilities: '💡', other: '💰' }
const CATS = ['all', 'food', 'travel', 'rent', 'party', 'shopping', 'utilities', 'other']
const tabs = ['Expenses', 'Balances', 'Members', 'Activity']

const SettleModal = ({ settlement, members, currentUser, onClose, onSettled }) => {
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(false)
  const handleSettle = async () => {
    setLoading(true)
    try {
      await settlementService.create({ groupId: settlement.groupId, to: settlement.to._id, amount: settlement.amount, currency })
      toast.success('Settlement recorded! ✅')
      onSettled()
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to settle') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Settle Up</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{settlement.from._id === currentUser._id ? 'You' : settlement.from.name}</span>
          {' pays '}
          <span className="font-semibold text-gray-900 dark:text-white">{settlement.to._id === currentUser._id ? 'You' : settlement.to.name}</span>
          {' '}
          <span className="font-bold text-primary-600 dark:text-primary-400">₹{settlement.amount}</span>
        </p>
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field mb-4">
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSettle} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}

const GroupDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState(null)
  const [settlements, setSettlements] = useState([])
  const [activities, setActivities] = useState([])
  const [activeTab, setActiveTab] = useState('Expenses')
  const [loading, setLoading] = useState(true)
  const [settleTarget, setSettleTarget] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [memberFilter, setMemberFilter] = useState('all')
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    try {
      const [gRes, eRes, bRes, sRes] = await Promise.all([
        groupService.getById(id),
        expenseService.getByGroup(id),
        balanceService.getGroupBalances(id),
        settlementService.getByGroup(id)
      ])
      setGroup(gRes.data)
      setExpenses(eRes.data)
      setBalances(bRes.data)
      setSettlements(sRes.data)
    } catch { toast.error('Failed to load group'); navigate('/groups') }
    finally { setLoading(false) }
  }

  const fetchActivity = async () => {
    setActivityLoading(true)
    try {
      const { data } = await activityService.getGroupFeed(id)
      setActivities(data)
    } catch {}
    finally { setActivityLoading(false) }
  }

  useEffect(() => { if (activeTab === 'Activity') fetchActivity() }, [activeTab])

  const isAdmin = group && group.createdBy._id === user._id

  const fetchExpenses = async () => {
    const { data } = await expenseService.getByGroup(id, { category: catFilter, paidBy: memberFilter })
    setExpenses(data)
  }

  useEffect(() => { if (group) fetchExpenses() }, [catFilter, memberFilter])

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await expenseService.delete(expId)
      setExpenses(prev => prev.filter(e => e._id !== expId))
      const bRes = await balanceService.getGroupBalances(id)
      setBalances(bRes.data)
      toast.success('Expense deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      const { data } = await groupService.removeMember(id, memberId)
      setGroup(data)
      toast.success('Member removed')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return
    try {
      await groupService.leave(id)
      toast.success('You left the group')
      navigate('/groups')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this entire group and all its expenses? This cannot be undone.')) return
    try {
      await groupService.delete(id)
      toast.success('Group deleted')
      navigate('/groups')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleRegenInvite = async () => {
    try {
      const { data } = await groupService.regenInvite(id)
      setGroup(prev => ({ ...prev, inviteCode: data.inviteCode }))
      toast.success('Invite code regenerated!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode)
    toast.success('Invite code copied!')
  }

  const exportCSV = () => {
    const headers = ['Title', 'Amount', 'Currency', 'Amount (INR)', 'Paid By', 'Split Type', 'Date', 'Category', 'Notes']
    const rows = expenses.map(e => [
      `"${e.title || e.description || ''}"`,
      e.amount, e.currency || 'INR', e.amountInINR ?? e.amount,
      e.paidBy?.name || '', e.splitType || '',
      new Date(e.date).toLocaleDateString('en-IN'),
      e.category || '', `"${e.notes || ''}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${group.name}_expenses.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const onSettled = () => { fetchAll() }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950"><Navbar />
      <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      {settleTarget && <SettleModal settlement={{ ...settleTarget, groupId: id }} members={group.members} currentUser={user} onClose={() => setSettleTarget(null)} onSettled={onSettled} />}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/groups')} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"><FiArrowLeft size={18} /></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
              {group.description && <p className="text-gray-500 dark:text-gray-400 text-sm">{group.description}</p>}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={exportCSV} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Export CSV"><FiDownload size={16} /></button>
            {isAdmin && (
              <>
                <Link to={`/groups/${id}/edit`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"><FiEdit2 size={16} /></Link>
                <button onClick={handleDeleteGroup} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><FiTrash2 size={16} /></button>
              </>
            )}
            {!isAdmin && (
              <button onClick={handleLeave} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all" title="Leave group"><FiLogOut size={16} /></button>
            )}
            <Link to={`/groups/${id}/add-expense`} className="btn-primary flex items-center gap-2 text-sm"><FiPlus size={15} /> Add Expense</Link>
          </div>
        </div>

        {balances && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card text-center py-4"><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p><p className="text-xl font-bold text-gray-900 dark:text-white">₹{balances.totalExpenses}</p><p className="text-xs text-gray-400 mt-0.5">in INR</p></div>
            <div className="card text-center py-4"><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p><p className="text-xl font-bold text-gray-900 dark:text-white">{balances.expenseCount}</p></div>
            <div className="card text-center py-4"><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Members</p><p className="text-xl font-bold text-gray-900 dark:text-white">{group.members.length}</p></div>
          </div>
        )}

        {isAdmin && group.inviteCode && (
          <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-1">Invite Code (Admin Only)</p>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">{group.inviteCode}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share this with people to invite them</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyInviteCode} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all text-primary-600" title="Copy"><FiCopy size={16} /></button>
                <button onClick={handleRegenInvite} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all text-orange-500" title="Regenerate"><FiRefreshCw size={16} /></button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 'Expenses' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-auto text-sm capitalize cursor-pointer">
                {CATS.map(c => <option key={c} value={c}>{c === 'all' ? '🔍 All Categories' : c}</option>)}
              </select>
              <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="input-field w-auto text-sm cursor-pointer">
                <option value="all">👤 All Members</option>
                {group.members.map(m => <option key={m._id} value={m._id}>{m._id === user._id ? `${m.name} (You)` : m.name}</option>)}
              </select>
            </div>
            {expenses.length === 0 ? (
              <div className="card text-center py-16">
                <FiDollarSign className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No expenses yet</h3>
                <Link to={`/groups/${id}/add-expense`} className="btn-primary inline-flex items-center gap-2 mt-4"><FiPlus size={15} /> Add Expense</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map(exp => {
                  const canEdit = isAdmin || exp.createdBy?._id === user._id || exp.paidBy?._id === user._id
                  return (
                    <div key={exp._id} className="card hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{categoryEmoji[exp.category] || '💰'}</div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-white">{exp.title || exp.description}</p>
                              {exp.currency && exp.currency !== 'INR' && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">{exp.currency}</span>}
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded capitalize">{exp.splitType}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Paid by <span className="font-medium text-gray-700 dark:text-gray-300">{exp.paidBy?._id === user._id ? 'You' : exp.paidBy?.name}</span></p>
                            {exp.notes && <p className="text-xs text-gray-400 italic mt-0.5">{exp.notes}</p>}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {exp.splitBetween?.slice(0, 3).map(s => (
                                <span key={s.user?._id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                  {s.user?._id === user._id ? 'You' : s.user?.name}: {formatAmount(s.amount, exp.currency)}
                                </span>
                              ))}
                              {exp.splitBetween?.length > 3 && <span className="text-xs text-gray-400">+{exp.splitBetween.length - 3} more</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{formatAmount(exp.amount, exp.currency)}</p>
                            <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          </div>
                          {canEdit && (
                            <button onClick={() => handleDeleteExpense(exp._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><FiTrash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Balances' && balances && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <FiInfo size={13} /> Balances include settlements. All amounts in <strong className="text-gray-700 dark:text-gray-300">INR</strong>.
            </div>
            {balances.settlements.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiArrowRight className="text-primary-600" /> Who Owes Whom</h3>
                <div className="space-y-3">
                  {balances.settlements.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">{s.from?.name?.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{s.from?._id === user._id ? 'You' : s.from?.name}</span>{' owes '}<span className="font-semibold">{s.to?._id === user._id ? 'You' : s.to?.name}</span>
                        </p>
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400">₹{s.amount}</span>
                      {s.from?._id === user._id && (
                        <button onClick={() => setSettleTarget(s)} className="btn-primary text-xs py-1.5 px-3">Settle</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiPieChart className="text-primary-600" /> Individual Balances</h3>
              <div className="space-y-3">
                {balances.memberBalances?.map(mb => (
                  <div key={mb.user?._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">{mb.user?.name?.charAt(0)}</div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{mb.user?._id === user._id ? 'You' : mb.user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${mb.balance > 0 ? 'text-green-600 dark:text-green-400' : mb.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {mb.balance > 0 ? `+₹${mb.balance}` : mb.balance < 0 ? `-₹${Math.abs(mb.balance)}` : 'Settled'}
                      </p>
                      <p className="text-xs text-gray-400">{mb.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {settlements.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Settlement History</h3>
                <div className="space-y-2">
                  {settlements.map(s => (
                    <div key={s._id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{s.from?._id === user._id ? 'You' : s.from?.name}</span>{' paid '}<span className="font-semibold">{s.to?._id === user._id ? 'You' : s.to?.name}</span>
                        </p>
                        <p className="text-xs text-gray-400">{new Date(s.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">₹{s.amountInINR ?? s.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {balances.settlements.length === 0 && (
              <div className="card text-center py-8"><p className="text-2xl mb-2">🎉</p><p className="font-semibold text-gray-900 dark:text-white">All settled up!</p></div>
            )}
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiUsers className="text-primary-600" /> Members ({group.members.length})</h3>
            </div>
            <div className="space-y-3">
              {group.members.map(m => (
                <div key={m._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">{m.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{m._id === user._id ? `${m.name} (You)` : m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                  </div>
                  {group.createdBy._id === m._id && <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">Admin</span>}
                  {isAdmin && m._id !== user._id && m._id !== group.createdBy._id && (
                    <button onClick={() => handleRemoveMember(m._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><FiUserMinus size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiActivity className="text-primary-600" /> Group Activity</h3>
            <ActivityFeed activities={activities} loading={activityLoading} />
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetail
