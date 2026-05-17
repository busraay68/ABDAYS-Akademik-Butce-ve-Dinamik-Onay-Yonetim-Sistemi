import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  createUserByAdmin,
  listAllUsers,
  serializeUser,
  updateUserByAdmin,
} from '../services/userService.js';
import {
  assignProjectToResearcher,
  updateProjectBudget,
  listApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
  getAdminDashboardStats,
} from '../services/adminService.js';
import { getAccessibleProjects } from '../services/projectService.js';
import { db } from '../database.js';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('system_admin'));

// ── Dashboard stats ───────────────────────────────────────────────────
adminRouter.get('/dashboard', (_req, res) => {
  res.json({ stats: getAdminDashboardStats() });
});

// ── User management (FR-02, FR-08) ──────────────────────────────────
adminRouter.get('/users', (_req, res) => {
  const users = listAllUsers().map(serializeUser);
  res.json({ items: users });
});

adminRouter.post('/users', async (req, res, next) => {
  try {
    const user = await createUserByAdmin(req.body);
    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/users/:userId', (req, res, next) => {
  try {
    const user = updateUserByAdmin(req.params.userId, req.body);
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

// ── Project assignment (FR-51) ──────────────────────────────────────
adminRouter.get('/projects', (req, res) => {
  const adminUser = { ...req.user, role: 'dean' };
  res.json({ items: getAccessibleProjects(adminUser) });
});

adminRouter.post('/projects', (req, res, next) => {
  try {
    const project = assignProjectToResearcher(req.body);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// ── Budget management (FR-15) ───────────────────────────────────────
adminRouter.patch('/projects/:projectId/budget', (req, res, next) => {
  try {
    const project = updateProjectBudget(req.params.projectId, req.body);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// ── Approval rules (FR-29) ─────────────────────────────────────────
adminRouter.get('/approval-rules', (_req, res) => {
  const rules = listApprovalRules();
  res.json({ items: rules });
});

adminRouter.post('/approval-rules', (req, res, next) => {
  try {
    const rules = createApprovalRule(req.body);
    res.status(201).json({ items: rules });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/approval-rules/:ruleId', (req, res, next) => {
  try {
    const rules = updateApprovalRule(req.params.ruleId, req.body);
    res.json({ items: rules });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/approval-rules/:ruleId', (req, res, next) => {
  try {
    const rules = deleteApprovalRule(req.params.ruleId);
    res.json({ items: rules });
  } catch (error) {
    next(error);
  }
});

// ── Reference data for admin forms ──────────────────────────────────
adminRouter.get('/researchers', (_req, res) => {
  const researchers = db
    .prepare("SELECT id, full_name, email, department FROM users WHERE role = 'researcher' AND is_active = 1 ORDER BY full_name")
    .all()
    .map((u) => ({ id: u.id, fullName: u.full_name, email: u.email, department: u.department }));
  res.json({ items: researchers });
});

adminRouter.get('/budget-categories', (_req, res) => {
  const categories = db
    .prepare('SELECT id, code, name FROM budget_categories ORDER BY name')
    .all();
  res.json({ items: categories });
});
