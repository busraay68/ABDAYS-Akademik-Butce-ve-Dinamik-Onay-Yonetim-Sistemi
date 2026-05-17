import { Link } from 'react-router-dom';
import { BudgetStatusChart } from '../components/charts/BudgetStatusChart';
import { RequestStatusChart } from '../components/charts/RequestStatusChart';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { StatsCard } from '../components/dashboard/StatsCard';
import { SectionCard } from '../components/shared/SectionCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { formatCurrency } from '../utils/formatters';

export const ResearcherDashboardPage = ({ summary, projects, requests }) => (
  <div className="space-y-6">
    <DashboardHeader
      eyebrow="Araştırmacı paneli"
      title="Proje bütçelerini izleyin, talep oluşturun"
      actions={
        <Link
          to="/requests/new"
          className="focus-ring rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Yeni talep oluştur
        </Link>
      }
    />

    <div className="grid gap-4 lg:grid-cols-3">
      {summary.stats.map((item) => (
        <StatsCard key={item.id} item={item} />
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <BudgetStatusChart data={summary.budgetChart} />
      <RequestStatusChart data={summary.statusChart} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard
        title="Projelerim"
      >
        {projects.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-mist p-4 text-sm text-slate">
            Gösterilecek proje bulunmuyor.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Son talepler"
      >
        {requests.length ? (
          <div className="space-y-4">
            {requests.slice(0, 4).map((request) => (
              <article key={request.id} className="rounded-2xl bg-mist p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{request.referenceNo}</p>
                    <p className="mt-1 text-sm text-slate">{request.itemName}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-3 text-sm text-slate">
                  {request.projectTitle} · {formatCurrency(request.totalAmount)}
                </p>
                {request.lastComment && (
                  <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-ink">
                    {request.lastComment}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-mist p-4 text-sm text-slate">
            Son talep kaydı bulunmuyor.
          </div>
        )}
      </SectionCard>
    </div>
  </div>
);
