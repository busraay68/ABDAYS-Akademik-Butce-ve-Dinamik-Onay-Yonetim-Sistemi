import { Bell, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

/**
 * Strategy Pattern for Notification Rendering
 * Defines how different types of notifications should look and behave.
 */
export const NOTIFICATION_STRATEGIES = {
  info: {
    icon: Info,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-100',
    label: 'Bilgi',
  },
  success: {
    icon: CheckCircle2,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-100',
    label: 'Başarılı',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-100',
    label: 'Uyarı',
  },
  danger: {
    icon: XCircle,
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-100',
    label: 'Hata',
  },
  default: {
    icon: Bell,
    colorClass: 'text-slate-500',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-100',
    label: 'Bildirim',
  },
};

export const getNotificationStrategy = (type) => {
  return NOTIFICATION_STRATEGIES[type] || NOTIFICATION_STRATEGIES.default;
};
