import api from './api'

export const groupService = {
  create: (data) => api.post('/groups/create', data),
  join: (inviteCode) => api.post('/groups/join', { inviteCode }),
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  regenInvite: (id) => api.post(`/groups/${id}/regen-invite`),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  leave: (id) => api.post(`/groups/${id}/leave`)
}
