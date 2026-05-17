import { verifyAccessToken } from '../utils/auth.js';
import { requireUser } from '../services/userService.js';
import { AppError } from '../utils/errors.js';

export const authenticate = (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Yetkilendirme başlığı eksik.');
    }

    const token = header.replace('Bearer ', '');
    const payload = verifyAccessToken(token);
    req.user = requireUser(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    next(new AppError(403, 'Bu işlem için yetkiniz yok.'));
    return;
  }

  next();
};
