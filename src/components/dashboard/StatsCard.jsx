import { formatCompactNumber, formatCurrency } from '../../utils/formatters';

export const StatsCard = ({ item }) => {
  const value = item.format === 'currency' ? formatCurrency(item.value) : formatCompactNumber(item.value);

  return (
    <article className="soft-card rounded-[28px] p-5">
      <p className="text-sm text-slate">{item.label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-3 text-sm text-tide">{item.hint}</p>
    </article>
  );
};
