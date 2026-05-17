import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { initializeDatabase } from './database.js';
import { adminRouter } from './routes/adminRoutes.js';
import { approvalRouter } from './routes/approvalRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { projectRouter } from './routes/projectRoutes.js';
import { requestRouter } from './routes/requestRoutes.js';

initializeDatabase();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(config.uploadsDir));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', projectRouter);
app.use('/api/v1', requestRouter);
app.use('/api/v1', approvalRouter);
app.use('/api/v1', notificationRouter);

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? 'Beklenmeyen bir hata oluştu.';
  console.error(`[Error ${statusCode}] ${message}`, error);
  res.status(statusCode).json({ message });
});

if (fs.existsSync(config.distDir)) {
  app.use(express.static(config.distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.sendFile(path.join(config.distDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`ABDAYS server listening on http://localhost:${config.port}`);
});
