import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { buildDashboardSummary } from '../services/dashboardService.js';
import {
  getAccessibleProjects,
  getRequestFormReferenceData,
} from '../services/projectService.js';

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get('/projects', (req, res) => {
  res.json({ items: getAccessibleProjects(req.user) });
});

projectRouter.get('/dashboard/summary', (req, res) => {
  res.json(buildDashboardSummary(req.user));
});

projectRouter.get('/reference-data/request-form', (_req, res) => {
  res.json(getRequestFormReferenceData());
});
