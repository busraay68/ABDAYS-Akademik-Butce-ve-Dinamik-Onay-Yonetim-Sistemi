import { randomUUID } from 'node:crypto';
import { db } from '../database.js';
import { ensure } from '../utils/errors.js';

const nowIso = () => new Date().toISOString();

// ── Project assignment (FR-51) ───────────────────────────────────────

export const assignProjectToResearcher = ({
  ownerUserId,
  code,
  title,
  fundSource,
  totalBudget,
  startDate,
  endDate,
  budgetLines = [],
}) => {
  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(ownerUserId);
  ensure(owner, 404, 'Araştırmacı bulunamadı.');
  ensure(owner.role === 'researcher', 400, 'Proje yalnızca araştırmacı rolündeki kullanıcılara atanabilir.');
  ensure(code?.trim(), 400, 'Proje kodu zorunludur.');
  ensure(title?.trim(), 400, 'Proje başlığı zorunludur.');
  ensure(fundSource?.trim(), 400, 'Fon kaynağı zorunludur.');
  ensure(Number(totalBudget) > 0, 400, 'Toplam bütçe sıfırdan büyük olmalıdır.');
  ensure(startDate, 400, 'Başlangıç tarihi zorunludur.');
  ensure(endDate, 400, 'Bitiş tarihi zorunludur.');

  const existingProject = db.prepare('SELECT id FROM projects WHERE code = ?').get(code.trim());
  ensure(!existingProject, 409, 'Bu proje kodu zaten kullanılıyor.');

  const timestamp = nowIso();
  const projectId = randomUUID();

  db.prepare(
    `INSERT INTO projects
      (id, owner_user_id, code, title, fund_source, total_budget, risk_level, start_date, end_date, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    projectId,
    ownerUserId,
    code.trim(),
    title.trim(),
    fundSource.trim(),
    Number(totalBudget),
    'normal',
    startDate,
    endDate,
    timestamp,
    timestamp,
  );

  if (budgetLines.length > 0) {
    const insertBudgetLine = db.prepare(
      `INSERT INTO budget_lines
        (id, project_id, budget_category_id, name, allocated_amount, spent_amount, committed_amount, created_at, updated_at)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    budgetLines.forEach((line) => {
      const category = db.prepare('SELECT * FROM budget_categories WHERE id = ?').get(line.budgetCategoryId);
      ensure(category, 400, `Bütçe kategorisi bulunamadı: ${line.budgetCategoryId}`);

      insertBudgetLine.run(
        randomUUID(),
        projectId,
        line.budgetCategoryId,
        line.name?.trim() || category.name,
        Number(line.allocatedAmount) || 0,
        0,
        0,
        timestamp,
        timestamp,
      );
    });
  }

  return db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
};

// ── Budget update (FR-15) ─────────────────────────────────────────────

export const updateProjectBudget = (projectId, { totalBudget, budgetLines }) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  ensure(project, 404, 'Proje bulunamadı.');

  const timestamp = nowIso();

  if (totalBudget !== undefined) {
    ensure(Number(totalBudget) > 0, 400, 'Toplam bütçe sıfırdan büyük olmalıdır.');
    db.prepare('UPDATE projects SET total_budget = ?, updated_at = ? WHERE id = ?')
      .run(Number(totalBudget), timestamp, projectId);
  }

  if (Array.isArray(budgetLines)) {
    budgetLines.forEach((line) => {
      if (line.id) {
        // update existing budget line
        const existingLine = db.prepare('SELECT * FROM budget_lines WHERE id = ? AND project_id = ?')
          .get(line.id, projectId);
        ensure(existingLine, 404, `Bütçe kalemi bulunamadı: ${line.id}`);

        const newAllocated = Number(line.allocatedAmount);
        ensure(
          newAllocated >= Number(existingLine.spent_amount) + Number(existingLine.committed_amount),
          400,
          `Tahsis edilen tutar, harcanan ve taahhüt edilen tutardan az olamaz (${existingLine.name}).`,
        );

        db.prepare(
          `UPDATE budget_lines SET allocated_amount = ?, name = ?, updated_at = ? WHERE id = ?`,
        ).run(
          newAllocated,
          line.name?.trim() || existingLine.name,
          timestamp,
          line.id,
        );
      } else {
        // add new budget line
        const category = db.prepare('SELECT * FROM budget_categories WHERE id = ?').get(line.budgetCategoryId);
        ensure(category, 400, `Bütçe kategorisi bulunamadı: ${line.budgetCategoryId}`);

        db.prepare(
          `INSERT INTO budget_lines
            (id, project_id, budget_category_id, name, allocated_amount, spent_amount, committed_amount, created_at, updated_at)
           VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          randomUUID(),
          projectId,
          line.budgetCategoryId,
          line.name?.trim() || category.name,
          Number(line.allocatedAmount) || 0,
          0,
          0,
          timestamp,
          timestamp,
        );
      }
    });
  }

  return db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
};

// ── Approval rules management (FR-29) ────────────────────────────────

export const listApprovalRules = () =>
  db.prepare('SELECT * FROM approval_rules ORDER BY min_amount ASC, step_order ASC').all();

export const createApprovalRule = ({ minAmount, maxAmount, firstApproverRole, secondApproverRole }) => {
  ensure(Number(minAmount) >= 0, 400, 'Alt tutar sınırı sıfır veya pozitif olmalıdır.');
  if (maxAmount !== null && maxAmount !== undefined && maxAmount !== '') {
    ensure(Number(maxAmount) > Number(minAmount), 400, 'Üst tutar sınırı alt sınırdan büyük olmalıdır.');
  }

  const validRoles = ['finance_specialist', 'dean'];
  ensure(validRoles.includes(firstApproverRole), 400, 'Birinci onaycı rolü geçersiz.');
  if (secondApproverRole) {
    ensure(validRoles.includes(secondApproverRole), 400, 'İkinci onaycı rolü geçersiz.');
  }

  const timestamp = nowIso();
  const parsedMax = (maxAmount !== null && maxAmount !== undefined && maxAmount !== '')
    ? Number(maxAmount)
    : null;

  // Create first step
  const ruleId1 = randomUUID();
  db.prepare(
    `INSERT INTO approval_rules
      (id, min_amount, max_amount, step_order, approver_role, is_active, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(ruleId1, Number(minAmount), parsedMax, 1, firstApproverRole, timestamp, timestamp);

  // Create second step if provided
  if (secondApproverRole) {
    const ruleId2 = randomUUID();
    db.prepare(
      `INSERT INTO approval_rules
        (id, min_amount, max_amount, step_order, approver_role, is_active, created_at, updated_at)
       VALUES
        (?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(ruleId2, Number(minAmount), parsedMax, 2, secondApproverRole, timestamp, timestamp);
  }

  return listApprovalRules();
};

export const updateApprovalRule = (ruleId, { isActive }) => {
  const rule = db.prepare('SELECT * FROM approval_rules WHERE id = ?').get(ruleId);
  ensure(rule, 404, 'Onay kuralı bulunamadı.');

  const timestamp = nowIso();
  db.prepare('UPDATE approval_rules SET is_active = ?, updated_at = ? WHERE id = ?')
    .run(isActive ? 1 : 0, timestamp, ruleId);

  return listApprovalRules();
};

export const deleteApprovalRule = (ruleId) => {
  const rule = db.prepare('SELECT * FROM approval_rules WHERE id = ?').get(ruleId);
  ensure(rule, 404, 'Onay kuralı bulunamadı.');

  db.prepare('DELETE FROM approval_rules WHERE id = ?').run(ruleId);
  return listApprovalRules();
};

// ── Admin dashboard stats ─────────────────────────────────────────────

export const getAdminDashboardStats = () => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const activeUsers = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get().count;
  const totalProjects = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  const totalRequests = db.prepare('SELECT COUNT(*) AS count FROM purchase_requests').get().count;
  const pendingRequests = db.prepare(
    `SELECT COUNT(*) AS count FROM purchase_requests WHERE status IN ('awaiting_finance', 'awaiting_dean')`,
  ).get().count;
  const activeRules = db.prepare('SELECT COUNT(*) AS count FROM approval_rules WHERE is_active = 1').get().count;

  return [
    {
      id: 'total-users',
      label: 'Toplam kullanıcı',
      value: totalUsers,
      accent: 'tide',
      hint: 'Sistemde kayıtlı tüm kullanıcılar',
    },
    {
      id: 'active-users',
      label: 'Aktif kullanıcı',
      value: activeUsers,
      accent: 'success',
      hint: 'Giriş yapabilen kullanıcılar',
    },
    {
      id: 'total-projects',
      label: 'Proje sayısı',
      value: totalProjects,
      accent: 'tide',
      hint: 'Tanımlanmış tüm projeler',
    },
    {
      id: 'pending-requests',
      label: 'Bekleyen talep',
      value: pendingRequests,
      accent: 'warning',
      hint: 'Onay sürecindeki talepler',
    },
    {
      id: 'active-rules',
      label: 'Aktif onay kuralı',
      value: activeRules,
      accent: 'coral',
      hint: 'Yürürlükteki onay kuralları',
    },
  ];
};
