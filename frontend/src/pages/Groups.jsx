import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { groupService } from '../services/groupService'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { FiPlus, FiUsers, FiTrash2, FiEdit2, FiChevronRight, FiSearch } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const categoryStyles = {
  trip:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  home:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  office: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  food:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  other:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

const GroupSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 skeleton rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 skeleton w-2/3" />
        <div className="h-3 skeleton w-1/3" />
      </div>
    </div>
  </div>
)

const Groups = () => {
  const [groups, setGroups] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => { fetchGroups() }, [])
  useEffect(() => {
    setFiltered(groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())))
  }, [search, groups])

  const fetchGroups = async () => {
    try {
      const { data } = await groupService.getAll()
      setGroups(data); setFiltered(data)
    } catch { toast.error('Failed to load groups') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id, e) => {
    e.preventDefault()
    if (!window.confirm('Delete this group and all its expenses?')) return
    try {
      await groupService.delete(id)
      setGroups(prev => prev.filter(g => g._id !== id))
      toast.success('Group deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {groups.length} {groups.length === 1 ? 'group' : 'groups'} total
            </p>
          </div>
          <Link to="/groups/new" className="btn-primary flex items-center gap-2 text-sm">
            <FiPlus size={16} /> New Group
          </Link>
        </div>

        <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            id="groups-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4">{[1,2,3].map(i => <GroupSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUsers className="text-gray-400" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">No groups found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {search ? 'Try a different search term' : 'Create your first group to get started'}
            </p>
            {!search && (
              <Link to="/groups/new" className="btn-primary inline-flex items-center gap-2 text-sm">
                <FiPlus size={15} /> Create Group
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((group, i) => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="card card-hover flex items-center justify-between animate-fade-in-up group/card"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, hsl(${(i*47+260)%360},70%,55%), hsl(${(i*47+290)%360},70%,45%))` }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{group.description}</p>
                    )}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiUsers size={11} /> {group.members.length} members
                      </span>
                      <span className={`badge text-xs ${categoryStyles[group.category] || categoryStyles.other}`}>
                        {group.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {group.createdBy._id === user._id && (
                    <>
                      <Link
                        to={`/groups/${group._id}/edit`}
                        onClick={e => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
                      >
                        <FiEdit2 size={15} />
                      </Link>
                      <button
                        onClick={e => handleDelete(group._id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </>
                  )}
                  <FiChevronRight className="text-gray-300 group-hover/card:text-primary-500 transition-colors ml-1" size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Groups
