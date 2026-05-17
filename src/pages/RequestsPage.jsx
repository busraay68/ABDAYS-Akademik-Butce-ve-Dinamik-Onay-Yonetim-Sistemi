import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { RequestHistoryTable } from '../components/requests/RequestHistoryTable';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { requestService } from '../services/requestService';

export const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    requestService
      .fetchRequests()
      .then((items) => {
        setRequests(items);
        setError('');
        setIsLoading(false);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ??
            'Talep geçmişi şu anda yüklenemedi.',
        );
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Talep geçmişi yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Talep takibi"
        title="Taslak, revizyon ve sonuçlanan talepleri yönetin"
      />
      <SectionCard
        title="Talep listesi"
      >
        {error ? (
          <div className="rounded-2xl bg-danger/10 p-5 text-sm text-danger">{error}</div>
        ) : requests.length ? (
          <RequestHistoryTable items={requests} />
        ) : (
          <div className="rounded-2xl bg-mist p-5 text-sm text-slate">
            Henüz kayıtlı talep bulunmuyor.
          </div>
        )}
      </SectionCard>
    </div>
  );
};
