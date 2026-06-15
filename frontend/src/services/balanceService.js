import api from './api'

export const balanceService = {
  getGroupBalances: (groupId) => api.get(`/balances/${groupId}`),
  getUserSummary: () => api.get('/balances/user/summary')
}
