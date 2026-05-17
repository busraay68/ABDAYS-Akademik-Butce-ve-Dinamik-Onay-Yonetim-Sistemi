import { db } from '../database.js';
import { ensure } from '../utils/errors.js';

const riskThresholds = {
  critical: 0.2,
  watch: 0.4,
};

const parseRequiredDocuments = (value) => {
  try {
    return JSON.parse(value ?? '[]');
  } catch {
    return [];
  }
};

const serializeBudgetCategory = (category) => ({
  id: category.id,
  code: category.code,
  name: category.name,
  sourceReference: category.source_reference,
  requiredDocuments: parseRequiredDocuments(category.required_documents),
});

const serializeProcurementMethod = (method) => ({
  id: method.id,
  name: method.name,
  description: method.description,
});

const serializePriority = (priority) => ({
  id: priority.id,
  name: priority.name,
  description: priority.description,
  slaDays: priority.sla_days,
});

const serializeCatalogItem = (item) => ({
  id: item.id,
  budgetCategoryId: item.budget_category_id,
  name: item.name,
  unit: item.unit,
  typicalUnitPrice: item.typical_unit_price,
  description: item.description,
});

const getBudgetLinesByProjectIds = (projectIds) => {
  if (!projectIds.length) {
    return [];
  }

  const placeholders = projectIds.map(() => '?').join(', ');
  return db
    .prepare(
      `SELECT
        bl.*,
        bc.code AS budget_category_code,
        bc.name AS budget_category_name,
        bc.source_reference AS budget_category_source_reference,
        bc.required_documents AS budget_category_required_documents
       FROM budget_lines bl
       INNER JOIN budget_categories bc ON bc.id = bl.budget_category_id
       WHERE bl.project_id IN (${placeholders})
       ORDER BY bl.name`,
    )
    .all(...projectIds);
};

const computeRiskLevel = (remainingBudget, totalBudget) => {
  if (!totalBudget) {
    return 'normal';
  }

  const ratio = remainingBudget / totalBudget;

  if (ratio <= riskThresholds.critical) {
    return 'critical';
  }

  if (ratio <= riskThresholds.watch) {
    return 'watch';
  }

  return 'normal';
};

export const serializeBudgetLine = (line) => ({
  id: line.id,
  projectId: line.project_id,
  budgetCategoryId: line.budget_category_id,
  budgetCategoryCode: line.budget_category_code,
  budgetCategoryName: line.budget_category_name,
  sourceReference: line.budget_category_source_reference,
  requiredDocuments: parseRequiredDocuments(line.budget_category_required_documents),
  name: line.name,
  allocatedAmount: line.allocated_amount,
  spentAmount: line.spent_amount,
  committedAmount: line.committed_amount,
  availableAmount: Number(line.allocated_amount) - Number(line.spent_amount) - Number(line.committed_amount),
});

export const serializeProject = (project, budgetLines) => {
  const lines = budgetLines.filter((line) => line.project_id === project.id).map(serializeBudgetLine);
  const totalBudget = lines.reduce((sum, line) => sum + line.allocatedAmount, 0);
  const remainingBudget = lines.reduce((sum, line) => sum + line.availableAmount, 0);

  return {
    id: project.id,
    ownerUserId: project.owner_user_id,
    code: project.code,
    title: project.title,
    fundSource: project.fund_source,
    totalBudget,
    remainingBudget,
    riskLevel: computeRiskLevel(remainingBudget, totalBudget),
    startDate: project.start_date,
    endDate: project.end_date,
    budgetLines: lines,
  };
};

export const getAccessibleProjects = (user) => {
  const query =
    user.role === 'researcher'
      ? 'SELECT * FROM projects WHERE owner_user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM projects ORDER BY created_at DESC';

  const projects =
    user.role === 'researcher'
      ? db.prepare(query).all(user.id)
      : db.prepare(query).all();
  const budgetLines = getBudgetLinesByProjectIds(projects.map((project) => project.id));

  return projects.map((project) => serializeProject(project, budgetLines));
};

export const getProjectByIdForUser = (user, projectId) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  ensure(project, 404, 'Proje bulunamadı.');

  if (user.role === 'researcher') {
    ensure(project.owner_user_id === user.id, 403, 'Bu projeye erişim yetkiniz yok.');
  }

  const budgetLines = db
    .prepare(
      `SELECT
        bl.*,
        bc.code AS budget_category_code,
        bc.name AS budget_category_name,
        bc.source_reference AS budget_category_source_reference,
        bc.required_documents AS budget_category_required_documents
       FROM budget_lines bl
       INNER JOIN budget_categories bc ON bc.id = bl.budget_category_id
       WHERE bl.project_id = ?
       ORDER BY bl.name`,
    )
    .all(projectId);

  return serializeProject(project, budgetLines);
};

export const getBudgetLineForProject = (projectId, budgetLineId) => {
  const budgetLine = db
    .prepare(
      `SELECT
        bl.*,
        bc.code AS budget_category_code,
        bc.name AS budget_category_name,
        bc.source_reference AS budget_category_source_reference,
        bc.required_documents AS budget_category_required_documents
       FROM budget_lines bl
       INNER JOIN budget_categories bc ON bc.id = bl.budget_category_id
       WHERE bl.id = ? AND bl.project_id = ?`,
    )
    .get(budgetLineId, projectId);

  ensure(budgetLine, 404, 'Bütçe kalemi bulunamadı.');
  return budgetLine;
};

export const getRequestFormReferenceData = () => {
  const budgetCategories = db
    .prepare('SELECT * FROM budget_categories ORDER BY name ASC')
    .all()
    .map(serializeBudgetCategory);

  const procurementMethods = db
    .prepare('SELECT * FROM procurement_methods ORDER BY name ASC')
    .all()
    .map(serializeProcurementMethod);

  const priorities = db
    .prepare('SELECT * FROM priorities ORDER BY sla_days ASC')
    .all()
    .map(serializePriority);

  const catalogItems = db
    .prepare('SELECT * FROM item_catalog ORDER BY budget_category_id ASC, name ASC')
    .all()
    .map(serializeCatalogItem);

  return {
    budgetCategories,
    procurementMethods,
    priorities,
    catalogItems,
  };
};
