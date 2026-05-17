import { statusLabels, statusStyles } from '../../utils/formatters';

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? 'bg-slate/10 text-slate'}`}
  >
    {statusLabels[status] ?? status}
  </span>
);
