import { db } from '../database.js';
import { getAdminDashboardStats } from './adminService.js';
import { getAccessibleProjects } from './projectService.js';
import { listApprovalQueueForUser, listRequestsForUser } from './requestService.js';

const formatMoney = (value) => Math.round(Number(value) || 0);

const statsForResearcher = (projects, requests) => {
  const totalRemaining = projects.reduce((sum, project) => sum + project.remainingBudget, 0);
  const pendingCount = requests.filter((item) =>
    ['awaiting_finance', 'awaiting_dean'].includes(item.status),
  ).length;
  const revisionCount = requests.filter((item) => item.status === 'revision_requested').length;

  return [
    {
      id: 'active-projects',
      label: 'Aktif proje',
      value: projects.length,
      accent: 'tide',
      hint: 'Araştırmacıya atanmış proje sayısı',
    },
    {
      id: 'remaining-budget',
      label: 'Kalan bütçe',
      value: formatMoney(totalRemaining),
      accent: 'success',
      hint: 'Projelerde kullanılabilir toplam bakiye',
      format: 'currency',
    },
    {
      id: 'pending-requests',
      label: 'Bekleyen talep',
      value: pendingCount,
      accent: 'warning',
      hint: 'Karar sürecindeki talepler',
    },
    {
      id: 'revision-requests',
      label: 'Revizyon',
      value: revisionCount,
      accent: 'coral',
      hint: 'Güncelleme bekleyen talepler',
    },
  ];
};

const statsForApprover = (queue, allRequests) => {
  const approvedCount = allRequests.filter((item) => item.status === 'approved').length;
  const rejectedCount = allRequests.filter((item) => item.status === 'rejected').length;
  const revisionCount = allRequests.filter((item) => item.status === 'revision_requested').length;

  return [
    {
      id: 'queue-count',
      label: 'Karar bekleyen',
      value: queue.length,
      accent: 'warning',
      hint: 'Şu anda aksiyon alınabilecek talepler',
    },
    {
      id: 'approved-count',
      label: 'Onaylanan',
      value: approvedCount,
      accent: 'success',
      hint: 'Tamamlanan süreçler',
    },
    {
      id: 'rejected-count',
      label: 'Reddedilen',
      value: rejectedCount,
      accent: 'danger',
      hint: 'Olumsuz sonuçlanan talepler',
    },
    {
      id: 'revision-count',
      label: 'Revizyon',
      value: revisionCount,
      accent: 'tide',
      hint: 'Araştırmacıya geri dönen talepler',
    },
  ];
};

const buildBudgetChart = (projects) =>
  projects
    .flatMap((project) =>
      project.budgetLines.map((line) => ({
        id: line.id,
        name: `${project.code} · ${line.name}`,
        allocatedAmount: formatMoney(line.allocatedAmount),
        spentAmount: formatMoney(line.spentAmount),
        committedAmount: formatMoney(line.committedAmount),
        availableAmount: formatMoney(line.availableAmount),
      })),
    )
    .slice(0, 8);

const buildStatusChart = (requests) => {
  const labels = {
    draft: 'Taslak',
    awaiting_finance: 'Mali İşler',
    awaiting_dean: 'Dekan',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    revision_requested: 'Revizyon',
  };

  return Object.entries(labels).map(([status, label]) => ({
    id: status,
    name: label,
    value: requests.filter((item) => item.status === status).length,
  }));
};

export const buildDashboardSummary = (user) => {
  if (user.role === 'system_admin') {
    const adminUser = { ...user, role: 'dean' };
    const projects = getAccessibleProjects(adminUser);
    const requests = listRequestsForUser(adminUser);
    return {
      stats: getAdminDashboardStats(),
      budgetChart: buildBudgetChart(projects),
      statusChart: buildStatusChart(requests),
    };
  }

  const projects = getAccessibleProjects(user);
  const requests = listRequestsForUser(
    user.role === 'researcher'
      ? user
      : {
          ...user,
          role: 'dean',
        },
  );
  const queue = user.role === 'researcher' ? [] : listApprovalQueueForUser(user);

  return {
    stats:
      user.role === 'researcher'
        ? statsForResearcher(projects, requests)
        : statsForApprover(queue, requests),
    budgetChart: buildBudgetChart(projects),
    statusChart: buildStatusChart(requests),
  };
};
