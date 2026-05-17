import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { applyApprovalAction, listApprovalQueueForUser } from '../services/requestService.js';

export const approvalRouter = Router();

approvalRouter.get('/approvals/queue', authenticate, authorize('finance_specialist', 'dean'), (req, res) => {
  res.json({ items: listApprovalQueueForUser(req.user) });
});

approvalRouter.post('/approvals/:requestId/actions', authenticate, authorize('finance_specialist', 'dean'), (req, res, next) => {
  try {
    const { action, comment } = req.body;
    res.json(applyApprovalAction(req.user, req.params.requestId, action, comment));
  } catch (error) {
    next(error);
  }
});
