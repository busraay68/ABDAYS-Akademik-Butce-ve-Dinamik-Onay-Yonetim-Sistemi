import { useEffect, useState } from 'react';
import { BudgetStatusChart } from '../components/charts/BudgetStatusChart';
import { RequestStatusChart } from '../components/charts/RequestStatusChart';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { projectService } from '../services/projectService';
import { useAuth } from '../hooks/useAuth';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService
      .fetchDashboardSummary()
      .then((data) => {
        setSummary(data);
        setError('');
      })
      .catch((summaryError) => {
        setError(
          summaryError.response?.data?.message ??
            'Rapor verileri şu anda yüklenemedi.',
        );
      });
  }, [user.role]);

  if (!summary) {
    if (error) {
      return (
        <SectionCard title="Bağlantı hatası">
          <p className="text-sm text-danger">{error}</p>
        </SectionCard>
      );
    }

    return <LoadingSpinner label="Rapor verileri hazırlanıyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Raporlama"
        title="Grafik ve tablo odaklı özet ekran"
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <BudgetStatusChart data={summary.budgetChart} />
        <RequestStatusChart data={summary.statusChart} />
      </div>
      <SectionCard
        title="Durum özeti"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {summary.statusChart.map((item) => (
            <div key={item.id} className="rounded-2xl bg-mist p-5">
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="mt-2 text-sm text-slate">
                Bu durumdaki toplam talep sayısı: <span className="font-semibold">{item.value}</span>
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
