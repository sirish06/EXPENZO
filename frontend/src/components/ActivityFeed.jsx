import { FiClock, FiActivity } from 'react-icons/fi'

const actionLabels = {
  expense_added:      { label: 'added an expense',      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30',   emoji: '💸' },
  expense_updated:    { label: 'updated an expense',    color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30',           emoji: '✏️' },
  expense_deleted:    { label: 'deleted an expense',    color: 'text-red-500 dark:text-red-400',         bg: 'bg-red-100 dark:bg-red-900/30',             emoji: '🗑️' },
  settlement_created: { label: 'settled up',            color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-100 dark:bg-violet-900/30',       emoji: '✅' },
  member_joined:      { label: 'joined the group',      color: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-100 dark:bg-teal-900/30',           emoji: '🎉' },
  member_left:        { label: 'left the group',        color: 'text-orange-500 dark:text-orange-400',   bg: 'bg-orange-100 dark:bg-orange-900/30',       emoji: '👋' },
  member_removed:     { label: 'was removed',           color: 'text-red-500 dark:text-red-400',         bg: 'bg-red-100 dark:bg-red-900/30',             emoji: '🚫' },
  group_created:      { label: 'created the group',     color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30',     emoji: '🏁' },
  group_updated:      { label: 'updated group details', color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800',              emoji: '⚙️' },
}

const formatDetails = (action, details) => {
  if (!details) return ''
  if (action === 'expense_added' || action === 'expense_updated') {
    const sym = details.currency === 'INR' ? '₹' : `${details.currency} `
    return details.title ? ` — "${details.title}" for ${sym}${details.amount}` : ''
  }
  if (action === 'expense_deleted') return details.title ? ` — "${details.title}"` : ''
  if (action === 'settlement_created') return details.amount ? ` — ₹${(details.amountInINR || details.amount).toFixed(2)}` : ''
  if (action === 'group_created' || action === 'group_updated') return details.groupName ? ` "${details.groupName}"` : ''
  return ''
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* Skeleton loader for activity */
const ActivitySkeleton = () => (
  <div className="space-y-3">
    {[1,2,3].map(i => (
      <div key={i} className="flex items-start gap-3 p-3">
        <div className="w-8 h-8 skeleton rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 skeleton w-3/4" />
          <div className="h-2.5 skeleton w-1/4" />
        </div>
      </div>
    ))}
  </div>
)

const ActivityFeed = ({ activities = [], loading = false, showGroup = false }) => {
  if (loading) return <ActivitySkeleton />

  if (activities.length === 0) return (
    <div className="text-center py-10">
      <FiActivity className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
      <p className="text-gray-500 dark:text-gray-400 text-sm">No activity yet</p>
    </div>
  )

  return (
    <div className="space-y-1">
      {activities.map((act, i) => {
        const meta = actionLabels[act.action] || {
          label: act.action, color: 'text-gray-500',
          bg: 'bg-gray-100 dark:bg-gray-800', emoji: '📌'
        }
        return (
          <div
            key={act._id || i}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center text-sm flex-shrink-0`}>
              {meta.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {act.user?.name || 'Someone'}
                </span>
                {' '}
                <span className={meta.color}>{meta.label}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatDetails(act.action, act.details)}
                </span>
                {showGroup && act.groupId?.name && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {' '}in <span className="font-medium text-gray-600 dark:text-gray-300">{act.groupId.name}</span>
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <FiClock size={10} className="text-gray-400" />
                <span className="text-xs text-gray-400">{timeAgo(act.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ActivityFeed
