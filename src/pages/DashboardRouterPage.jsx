import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../services/projectService';
import { requestService } from '../services/requestService';
import { AdminDashboardPage } from './AdminDashboardPage';
import { ApproverDashboardPage } from './ApproverDashboardPage';
import { ResearcherDashboardPage } from './ResearcherDashboardPage';

const NonAdminDashboard = ({ user }) => {
  const [state, setState] = useState({
    summary: null,
    projects: [],
    requests: [],
    isLoading: true,
    error: '',
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [summary, projects, requests] = await Promise.all([
          projectService.fetchDashboardSummary(),
          user.role === 'researcher' ? projectService.fetchProjects() : Promise.resolve([]),
          user.role === 'researcher'
            ? requestService.fetchRequests()
            : requestService.fetchApprovalQueue({ role: user.role }),
        ]);

        if (isMounted) {
          setState({
            summary,
            projects,
            requests,
            isLoading: false,
            error: '',
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            summary: null,
            projects: [],
            requests: [],
            isLoading: false,
            error:
              error.response?.data?.message ??
              'Genel görünüm verileri şu anda alınamadı.',
          });
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user.role]);

  if (state.isLoading || !state.summary) {
    if (!state.isLoading && state.error) {
      return (
        <SectionCard title="Bağlantı hatası">
          <p className="text-sm text-danger">{state.error}</p>
        </SectionCard>
      );
    }

    return <LoadingSpinner label="Dashboard verileri hazırlanıyor..." />;
  }

  if (user.role === 'researcher') {
    return (
      <ResearcherDashboardPage
        summary={state.summary}
        projects={state.projects}
        requests={state.requests}
      />
    );
  }

  return <ApproverDashboardPage summary={state.summary} requests={state.requests} />;
};

export const DashboardRouterPage = () => {
  const { user } = useAuth();

  if (user.role === 'system_admin') {
    return <AdminDashboardPage />;
  }

  return <NonAdminDashboard user={user} />;
};
