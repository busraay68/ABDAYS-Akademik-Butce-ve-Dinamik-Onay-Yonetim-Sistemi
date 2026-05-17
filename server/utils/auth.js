import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from './errors.js';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.tokenExpiresIn },
  );

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'Oturum doğrulanamadı.');
  }
};
