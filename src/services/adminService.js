import { http } from './http';

export const adminService = {
  // Dashboard
  async fetchAdminDashboard() {
    const { data } = await http.get('/admin/dashboard');
    return data;
  },

  // Users (FR-02, FR-08)
  async fetchUsers() {
    const { data } = await http.get('/admin/users');
    return data.items ?? [];
  },

  async createUser(payload) {
    const { data } = await http.post('/admin/users', payload);
    return data.user;
  },

  async updateUser(userId, payload) {
    const { data } = await http.patch(`/admin/users/${userId}`, payload);
    return data.user;
  },

  // Projects (FR-51)
  async fetchAllProjects() {
    const { data } = await http.get('/admin/projects');
    return data.items ?? [];
  },

  async assignProject(payload) {
    const { data } = await http.post('/admin/projects', payload);
    return data.project;
  },

  // Budget (FR-15)
  async updateProjectBudget(projectId, payload) {
    const { data } = await http.patch(`/admin/projects/${projectId}/budget`, payload);
    return data.project;
  },

  // Approval rules (FR-29)
  async fetchApprovalRules() {
    const { data } = await http.get('/admin/approval-rules');
    return data.items ?? [];
  },

  async createApprovalRule(payload) {
    const { data } = await http.post('/admin/approval-rules', payload);
    return data.items ?? [];
  },

  async updateApprovalRule(ruleId, payload) {
    const { data } = await http.patch(`/admin/approval-rules/${ruleId}`, payload);
    return data.items ?? [];
  },

  async deleteApprovalRule(ruleId) {
    const { data } = await http.delete(`/admin/approval-rules/${ruleId}`);
    return data.items ?? [];
  },

  // Reference data
  async fetchResearchers() {
    const { data } = await http.get('/admin/researchers');
    return data.items ?? [];
  },

  async fetchBudgetCategories() {
    const { data } = await http.get('/admin/budget-categories');
    return data.items ?? [];
  },
};
