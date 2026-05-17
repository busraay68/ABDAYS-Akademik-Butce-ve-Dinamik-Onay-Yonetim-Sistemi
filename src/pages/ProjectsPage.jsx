import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { projectService } from '../services/projectService';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService
      .fetchProjects()
      .then((items) => {
        setProjects(items);
        setError('');
        setIsLoading(false);
      })
      .catch((projectError) => {
        setError(
          projectError.response?.data?.message ??
          'Projeler şu anda yüklenemedi. Lütfen kısa süre sonra tekrar deneyin.',
        );
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Projeler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Proje görünümü"
        title="Aktif projeler ve bütçe sinyalleri"
      />
      {error ? (
        <SectionCard title="Bağlantı hatası">
          <p className="text-sm text-danger">{error}</p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
