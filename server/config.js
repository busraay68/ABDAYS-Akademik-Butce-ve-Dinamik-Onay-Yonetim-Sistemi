import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  rootDir,
  serverDir: __dirname,
  distDir: path.join(rootDir, 'dist'),
  uploadsDir: path.join(rootDir, 'server', 'uploads'),
  dataDir: path.join(rootDir, 'server', 'data'),
  databasePath: path.join(rootDir, 'server', 'data', 'abdays.sqlite'),
  jwtSecret: process.env.JWT_SECRET ?? 'abdays-dev-secret',
  tokenExpiresIn: '8h',
  port: Number(process.env.PORT ?? 3001),
};
