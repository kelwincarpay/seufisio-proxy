import express from 'express';
import { env } from './config/env';
import { secretTokenAuth } from './middleware/auth';
import clientsRouter from './routes/clients';
import salesRouter from './routes/sales';
import professionalsRouter from './routes/professionals';
import attendancesRouter from './routes/attendances';
import reposicaoRouter from './routes/reposicao';

const app = express();

// Body parser
app.use(express.json());

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply secret token auth to all /api routes
app.use('/api', secretTokenAuth);

// Mount routes
app.use('/api/clients', clientsRouter);
app.use('/api/clients', salesRouter);
app.use('/api/professionals', professionalsRouter);
app.use('/api/attendances', attendancesRouter);
app.use('/api/reposicao', reposicaoRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 MovArt SeuFisio Proxy running on port ${env.PORT}`);
  console.log(`📋 Health check: http://localhost:${env.PORT}/health`);
});

export default app;
