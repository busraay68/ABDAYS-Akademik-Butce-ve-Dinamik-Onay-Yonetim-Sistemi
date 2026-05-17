import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db } from '../database.js';
import { signAccessToken } from '../utils/auth.js';
import { AppError, ensure } from '../utils/errors.js';
import { createNotification } from './notificationService.js';

const passwordPolicyMessage =
  'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.';

const hasStrongPassword = (password) =>
  /[A-ZÇĞİÖŞÜ]/.test(password) &&
  /[a-zçğıöşü]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password) &&
  !/\s/.test(password) &&
  password.length >= 8;

const getUnreadNotificationsCount = (userId) =>
  Number(
    db
      .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(userId).count,
  );

export const serializeUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
  department: user.department,
  isActive: Boolean(user.is_active),
  unreadNotificationsCount: getUnreadNotificationsCount(user.id),
});

export const findUserById = (id) =>
  db.prepare('SELECT * FROM users WHERE id = ?').get(id);

export const authenticateUser = async ({ email, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

  ensure(user, 401, 'E-posta veya şifre hatalı.');
  ensure(user.is_active, 403, 'Hesabınız pasif durumda. Lütfen sistem yöneticisi ile iletişime geçin.');

  const isValid = await bcrypt.compare(password, user.password_hash);
  ensure(isValid, 401, 'E-posta veya şifre hatalı.');

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken: accessToken,
    expiresIn: 60 * 60 * 8,
    user: serializeUser(user),
  };
};

const createStarterProjectForResearcher = (userId, fullName) => {
  const timestamp = new Date().toISOString();
  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count + 1;
  const projectId = randomUUID();
  const projectCode = `ABD-${String(200 + projectCount).padStart(3, '0')}`;
  const shortName = fullName.split(' ')[0] ?? 'Araştırmacı';

  db.prepare(
    `INSERT INTO projects
      (id, owner_user_id, code, title, fund_source, total_budget, risk_level, start_date, end_date, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    projectId,
    userId,
    projectCode,
    `${shortName} Başlangıç Araştırma Projesi`,
    'Üniversite Başlangıç Fonu',
    150000,
    'normal',
    timestamp.slice(0, 10),
    `${new Date().getFullYear()}-12-31`,
    timestamp,
    timestamp,
  );

  const insertBudgetLine = db.prepare(
    `INSERT INTO budget_lines
      (id, project_id, budget_category_id, name, allocated_amount, spent_amount, committed_amount, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  [
    ['cat_equipment', 'Teçhizat', 70000],
    ['cat_software', 'Yazılım ve Lisans', 40000],
    ['cat_consumables', 'Sarf Malzeme', 40000],
  ].forEach(([categoryId, name, allocatedAmount]) => {
    insertBudgetLine.run(
      randomUUID(),
      projectId,
      categoryId,
      name,
      allocatedAmount,
      0,
      0,
      timestamp,
      timestamp,
    );
  });
};

export const registerResearcher = async ({
  fullName,
  email,
  password,
  department,
}) => {
  ensure(fullName?.trim(), 400, 'Ad soyad zorunludur.');
  ensure(department?.trim(), 400, 'Bölüm bilgisi zorunludur.');
  ensure(email?.trim(), 400, 'E-posta zorunludur.');
  ensure(hasStrongPassword(password ?? ''), 400, passwordPolicyMessage);

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  ensure(!existingUser, 409, 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.');

  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date().toISOString();
  const userId = randomUUID();

  db.prepare(
    `INSERT INTO users
      (id, full_name, email, password_hash, role, department, is_active, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    fullName.trim(),
    normalizedEmail,
    passwordHash,
    'researcher',
    department.trim(),
    1,
    timestamp,
    timestamp,
  );

  createStarterProjectForResearcher(userId, fullName.trim());
  createNotification({
    userId,
    title: 'Hesabınız hazır',
    message: 'Sizin için başlangıç projesi oluşturuldu. İlk talebinizi dilediğiniz zaman açabilirsiniz.',
    link: '/dashboard',
  });

  const user = findUserById(userId);
  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken: accessToken,
    expiresIn: 60 * 60 * 8,
    user: serializeUser(user),
  };
};

export const requireUser = (id) => {
  const user = findUserById(id);

  if (!user) {
    throw new AppError(401, 'Kullanıcı bulunamadı.');
  }

  return user;
};

export const getPasswordPolicyMessage = () => passwordPolicyMessage;

export const hasStrongPasswordExported = hasStrongPassword;

export const listAllUsers = () =>
  db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();

export const createUserByAdmin = async ({
  fullName,
  email,
  password,
  department,
  role,
}) => {
  const validRoles = ['researcher', 'finance_specialist', 'dean'];
  ensure(validRoles.includes(role), 400, 'Geçersiz rol. İzin verilen roller: araştırmacı, mali işler uzmanı, dekan.');
  ensure(fullName?.trim(), 400, 'Ad soyad zorunludur.');
  ensure(department?.trim(), 400, 'Bölüm bilgisi zorunludur.');
  ensure(email?.trim(), 400, 'E-posta zorunludur.');
  ensure(hasStrongPassword(password ?? ''), 400, passwordPolicyMessage);

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  ensure(!existingUser, 409, 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.');

  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date().toISOString();
  const userId = randomUUID();

  db.prepare(
    `INSERT INTO users
      (id, full_name, email, password_hash, role, department, is_active, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    fullName.trim(),
    normalizedEmail,
    passwordHash,
    role,
    department.trim(),
    1,
    timestamp,
    timestamp,
  );

  if (role === 'researcher') {
    createStarterProjectForResearcher(userId, fullName.trim());
  }

  createNotification({
    userId,
    title: 'Hesabınız oluşturuldu',
    message: 'Sistem yöneticisi tarafından hesabınız oluşturuldu. Giriş yapabilirsiniz.',
    link: '/dashboard',
  });

  return findUserById(userId);
};

export const updateUserByAdmin = (userId, { role, isActive }) => {
  const user = findUserById(userId);
  ensure(user, 404, 'Kullanıcı bulunamadı.');
  ensure(user.role !== 'system_admin', 400, 'Sistem yöneticisi hesabı değiştirilemez.');

  const validRoles = ['researcher', 'finance_specialist', 'dean'];
  if (role !== undefined) {
    ensure(validRoles.includes(role), 400, 'Geçersiz rol.');
  }

  const timestamp = new Date().toISOString();
  const newRole = role ?? user.role;
  const newIsActive = isActive !== undefined ? (isActive ? 1 : 0) : user.is_active;

  db.prepare(
    `UPDATE users SET role = ?, is_active = ?, updated_at = ? WHERE id = ?`,
  ).run(newRole, newIsActive, timestamp, userId);

  return findUserById(userId);
};
