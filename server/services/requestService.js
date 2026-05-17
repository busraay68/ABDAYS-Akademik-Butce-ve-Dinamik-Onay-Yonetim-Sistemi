import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { db } from '../database.js';
import { config } from '../config.js';
import { createNotification } from './notificationService.js';
import { getBudgetLineForProject, getProjectByIdForUser } from './projectService.js';
import { ensure } from '../utils/errors.js';

const nowIso = () => new Date().toISOString();

const statusByRole = {
  finance_specialist: 'awaiting_finance',
  dean: 'awaiting_dean',
};

const editableStatuses = new Set(['draft', 'revision_requested']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, config.uploadsDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const parseRequiredDocuments = (value) => {
  try {
    return JSON.parse(value ?? '[]');
  } catch {
    return [];
  }
};

export const uploadAttachment = multer({ storage });

const requestSelect = `
  SELECT
    pr.*,
    p.title AS project_title,
    p.code AS project_code,
    p.fund_source,
    bl.name AS budget_line_name,
    bl.budget_category_id AS budget_line_category_id,
    bc.code AS budget_category_code,
    bc.name AS budget_category_name,
    bc.source_reference AS budget_category_source_reference,
    bc.required_documents AS budget_category_required_documents,
    ic.name AS catalog_item_name,
    ic.unit AS catalog_item_unit,
    ic.description AS catalog_item_description,
    ic.typical_unit_price AS catalog_item_typical_unit_price,
    pm.name AS procurement_method_name,
    pm.description AS procurement_method_description,
    pri.name AS priority_name,
    pri.description AS priority_description,
    pri.sla_days AS priority_sla_days,
    u.full_name AS requester_name,
    u.email AS requester_email,
    u.department AS requester_department
  FROM purchase_requests pr
  INNER JOIN projects p ON p.id = pr.project_id
  INNER JOIN budget_lines bl ON bl.id = pr.budget_line_id
  INNER JOIN budget_categories bc ON bc.id = pr.budget_category_id
  INNER JOIN item_catalog ic ON ic.id = pr.catalog_item_id
  INNER JOIN procurement_methods pm ON pm.id = pr.procurement_method_id
  INNER JOIN priorities pri ON pri.id = pr.priority_id
  INNER JOIN users u ON u.id = pr.requester_id
`;

const serializeRequest = (request) => ({
  id: request.id,
  referenceNo: request.reference_no,
  projectId: request.project_id,
  projectTitle: request.project_title,
  projectCode: request.project_code,
  fundSource: request.fund_source,
  budgetLineId: request.budget_line_id,
  budgetLineName: request.budget_line_name,
  budgetCategoryId: request.budget_category_id,
  budgetCategoryCode: request.budget_category_code,
  budgetCategoryName: request.budget_category_name,
  budgetCategorySourceReference: request.budget_category_source_reference,
  requiredDocuments: parseRequiredDocuments(request.budget_category_required_documents),
  requesterId: request.requester_id,
  requesterName: request.requester_name,
  requesterEmail: request.requester_email,
  requesterDepartment: request.requester_department,
  catalogItemId: request.catalog_item_id,
  catalogItemName: request.catalog_item_name,
  itemName: request.item_name,
  unit: request.unit,
  description: request.description,
  quantity: request.quantity,
  unitPrice: request.unit_price,
  typicalUnitPrice: request.catalog_item_typical_unit_price,
  totalAmount: request.total_amount,
  procurementMethodId: request.procurement_method_id,
  procurementMethodName: request.procurement_method_name,
  procurementMethodDescription: request.procurement_method_description,
  priorityId: request.priority_id,
  priorityName: request.priority_name,
  priorityDescription: request.priority_description,
  prioritySlaDays: request.priority_sla_days,
  justification: request.justification,
  status: request.status,
  currentStepOrder: request.current_step_order,
  currentApproverRole: request.current_approver_role,
  lastComment: request.last_comment,
  attachmentName: request.attachment_name,
  attachmentPath: request.attachment_path,
  submittedAt: request.submitted_at,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
});

const serializeApprovalHistory = (steps) =>
  steps.map((step) => ({
    id: step.id,
    stepOrder: step.step_order,
    approverRole: step.approver_role,
    status: step.status,
    actorUserId: step.actor_user_id,
    comment: step.comment,
    actedAt: step.acted_at,
    createdAt: step.created_at,
  }));

const getApprovalRulesForAmount = (amount) =>
  db
    .prepare(
      `SELECT * FROM approval_rules
       WHERE is_active = 1
         AND min_amount <= ?
         AND (max_amount IS NULL OR max_amount >= ?)
       ORDER BY step_order ASC`,
    )
    .all(amount, amount);

const getApprovalSteps = (requestId) =>
  db
    .prepare('SELECT * FROM approval_steps WHERE request_id = ? ORDER BY step_order ASC')
    .all(requestId);

const getAuditLogs = (requestId) =>
  db
    .prepare(
      `SELECT al.*, u.full_name AS actor_name, u.role AS actor_role
       FROM audit_logs al
       INNER JOIN users u ON u.id = al.actor_user_id
       WHERE al.request_id = ?
       ORDER BY al.created_at DESC`,
    )
    .all(requestId)
    .map((item) => ({
      id: item.id,
      action: item.action,
      note: item.note,
      actorName: item.actor_name,
      actorRole: item.actor_role,
      createdAt: item.created_at,
    }));

const getRequestRowById = (requestId) =>
  db.prepare(`${requestSelect} WHERE pr.id = ?`).get(requestId);

const getNextReferenceNo = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM purchase_requests').get().count + 1;
  return `REQ-2026-${String(count).padStart(4, '0')}`;
};

const getUserIdsByRole = (role) =>
  db.prepare('SELECT id FROM users WHERE role = ?').all(role).map((item) => item.id);

const getCatalogItemById = (catalogItemId) =>
  db.prepare('SELECT * FROM item_catalog WHERE id = ?').get(catalogItemId);

const getProcurementMethodById = (procurementMethodId) =>
  db.prepare('SELECT * FROM procurement_methods WHERE id = ?').get(procurementMethodId);

const getPriorityById = (priorityId) =>
  db.prepare('SELECT * FROM priorities WHERE id = ?').get(priorityId);

const logAudit = (requestId, actorUserId, action, note) => {
  db.prepare(
    `INSERT INTO audit_logs (id, request_id, actor_user_id, action, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), requestId, actorUserId, action, note, nowIso());
};

const reserveBudget = (budgetLineId, amount) => {
  db.prepare(
    `UPDATE budget_lines
     SET committed_amount = committed_amount + ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(amount, nowIso(), budgetLineId);
};

const releaseBudget = (budgetLineId, amount) => {
  db.prepare(
    `UPDATE budget_lines
     SET committed_amount = MAX(committed_amount - ?, 0),
         updated_at = ?
     WHERE id = ?`,
  ).run(amount, nowIso(), budgetLineId);
};

const finalizeSpentBudget = (budgetLineId, amount) => {
  db.prepare(
    `UPDATE budget_lines
     SET committed_amount = MAX(committed_amount - ?, 0),
         spent_amount = spent_amount + ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(amount, amount, nowIso(), budgetLineId);
};

const clearApprovalSteps = (requestId) => {
  db.prepare('DELETE FROM approval_steps WHERE request_id = ?').run(requestId);
};

const createApprovalSteps = (requestId, rules) => {
  const insert = db.prepare(
    `INSERT INTO approval_steps
      (id, request_id, step_order, approver_role, status, actor_user_id, comment, acted_at, created_at, updated_at)
     VALUES
      (@id, @request_id, @step_order, @approver_role, @status, @actor_user_id, @comment, @acted_at, @created_at, @updated_at)`,
  );
  const timestamp = nowIso();

  rules.forEach((rule) =>
    insert.run({
      id: randomUUID(),
      request_id: requestId,
      step_order: rule.step_order,
      approver_role: rule.approver_role,
      status: 'pending',
      actor_user_id: null,
      comment: null,
      acted_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    }),
  );
};

const validateBudgetAvailability = (budgetLine, requestedAmount, requestId = null) => {
  const reservedForThisRequest =
    requestId === null
      ? 0
      : db
          .prepare('SELECT total_amount, status FROM purchase_requests WHERE id = ?')
          .get(requestId);

  const previousReservedAmount =
    reservedForThisRequest && ['awaiting_finance', 'awaiting_dean'].includes(reservedForThisRequest.status)
      ? Number(reservedForThisRequest.total_amount)
      : 0;

  const availableAmount =
    Number(budgetLine.allocated_amount) -
    Number(budgetLine.spent_amount) -
    Number(budgetLine.committed_amount) +
    previousReservedAmount;

  ensure(
    requestedAmount <= availableAmount,
    400,
    `Bütçe kaleminde yeterli bakiye yok. Kullanılabilir tutar ${availableAmount.toLocaleString('tr-TR')} TL.`,
  );
};

const removeFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Validates request input data against business rules and data integrity.
 * Demonstrates Clean Code (Single Responsibility Principle).
 */
const validateRequestInput = ({ input, budgetLine, catalogItem, procurementMethod, priority }) => {
  ensure(input.projectId, 400, 'Proje seçimi zorunludur.');
  ensure(input.budgetLineId, 400, 'Bütçe kalemi seçimi zorunludur.');
  ensure(input.catalogItemId, 400, 'Talep kalemi seçimi zorunludur.');
  ensure(input.procurementMethodId, 400, 'Satın alma yöntemi seçimi zorunludur.');
  ensure(input.priorityId, 400, 'Öncelik seçimi zorunludur.');
  ensure(input.justification?.trim(), 400, 'Gerekçe zorunludur.');

  const quantity = Number(input.quantity);
  const unitPrice = Number(input.unitPrice);

  ensure(Number.isInteger(quantity) && quantity > 0, 400, 'Miktar pozitif tam sayı olmalıdır.');
  ensure(Number.isFinite(unitPrice) && unitPrice > 0, 400, 'Birim fiyat sıfırdan büyük olmalıdır.');

  ensure(catalogItem, 404, 'Seçilen talep kalemi bulunamadı.');
  ensure(
    catalogItem.budget_category_id === budgetLine.budget_category_id,
    400,
    'Seçilen talep kalemi, seçtiğiniz bütçe kalemiyle uyumlu değil.',
  );

  ensure(procurementMethod, 404, 'Satın alma yöntemi bulunamadı.');
  ensure(priority, 404, 'Öncelik bilgisi bulunamadı.');

  return { quantity, unitPrice };
};

const buildRequestPayload = ({ input, currentRequest, file, budgetLine }) => {
  const catalogItem = getCatalogItemById(input.catalogItemId);
  const procurementMethod = getProcurementMethodById(input.procurementMethodId);
  const priority = getPriorityById(input.priorityId);

  const { quantity, unitPrice } = validateRequestInput({
    input,
    budgetLine,
    catalogItem,
    procurementMethod,
    priority,
  });

  const totalAmount = Number((quantity * unitPrice).toFixed(2));
  return {
    projectId: input.projectId,
    budgetLineId: input.budgetLineId,
    budgetCategoryId: budgetLine.budget_category_id,
    catalogItemId: catalogItem.id,
    itemName: catalogItem.name,
    procurementMethodId: procurementMethod.id,
    priorityId: priority.id,
    unit: catalogItem.unit,
    description: input.description?.trim() ?? '',
    quantity,
    unitPrice,
    totalAmount,
    justification: input.justification.trim(),
    action: input.action === 'draft' ? 'draft' : 'submit',
    attachmentName: file?.originalname ?? currentRequest?.attachment_name ?? null,
    attachmentPath: file?.path ?? currentRequest?.attachment_path ?? null,
  };
};

export const listRequestsForUser = (user, filters = {}) => {
  const conditions = [];
  const values = [];

  if (user.role === 'researcher') {
    conditions.push('pr.requester_id = ?');
    values.push(user.id);
  }

  if (filters.status) {
    conditions.push('pr.status = ?');
    values.push(filters.status);
  }

  if (filters.projectId) {
    conditions.push('pr.project_id = ?');
    values.push(filters.projectId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return db
    .prepare(`${requestSelect} ${whereClause} ORDER BY pr.updated_at DESC`)
    .all(...values)
    .map(serializeRequest);
};

export const getRequestByIdForUser = (user, requestId) => {
  const request = getRequestRowById(requestId);
  ensure(request, 404, 'Talep bulunamadı.');

  if (user.role === 'researcher') {
    ensure(request.requester_id === user.id, 403, 'Bu talebe erişim yetkiniz yok.');
  }

  return {
    ...serializeRequest(request),
    approvalHistory: serializeApprovalHistory(getApprovalSteps(requestId)),
    auditLogs: getAuditLogs(requestId),
  };
};

const saveRequestTransaction = db.transaction(({ user, currentRequest, input, file }) => {
  const project = getProjectByIdForUser(user, input.projectId);
  const budgetLine = getBudgetLineForProject(project.id, input.budgetLineId);
  const payload = buildRequestPayload({ input, currentRequest, file, budgetLine });
  const timestamp = nowIso();

  if (payload.action === 'submit') {
    validateBudgetAvailability(budgetLine, payload.totalAmount, currentRequest?.id ?? null);
  }

  const requestId = currentRequest?.id ?? randomUUID();
  const referenceNo = currentRequest?.reference_no ?? getNextReferenceNo();

  if (!currentRequest) {
    db.prepare(
      `INSERT INTO purchase_requests
        (id, reference_no, project_id, budget_line_id, requester_id, item_name, budget_category_id, catalog_item_id, procurement_method_id, priority_id, unit, description, quantity, unit_price, total_amount, justification, status, current_step_order, current_approver_role, last_comment, attachment_name, attachment_path, submitted_at, created_at, updated_at)
       VALUES
        (@id, @reference_no, @project_id, @budget_line_id, @requester_id, @item_name, @budget_category_id, @catalog_item_id, @procurement_method_id, @priority_id, @unit, @description, @quantity, @unit_price, @total_amount, @justification, @status, @current_step_order, @current_approver_role, @last_comment, @attachment_name, @attachment_path, @submitted_at, @created_at, @updated_at)`,
    ).run({
      id: requestId,
      reference_no: referenceNo,
      project_id: payload.projectId,
      budget_line_id: payload.budgetLineId,
      requester_id: user.id,
      item_name: payload.itemName,
      budget_category_id: payload.budgetCategoryId,
      catalog_item_id: payload.catalogItemId,
      procurement_method_id: payload.procurementMethodId,
      priority_id: payload.priorityId,
      unit: payload.unit,
      description: payload.description,
      quantity: payload.quantity,
      unit_price: payload.unitPrice,
      total_amount: payload.totalAmount,
      justification: payload.justification,
      status: 'draft',
      current_step_order: null,
      current_approver_role: null,
      last_comment: payload.action === 'draft' ? 'Taslak kaydedildi.' : 'Talep oluşturuldu.',
      attachment_name: payload.attachmentName,
      attachment_path: payload.attachmentPath,
      submitted_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    });
  } else {
    ensure(
      editableStatuses.has(currentRequest.status),
      400,
      'Sadece taslak veya revizyon istenen talepler güncellenebilir.',
    );

    if (file?.path && currentRequest.attachment_path && currentRequest.attachment_path !== file.path) {
      removeFileIfExists(currentRequest.attachment_path);
    }

    db.prepare(
      `UPDATE purchase_requests
       SET project_id = @project_id,
           budget_line_id = @budget_line_id,
           item_name = @item_name,
           budget_category_id = @budget_category_id,
           catalog_item_id = @catalog_item_id,
           procurement_method_id = @procurement_method_id,
           priority_id = @priority_id,
           unit = @unit,
           description = @description,
           quantity = @quantity,
           unit_price = @unit_price,
           total_amount = @total_amount,
           justification = @justification,
           attachment_name = @attachment_name,
           attachment_path = @attachment_path,
           updated_at = @updated_at
       WHERE id = @id`,
    ).run({
      id: currentRequest.id,
      project_id: payload.projectId,
      budget_line_id: payload.budgetLineId,
      item_name: payload.itemName,
      budget_category_id: payload.budgetCategoryId,
      catalog_item_id: payload.catalogItemId,
      procurement_method_id: payload.procurementMethodId,
      priority_id: payload.priorityId,
      unit: payload.unit,
      description: payload.description,
      quantity: payload.quantity,
      unit_price: payload.unitPrice,
      total_amount: payload.totalAmount,
      justification: payload.justification,
      attachment_name: payload.attachmentName,
      attachment_path: payload.attachmentPath,
      updated_at: timestamp,
    });

    clearApprovalSteps(currentRequest.id);
  }

  if (payload.action === 'draft') {
    db.prepare(
      `UPDATE purchase_requests
       SET status = 'draft',
           current_step_order = NULL,
           current_approver_role = NULL,
           last_comment = 'Taslak kaydedildi.',
           submitted_at = NULL,
           updated_at = ?
       WHERE id = ?`,
    ).run(timestamp, requestId);

    logAudit(
      requestId,
      user.id,
      currentRequest ? 'draft_updated' : 'draft_created',
      'Talep taslak olarak kaydedildi.',
    );

    return getRequestByIdForUser(user, requestId);
  }

  const rules = getApprovalRulesForAmount(payload.totalAmount);
  ensure(rules.length > 0, 400, 'Bu tutar için aktif onay kuralı bulunamadı.');
  createApprovalSteps(requestId, rules);

  const firstStep = rules[0];
  const nextStatus = statusByRole[firstStep.approver_role] ?? 'awaiting_finance';

  db.prepare(
    `UPDATE purchase_requests
     SET status = @status,
         current_step_order = @current_step_order,
         current_approver_role = @current_approver_role,
         last_comment = @last_comment,
         submitted_at = @submitted_at,
         updated_at = @updated_at
     WHERE id = @id`,
  ).run({
    id: requestId,
    status: nextStatus,
    current_step_order: firstStep.step_order,
    current_approver_role: firstStep.approver_role,
    last_comment: 'Talep onay sürecine gönderildi.',
    submitted_at: timestamp,
    updated_at: timestamp,
  });

  reserveBudget(payload.budgetLineId, payload.totalAmount);
  logAudit(
    requestId,
    user.id,
    currentRequest ? 'resubmit' : 'submit',
    currentRequest ? 'Revizyon sonrası talep yeniden gönderildi.' : 'Talep onaya gönderildi.',
  );

  getUserIdsByRole(firstStep.approver_role).forEach((userId) => {
    createNotification({
      userId,
      title: 'Yeni talep onay bekliyor',
      message: `${referenceNo} numaralı talep incelemenizi bekliyor.`,
      link: '/approvals',
    });
  });

  createNotification({
    userId: user.id,
    title: 'Talep gönderildi',
    message: `${referenceNo} numaralı talep onay sürecine alındı.`,
    link: '/requests',
  });

  return getRequestByIdForUser(user, requestId);
});

export const createRequest = (user, input, file) =>
  saveRequestTransaction({ user, currentRequest: null, input, file });

export const updateRequest = (user, requestId, input, file) => {
  const currentRequest = db.prepare('SELECT * FROM purchase_requests WHERE id = ?').get(requestId);
  ensure(currentRequest, 404, 'Talep bulunamadı.');
  ensure(currentRequest.requester_id === user.id, 403, 'Bu talebi güncelleyemezsiniz.');

  return saveRequestTransaction({ user, currentRequest, input, file });
};

export const listApprovalQueueForUser = (user) => {
  ensure(['finance_specialist', 'dean'].includes(user.role), 403, 'Bu kuyruk için yetkiniz yok.');

  return db
    .prepare(
      `${requestSelect}
       WHERE pr.current_approver_role = ?
         AND pr.status IN ('awaiting_finance', 'awaiting_dean')
       ORDER BY pr.updated_at ASC`,
    )
    .all(user.role)
    .map(serializeRequest);
};

const applyApprovalActionTransaction = db.transaction(({ approver, requestId, action, comment }) => {
  const request = db.prepare('SELECT * FROM purchase_requests WHERE id = ?').get(requestId);
  ensure(request, 404, 'Talep bulunamadı.');
  ensure(request.current_approver_role === approver.role, 403, 'Bu talep şu anda size atanmış değil.');
  ensure(['awaiting_finance', 'awaiting_dean'].includes(request.status), 400, 'Talep karar bekleyen durumda değil.');

  const step = db
    .prepare(
      `SELECT * FROM approval_steps
       WHERE request_id = ? AND step_order = ?`,
    )
    .get(requestId, request.current_step_order);
  ensure(step, 404, 'Onay adımı bulunamadı.');
  ensure(step.status === 'pending', 400, 'Bu onay adımı zaten işlenmiş.');

  const note = comment?.trim() || null;
  const timestamp = nowIso();

  db.prepare(
    `UPDATE approval_steps
     SET status = ?,
         actor_user_id = ?,
         comment = ?,
         acted_at = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(action, approver.id, note, timestamp, timestamp, step.id);

  if (action === 'approved') {
    const nextStep = db
      .prepare(
        `SELECT * FROM approval_steps
         WHERE request_id = ? AND step_order > ?
         ORDER BY step_order ASC
         LIMIT 1`,
      )
      .get(requestId, step.step_order);

    if (nextStep) {
      db.prepare(
        `UPDATE purchase_requests
         SET status = ?,
             current_step_order = ?,
             current_approver_role = ?,
             last_comment = ?,
             updated_at = ?
         WHERE id = ?`,
      ).run(
        statusByRole[nextStep.approver_role] ?? 'awaiting_finance',
        nextStep.step_order,
        nextStep.approver_role,
        note || 'Bir sonraki onay adımına aktarıldı.',
        timestamp,
        requestId,
      );

      logAudit(requestId, approver.id, 'approve', note || 'Talep bir sonraki adıma aktarıldı.');
      getUserIdsByRole(nextStep.approver_role).forEach((userId) => {
        createNotification({
          userId,
          title: 'Yeni onay adımı',
          message: `${request.reference_no} numaralı talep sizin kararınızı bekliyor.`,
          link: '/approvals',
        });
      });
      createNotification({
        userId: request.requester_id,
        title: 'Talep ilerledi',
        message: `${request.reference_no} numaralı talep bir sonraki onay aşamasına geçti.`,
        link: '/requests',
      });
    } else {
      db.prepare(
        `UPDATE purchase_requests
         SET status = 'approved',
             current_step_order = NULL,
             current_approver_role = NULL,
             last_comment = ?,
             updated_at = ?
         WHERE id = ?`,
      ).run(note || 'Talep onaylandı.', timestamp, requestId);

      finalizeSpentBudget(request.budget_line_id, Number(request.total_amount));
      logAudit(requestId, approver.id, 'approve', note || 'Talep tamamen onaylandı.');
      createNotification({
        userId: request.requester_id,
        title: 'Talep onaylandı',
        message: `${request.reference_no} numaralı talebiniz onaylandı.`,
        link: '/requests',
      });
    }
  }

  if (action === 'rejected') {
    db.prepare(
      `UPDATE purchase_requests
       SET status = 'rejected',
           current_step_order = NULL,
           current_approver_role = NULL,
           last_comment = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(note || 'Talep reddedildi.', timestamp, requestId);

    releaseBudget(request.budget_line_id, Number(request.total_amount));
    logAudit(requestId, approver.id, 'reject', note || 'Talep reddedildi.');
    createNotification({
      userId: request.requester_id,
      title: 'Talep reddedildi',
      message: `${request.reference_no} numaralı talebiniz reddedildi.`,
      link: '/requests',
    });
  }

  if (action === 'revision_requested') {
    db.prepare(
      `UPDATE purchase_requests
       SET status = 'revision_requested',
           current_step_order = NULL,
           current_approver_role = NULL,
           last_comment = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(note || 'Revizyon istendi.', timestamp, requestId);

    releaseBudget(request.budget_line_id, Number(request.total_amount));
    logAudit(requestId, approver.id, 'revision_requested', note || 'Revizyon istendi.');
    createNotification({
      userId: request.requester_id,
      title: 'Revizyon istendi',
      message: `${request.reference_no} numaralı talep için düzeltme gerekiyor.`,
      link: `/requests/new?requestId=${request.id}`,
    });
  }
});

export const applyApprovalAction = (approver, requestId, action, comment) => {
  ensure(['approved', 'rejected', 'revision_requested'].includes(action), 400, 'Geçersiz aksiyon.');
  applyApprovalActionTransaction({ approver, requestId, action, comment });
  return getRequestByIdForUser(approver, requestId);
};

export const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};
