import { useEffect, useState } from 'react';
import { ApprovalQueueTable } from '../components/dashboard/ApprovalQueueTable';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { requestService } from '../services/requestService';

export const ApprovalsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRequestId, setActiveRequestId] = useState('');

  const loadQueue = () => {
    setIsLoading(true);
    requestService
      .fetchApprovalQueue({ role: user.role })
      .then((items) => {
        setRequests(items);
        setError('');
        setIsLoading(false);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ??
            'Onay kuyruğu şu anda yüklenemedi.',
        );
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadQueue();
  }, [user.role]);

  const handleAction = async (request, action, comment) => {
    setActiveRequestId(request.id);

    try {
      await requestService.submitApprovalAction(request.id, { action, comment });
      loadQueue();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? 'Karar kaydedilemedi. Lütfen tekrar deneyin.',
      );
    } finally {
      setActiveRequestId('');
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Onay kuyruğu yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Onay işlemleri"
        title="Bekleyen talepleri filtreleyin ve karar verin"
        description="Bekleyen talepleri inceleyin, not ekleyin ve kararınızı kaydedin."
      />
      <SectionCard
        title="Onay tablosu"
        description="Aksiyonlar semantik button elemanlarıyla klavye erişimine uygundur."
      >
        {error ? (
          <div className="rounded-2xl bg-danger/10 p-5 text-sm text-danger">{error}</div>
        ) : null}
        {requests.length ? (
          <ApprovalQueueTable
            items={requests}
            showActions
            onAction={handleAction}
            activeRequestId={activeRequestId}
          />
        ) : (
          <div className="rounded-2xl bg-mist p-5 text-sm text-slate">
            Bu rol için bekleyen talep bulunmuyor.
          </div>
        )}
      </SectionCard>
    </div>
  );
};
