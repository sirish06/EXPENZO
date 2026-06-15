import api from './api'

export const expenseService = {
  add: (data) => api.post('/expenses/add', data),
  getByGroup: (groupId, filters = {}) => {
    const params = new URLSearchParams()
    if (filters.category && filters.category !== 'all') params.append('category', filters.category)
    if (filters.paidBy && filters.paidBy !== 'all') params.append('paidBy', filters.paidBy)
    const query = params.toString()
    return api.get(`/expenses/${groupId}${query ? '?' + query : ''}`)
  },
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
}
