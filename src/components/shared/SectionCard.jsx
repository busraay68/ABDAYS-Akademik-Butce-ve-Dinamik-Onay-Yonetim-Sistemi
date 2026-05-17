export const SectionCard = ({ title, description, action, children, className = '' }) => (
  <section className={`soft-card rounded-[28px] p-6 ${className}`}>
    {(title || description || action) && (
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          {title && <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>}
          {description && <p className="mt-1 text-sm text-slate">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);
