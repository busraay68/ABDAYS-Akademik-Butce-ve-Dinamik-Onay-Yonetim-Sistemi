import { Bell, LogOut, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { NotificationsPopover } from './NotificationsPopover';

export const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout, updateUser, user } = useAuth();
  const unreadNotificationsCount = Number(user?.unreadNotificationsCount ?? 0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);

    try {
      const data = await notificationService.fetchNotifications();
      setNotifications(data.items ?? []);
      updateUser({ unreadNotificationsCount: data.unreadCount ?? 0 });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const data = await notificationService.markAllAsRead();
    setNotifications(data.items ?? []);
    updateUser({ unreadNotificationsCount: data.unreadCount ?? 0 });
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      const data = await notificationService.markAsRead(notification.id);
      setNotifications(data.items ?? []);
      updateUser({ unreadNotificationsCount: data.unreadCount ?? 0 });
    }

    setIsNotificationsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <header className="glass-panel sticky top-4 z-20 flex items-center justify-between rounded-[28px] px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="focus-ring inline-flex rounded-2xl border border-ink/10 bg-white/80 p-3 text-ink md:hidden"
          onClick={onMenuClick}
          aria-label="Menüyü aç"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate">ABDAYS Platformu</p>
          <p className="font-display text-lg font-semibold text-ink">
            Bütçe ve talep yönetimi
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm text-ink"
            aria-label="Bildirimler"
          >
            <div className="relative">
              <Bell className="size-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-2.5 items-center justify-center rounded-full bg-tide shadow-sm ring-2 ring-white">
                  <span className="size-full animate-pulse rounded-full bg-tide" />
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} bildirim` : 'Bildirimler'}
            </span>
          </button>
          {isNotificationsOpen ? (
            <NotificationsPopover
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              isLoading={isLoadingNotifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onOpenNotification={handleOpenNotification}
            />
          ) : null}
        </div>
        <div className="hidden rounded-2xl bg-ink px-4 py-2 text-sm text-white sm:block">
          <p className="font-medium">{user?.fullName}</p>
          <p className="text-xs text-white/75">{user?.department}</p>
        </div>
        <button
          type="button"
          className="focus-ring inline-flex rounded-2xl border border-ink/10 bg-white/80 p-3 text-ink"
          onClick={logout}
          aria-label="Oturumu kapat"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
};
