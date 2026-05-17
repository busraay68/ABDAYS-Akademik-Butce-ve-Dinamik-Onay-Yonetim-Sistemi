import { CalendarRange, TriangleAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const riskMap = {
  normal: 'bg-success/10 text-success',
  watch: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
};

export const ProjectCard = ({ project }) => (
  <article className="soft-card rounded-[28px] p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate">{project.code}</p>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink">{project.title}</h3>
      </div>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskMap[project.riskLevel]}`}
      >
        {project.fundSource}
      </span>
    </div>

    <div className="mt-5 grid gap-3 text-sm text-slate sm:grid-cols-2">
      <div className="rounded-2xl bg-mist p-4">
        <p>Toplam bütçe</p>
        <p className="mt-2 font-semibold text-ink">{formatCurrency(project.totalBudget)}</p>
      </div>
      <div className="rounded-2xl bg-mist p-4">
        <p>Kalan bakiye</p>
        <p className="mt-2 font-semibold text-ink">{formatCurrency(project.remainingBudget)}</p>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate">
      <span className="inline-flex items-center gap-2">
        <CalendarRange className="size-4" />
        {formatDate(project.startDate)} - {formatDate(project.endDate)}
      </span>
      {project.riskLevel !== 'normal' && (
        <span className="inline-flex items-center gap-2 text-danger">
          <TriangleAlert className="size-4" />
          Kritik kalemler yakından izlenmeli
        </span>
      )}
    </div>
  </article>
);
