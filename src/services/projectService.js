import { http } from './http';

export const projectService = {
  async fetchProjects(params = {}) {
    const { data } = await http.get('/projects', { params });
    return Array.isArray(data) ? data : data.items ?? [];
  },

  async fetchRequestFormReferenceData() {
    const { data } = await http.get('/reference-data/request-form');

    return {
      budgetCategories: data.budgetCategories ?? [],
      procurementMethods: data.procurementMethods ?? [],
      priorities: data.priorities ?? [],
      catalogItems: data.catalogItems ?? [],
    };
  },

  async fetchDashboardSummary() {
    const { data } = await http.get('/dashboard/summary');

    return {
      stats: data.stats ?? [],
      budgetChart: data.budgetChart ?? [],
      statusChart: data.statusChart ?? [],
    };
  },
};
