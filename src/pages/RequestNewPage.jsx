import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PurchaseRequestForm } from '../components/forms/PurchaseRequestForm';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { projectService } from '../services/projectService';
import { requestService } from '../services/requestService';

export const RequestNewPage = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const [projects, setProjects] = useState([]);
  const [referenceData, setReferenceData] = useState({
    budgetCategories: [],
    procurementMethods: [],
    priorities: [],
    catalogItems: [],
  });
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      projectService.fetchProjects(),
      projectService.fetchRequestFormReferenceData(),
      requestId ? requestService.fetchRequestById(requestId) : Promise.resolve(null),
    ])
      .then(([items, formReferenceData, currentRequest]) => {
        setProjects(items);
        setReferenceData(formReferenceData);
        setRequest(currentRequest);
        setError('');
        setIsLoading(false);
      })
      .catch((projectError) => {
        setError(
          projectError.response?.data?.message ??
            'Talep formu için gerekli veriler şu anda yüklenemedi.',
        );
        setIsLoading(false);
      });
  }, [requestId]);

  if (isLoading) {
    return <LoadingSpinner label="Form için proje listesi yükleniyor..." />;
  }

  if (error) {
    return (
      <SectionCard title="Bağlantı hatası">
        <p className="text-sm text-danger">{error}</p>
      </SectionCard>
    );
  }

  return (
    <PurchaseRequestForm
      projects={projects}
      referenceData={referenceData}
      initialRequest={request}
    />
  );
};
