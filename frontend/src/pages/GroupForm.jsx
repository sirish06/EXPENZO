import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { groupService } from '../services/groupService'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { FiUsers, FiCheck, FiArrowLeft, FiCopy } from 'react-icons/fi'

const GroupForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({ name: '', description: '' })
  const [allUsers, setAllUsers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [createdGroup, setCreatedGroup] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: users } = await authService.getUsers()
        setAllUsers(users)
        if (isEdit) {
          const { data: group } = await groupService.getById(id)
          setForm({ name: group.name, description: group.description || '' })
          const memberIds = group.members.map(m => m._id).filter(mid => mid !== user._id)
          setSelectedMembers(memberIds)
        }
      } catch { toast.error('Failed to load data') }
      finally { setFetching(false) }
    }
    init()
  }, [id])

  const toggleMember = (userId) => {
    setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Group name is required'); return }
    setLoading(true)
    try {
      const payload = { ...form, members: selectedMembers }
      if (isEdit) {
        await groupService.update(id, payload)
        toast.success('Group updated!')
        navigate(`/groups/${id}`)
      } else {
        const { data } = await groupService.create(payload)
        toast.success('Group created! 🎉')
        setCreatedGroup(data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group')
    } finally { setLoading(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(createdGroup.inviteCode)
    toast.success('Invite code copied!')
  }

  if (fetching) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  // Show success state with invite code after creation
  if (createdGroup) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="card text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Group Created!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Share this invite code so others can join <strong>{createdGroup.name}</strong></p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Invite Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-primary-600 dark:text-primary-400 tracking-widest">{createdGroup.inviteCode}</span>
              <button onClick={copyCode} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                <FiCopy size={18} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Others can join by going to Dashboard → Join Group and entering this code.</p>
          <button onClick={() => navigate(`/groups/${createdGroup._id}`)} className="btn-primary w-full">
            Go to Group
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <FiArrowLeft size={18} /> Back
        </button>
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEdit ? 'Edit Group' : 'Create New Group'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Group Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Goa Trip 2024" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Members ({selectedMembers.length} selected)
              </label>
              {allUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No other users registered yet. Share the invite code after creating.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                  {allUsers.map(u => (
                    <div key={u._id} onClick={() => toggleMember(u._id)} className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMembers.includes(u._id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedMembers.includes(u._id) && <FiCheck size={11} className="text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                <FiUsers size={11} /> You are automatically added as admin
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isEdit ? 'Save Changes' : 'Create Group')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default GroupForm
