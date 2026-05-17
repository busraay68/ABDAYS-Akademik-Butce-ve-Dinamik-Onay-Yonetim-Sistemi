import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  createRequest,
  getRequestByIdForUser,
  listRequestsForUser,
  removeUploadedFile,
  updateRequest,
  uploadAttachment,
} from '../services/requestService.js';

export const requestRouter = Router();

requestRouter.use(authenticate);

requestRouter.get('/requests', (req, res) => {
  res.json({ items: listRequestsForUser(req.user, req.query) });
});

requestRouter.get('/requests/:requestId', (req, res) => {
  res.json(getRequestByIdForUser(req.user, req.params.requestId));
});

requestRouter.post(
  '/requests',
  authorize('researcher'),
  uploadAttachment.single('attachment'),
  (req, res, next) => {
    try {
      res.status(201).json(createRequest(req.user, req.body, req.file));
    } catch (error) {
      removeUploadedFile(req.file);
      next(error);
    }
  },
);

requestRouter.put(
  '/requests/:requestId',
  authorize('researcher'),
  uploadAttachment.single('attachment'),
  (req, res, next) => {
    try {
      res.json(updateRequest(req.user, req.params.requestId, req.body, req.file));
    } catch (error) {
      removeUploadedFile(req.file);
      next(error);
    }
  },
);
