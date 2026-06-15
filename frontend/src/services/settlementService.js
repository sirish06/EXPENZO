import api from './api'

export const settlementService = {
  create: (data) => api.post('/settlements', data),
  getByGroup: (groupId) => api.get(`/settlements/${groupId}`)
}
