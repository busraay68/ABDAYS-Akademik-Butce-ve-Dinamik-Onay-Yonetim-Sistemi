export const DashboardHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-tide">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">{description}</p>
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);
