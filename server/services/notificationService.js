import { randomUUID } from 'node:crypto';
import { db } from '../database.js';
import { ensure } from '../utils/errors.js';

const nowIso = () => new Date().toISOString();

const serializeNotification = (item) => ({
  id: item.id,
  title: item.title,
  message: item.message,
  type: item.type || 'info',
  link: item.link,
  isRead: Boolean(item.is_read),
  createdAt: item.created_at,
});

export const createNotification = ({ userId, title, message, type = 'info', link = null }) => {
  db.prepare(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
  ).run(randomUUID(), userId, title, message, type, link, nowIso());
};

export const listNotificationsForUser = (userId) => {
  const items = db
    .prepare(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY is_read ASC, created_at DESC
       LIMIT 20`,
    )
    .all(userId)
    .map(serializeNotification);

  const unreadCount = Number(
    db
      .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(userId).count,
  );

  return { items, unreadCount };
};

export const markNotificationAsRead = (userId, notificationId) => {
  const notification = db
    .prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
    .get(notificationId, userId);
  ensure(notification, 404, 'Bildirim bulunamadı.');

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);
  return listNotificationsForUser(userId);
};

export const markAllNotificationsAsRead = (userId) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  return listNotificationsForUser(userId);
};
