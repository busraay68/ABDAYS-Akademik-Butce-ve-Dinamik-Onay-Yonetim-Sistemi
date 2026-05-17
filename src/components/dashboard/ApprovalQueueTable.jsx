import { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../shared/StatusBadge';

export const ApprovalQueueTable = ({
  items,
  showActions = false,
  onAction,
  activeRequestId,
}) => {
  const [comments, setComments] = useState({});

  return (
    <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mist text-slate">
            <tr>
              <th className="px-5 py-4 font-medium">Referans</th>
              <th className="px-5 py-4 font-medium">Proje</th>
              <th className="px-5 py-4 font-medium">Tutar</th>
              <th className="px-5 py-4 font-medium">Durum</th>
              <th className="px-5 py-4 font-medium">Son Güncelleme</th>
              {showActions && <th className="px-5 py-4 font-medium">Aksiyon</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-ink/6 align-top">
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
                <td className="px-5 py-4 text-slate">{formatDate(item.updatedAt)}</td>
                {showActions && (
                  <td className="px-5 py-4">
                    <div className="min-w-64 space-y-3">
                      <textarea
                        rows="3"
                        value={comments[item.id] ?? ''}
                        onChange={(event) =>
                          setComments((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-3 py-2 text-sm"
                        placeholder="Karar notu"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onAction?.(item, 'approved', comments[item.id] ?? '')}
                          disabled={activeRequestId === item.id}
                          className="focus-ring rounded-xl bg-tide px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAction?.(item, 'revision_requested', comments[item.id] ?? '')
                          }
                          disabled={activeRequestId === item.id}
                          className="focus-ring rounded-xl bg-sand px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50"
                        >
                          Revizyon
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction?.(item, 'rejected', comments[item.id] ?? '')}
                          disabled={activeRequestId === item.id}
                          className="focus-ring rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
