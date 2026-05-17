import { http } from './http';

export const notificationService = {
  async fetchNotifications() {
    const { data } = await http.get('/notifications');
    return data;
  },

  async markAllAsRead() {
    const { data } = await http.post('/notifications/read-all');
    return data;
  },

  async markAsRead(notificationId) {
    const { data } = await http.post(`/notifications/${notificationId}/read`);
    return data;
  },
};
