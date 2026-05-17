import { Bell } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { getNotificationStrategy } from '../../utils/notificationStrategies';

export const NotificationsPopover = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkAllAsRead,
  onOpenNotification,
}) => (
  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[360px] rounded-[28px] border border-ink/10 bg-white p-4 shadow-soft">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-display text-lg font-semibold text-ink">Bildirimler</p>
        <p className="text-sm text-slate">
          {Number(unreadCount) > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
        </p>
      </div>
      <button
        type="button"
        onClick={onMarkAllAsRead}
        className="focus-ring rounded-xl border border-ink/10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-mist"
      >
        Tümünü okundu yap
      </button>
    </div>

    <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl bg-mist p-8 text-sm text-slate">
          <div className="size-5 animate-spin rounded-full border-2 border-tide border-t-transparent" />
          <span className="ml-3">Bildirimler yükleniyor...</span>
        </div>
      ) : notifications.length ? (
        notifications.map((item) => {
          const strategy = getNotificationStrategy(item.type);
          const Icon = strategy.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenNotification(item)}
              className={`group w-full rounded-2xl border p-4 text-left transition ${item.isRead
                ? 'border-ink/5 bg-white text-slate'
                : 'border-ink/10 bg-mist/30 text-ink'
                } hover:border-ink/20 hover:bg-mist/50`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-xl ${strategy.bgClass} p-2 ${strategy.colorClass}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-tight">{item.title}</p>
                    {!item.isRead ? (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-tide" />
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate line-clamp-2">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate/60">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          );
        })
      ) : (
        <div className="rounded-2xl bg-mist p-8 text-center text-sm text-slate">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="size-6 text-slate/30" />
          </div>
          <p className="mt-4">Şu anda yeni bildiriminiz bulunmuyor.</p>
        </div>
      )}
    </div>
  </div>
);
