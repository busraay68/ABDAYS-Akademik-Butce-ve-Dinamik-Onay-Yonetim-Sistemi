import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { AppShell } from '../layouts/AppShell';
import { AdminApprovalRulesPage } from '../pages/AdminApprovalRulesPage';
import { AdminProjectsPage } from '../pages/AdminProjectsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { DashboardRouterPage } from '../pages/DashboardRouterPage';
import { LoginPage } from '../pages/LoginPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ReportsPage } from '../pages/ReportsPage';
import { RequestNewPage } from '../pages/RequestNewPage';
import { RequestsPage } from '../pages/RequestsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardRouterPage />,
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute roles={['researcher']}>
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests/new',
        element: (
          <ProtectedRoute roles={['researcher']}>
            <RequestNewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests',
        element: (
          <ProtectedRoute roles={['researcher']}>
            <RequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <ProtectedRoute roles={['finance_specialist', 'dean']}>
            <ApprovalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      // ── Admin routes ────────────────────────────────────
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute roles={['system_admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/projects',
        element: (
          <ProtectedRoute roles={['system_admin']}>
            <AdminProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/approval-rules',
        element: (
          <ProtectedRoute roles={['system_admin']}>
            <AdminApprovalRulesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
