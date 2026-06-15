import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { groupService } from '../services/groupService'
import { balanceService } from '../services/balanceService'
import { activityService } from '../services/activityService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import {
  FiUsers, FiArrowUpRight, FiArrowDownLeft, FiTrendingUp,
  FiPlus, FiChevronRight, FiUserPlus, FiActivity
} from 'react-icons/fi'
import Navbar from '../components/Navbar'
import ActivityFeed from '../components/ActivityFeed'

/* ── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, amount, gradient, subtitle, delay = 0 }) => (
  <div
    className="card card-hover animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: gradient }}
      >
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
          ₹{typeof amount === 'number' ? amount.toFixed(2) : '0.00'}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
)

/* ── Join Group Modal ───────────────────────────────────── */
const JoinGroupModal = ({ onClose, onJoined }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!code.trim()) { toast.error('Enter an invite code'); return }
    setLoading(true)
    try {
      const { data } = await groupService.join(code.trim())
      toast.success(`Joined "${data.name}" successfully! 🎉`)
      onJoined(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in border border-white/60 dark:border-gray-700/50"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Join a Group</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
          Enter the 8-character invite code shared by a group admin
        </p>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
            maxLength={8}
            className="input-field text-center text-xl font-mono tracking-widest"
            autoFocus
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Dashboard ──────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [summary, setSummary] = useState({ totalOwed: 0, totalOwing: 0, netBalance: 0 })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [groupsRes, summaryRes] = await Promise.all([
          groupService.getAll(),
          balanceService.getUserSummary()
        ])
        setGroups(groupsRes.data)
        setSummary(summaryRes.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    const loadActivity = async () => {
      try {
        const { data } = await activityService.getUserFeed()
        setActivities(data.slice(0, 10))
      } catch { /* silently fail */ }
      finally { setActivityLoading(false) }
    }
    load()
    loadActivity()
  }, [])

  const handleGroupJoined = (newGroup) => setGroups(prev => [newGroup, ...prev])

  if (loading) return (
    <div className="page">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
             style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar />
      {showJoin && <JoinGroupModal onClose={() => setShowJoin(false)} onJoined={handleGroupJoined} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
              Here's your Expenzo overview
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiUserPlus size={15} />
              <span className="hidden sm:inline">Join Group</span>
            </button>
            <Link to="/groups/new" className="btn-primary flex items-center gap-2 text-sm">
              <FiPlus size={15} />
              <span className="hidden sm:inline">New Group</span>
            </Link>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={FiArrowUpRight}
            label="You are owed"
            amount={summary.totalOwed}
            gradient="linear-gradient(135deg, #10b981, #059669)"
            subtitle="total across all groups"
            delay={0}
          />
          <StatCard
            icon={FiArrowDownLeft}
            label="You owe"
            amount={summary.totalOwing}
            gradient="linear-gradient(135deg, #f43f5e, #e11d48)"
            subtitle="total across all groups"
            delay={80}
          />
          <StatCard
            icon={FiTrendingUp}
            label="Net balance"
            amount={Math.abs(summary.netBalance)}
            gradient={
              summary.netBalance >= 0
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'linear-gradient(135deg, #f97316, #ea580c)'
            }
            subtitle={summary.netBalance >= 0 ? 'in your favor' : 'you owe more'}
            delay={160}
          />
        </div>

        {/* ── Main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Groups */}
          <div className="lg:col-span-2 card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <FiUsers className="text-white" size={14} />
                </div>
                Your Groups
              </h2>
              <Link
                to="/groups"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold flex items-center gap-1 transition-colors"
              >
                View all <FiChevronRight size={14} />
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-gray-400" size={28} />
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No groups yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Create or join a group to start splitting expenses
                </p>
                <div className="flex gap-2 justify-center">
                  <Link to="/groups/new" className="btn-primary inline-flex items-center gap-2 text-sm">
                    <FiPlus size={14} /> Create Group
                  </Link>
                  <button onClick={() => setShowJoin(true)} className="btn-secondary inline-flex items-center gap-2 text-sm">
                    <FiUserPlus size={14} /> Join Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {groups.slice(0, 6).map((group, i) => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="flex items-center justify-between py-3.5 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 -mx-2 px-2 rounded-xl transition-all duration-200 group/item"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${(i * 47 + 260) % 360}, 70%, 55%), hsl(${(i * 47 + 290) % 360}, 70%, 45%))`
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{group.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{group.members.length} members</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.createdBy._id === user._id && (
                        <span className="badge badge-primary">Admin</span>
                      )}
                      <FiChevronRight
                        className="text-gray-300 group-hover/item:text-primary-500 transition-colors"
                        size={16}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="card animate-fade-in-up" style={{ animationDelay: '280ms' }}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <FiActivity className="text-white" size={14} />
              </div>
              Recent Activity
            </h2>
            <ActivityFeed activities={activities} loading={activityLoading} showGroup />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
