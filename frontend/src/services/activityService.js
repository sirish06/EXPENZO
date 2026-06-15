import api from './api'

export const activityService = {
  getGroupFeed: (groupId) => api.get(`/activity/${groupId}`),
  getUserFeed: () => api.get('/activity/user/feed')
}
