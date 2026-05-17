import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../shared/StatusBadge';

export const RequestHistoryTable = ({ items }) => (
  <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-white">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-mist text-slate">
          <tr>
            <th className="px-5 py-4 font-medium">Referans</th>
            <th className="px-5 py-4 font-medium">Proje / Kalem</th>
            <th className="px-5 py-4 font-medium">Tutar</th>
            <th className="px-5 py-4 font-medium">Durum</th>
            <th className="px-5 py-4 font-medium">Son Not</th>
            <th className="px-5 py-4 font-medium">Güncelleme</th>
            <th className="px-5 py-4 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const canEdit = ['draft', 'revision_requested'].includes(item.status);

            return (
              <tr key={item.id} className="border-t border-ink/6">
                <td className="px-5 py-4 font-medium text-ink">{item.referenceNo}</td>
                <td className="px-5 py-4 text-slate">
                  <p>{item.projectTitle}</p>
                  <p className="mt-1 text-xs text-slate/80">
                    {item.itemName} · {item.budgetCategoryName} · {item.priorityName}
                  </p>
                </td>
                <td className="px-5 py-4 text-ink">{formatCurrency(item.totalAmount)}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-4 text-slate">{item.lastComment ?? '-'}</td>
                <td className="px-5 py-4 text-slate">{formatDate(item.updatedAt)}</td>
                <td className="px-5 py-4">
                  {canEdit ? (
                    <Link
                      to={`/requests/new?requestId=${item.id}`}
                      className="focus-ring inline-flex rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
                    >
                      Düzenle
                    </Link>
                  ) : (
                    <span className="text-xs text-slate">Salt okunur</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
