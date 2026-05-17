import { useEffect, useState } from 'react';
import { BudgetStatusChart } from '../components/charts/BudgetStatusChart';
import { RequestStatusChart } from '../components/charts/RequestStatusChart';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatsCard } from '../components/dashboard/StatsCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../services/projectService';
import { adminService } from '../services/adminService';
import { Link } from 'react-router-dom';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState({
    summary: null,
    isLoading: true,
    error: '',
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const summary = await projectService.fetchDashboardSummary();
        if (isMounted) {
          setState({ summary, isLoading: false, error: '' });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            summary: null,
            isLoading: false,
            error: error.response?.data?.message ?? 'Yönetim verileri yüklenemedi.',
          });
        }
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (state.isLoading || !state.summary) {
    if (!state.isLoading && state.error) {
      return (
        <SectionCard title="Bağlantı hatası">
          <p className="text-sm text-danger">{state.error}</p>
        </SectionCard>
      );
    }
    return <LoadingSpinner label="Yönetim paneli yükleniyor..." />;
  }

  const { summary } = state;
  const quickActions = [
    { to: '/admin/users', label: 'Kullanıcı Yönetimi', desc: 'Hesap oluştur, rol ve durum değiştir' },
    { to: '/admin/projects', label: 'Proje Yönetimi', desc: 'Proje ata, bütçe güncelle' },
    { to: '/admin/approval-rules', label: 'Onay Kuralları', desc: 'Kural tanımla ve düzenle' },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Sistem yöneticisi paneli"
        title="Kullanıcı, proje ve onay süreçlerini merkezi olarak yönetin"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summary.stats.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>

      <SectionCard
        title="Hızlı işlemler"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-2xl border border-ink/8 bg-gradient-to-br from-white to-mist p-5 transition hover:shadow-soft hover:-translate-y-0.5"
            >
              <p className="font-display text-base font-semibold text-ink group-hover:text-tide transition">
                {action.label}
              </p>
              <p className="mt-1 text-sm text-slate">{action.desc}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <BudgetStatusChart data={summary.budgetChart} title="Tüm projeler · bütçe dağılımı" />
        <RequestStatusChart data={summary.statusChart} />
      </div>
    </div>
  );
};
