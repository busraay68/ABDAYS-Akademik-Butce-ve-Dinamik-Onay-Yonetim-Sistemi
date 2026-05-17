import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/notifications', (req, res) => {
  res.json(listNotificationsForUser(req.user.id));
});

notificationRouter.post('/notifications/read-all', (req, res) => {
  res.json(markAllNotificationsAsRead(req.user.id));
});

notificationRouter.post('/notifications/:notificationId/read', (req, res) => {
  res.json(markNotificationAsRead(req.user.id, req.params.notificationId));
});
