import { http } from './http';

const toRequestFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'attachment') {
      formData.append('attachment', value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const requestService = {
  async fetchRequests(filters = {}) {
    const { data } = await http.get('/requests', { params: filters });
    return Array.isArray(data) ? data : data.items ?? [];
  },

  async fetchRequestById(requestId) {
    const { data } = await http.get(`/requests/${requestId}`);
    return data;
  },

  async fetchApprovalQueue(filters = {}) {
    const { data } = await http.get('/approvals/queue', { params: filters });
    return Array.isArray(data) ? data : data.items ?? [];
  },

  async createRequest(payload) {
    const { data } = await http.post('/requests', toRequestFormData(payload));
    return data;
  },

  async updateRequest(requestId, payload) {
    const { data } = await http.put(`/requests/${requestId}`, toRequestFormData(payload));
    return data;
  },

  async submitApprovalAction(requestId, payload) {
    const { data } = await http.post(`/approvals/${requestId}/actions`, payload);
    return data;
  },
};
