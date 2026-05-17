import { BudgetStatusChart } from '../components/charts/BudgetStatusChart';
import { RequestStatusChart } from '../components/charts/RequestStatusChart';
import { ApprovalQueueTable } from '../components/dashboard/ApprovalQueueTable';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatsCard } from '../components/dashboard/StatsCard';
import { SectionCard } from '../components/shared/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export const ApproverDashboardPage = ({ summary, requests }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow={user?.role === 'dean' ? 'Yönetici paneli' : 'Mali işler paneli'}
        title={
          user?.role === 'dean'
            ? 'Yüksek tutarlı talepleri hızlı değerlendirin'
            : 'Onay kuyruğunu operasyonel olarak yönetin'
        }
        actions={
          <Link
            to="/approvals"
            className="focus-ring rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Onay ekranına git
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {summary.stats.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionCard
          title="Onay kuyruğu"
        >
          {requests.length ? (
            <ApprovalQueueTable items={requests} />
          ) : (
            <div className="rounded-2xl bg-mist p-4 text-sm text-slate">
              Bekleyen talep bulunmuyor.
            </div>
          )}
        </SectionCard>
        <RequestStatusChart data={summary.statusChart} />
      </div>

      <BudgetStatusChart
        data={summary.budgetChart}
        title="Bütçe kalemleri ve karar bağlamı"
      />
    </div>
  );
};
