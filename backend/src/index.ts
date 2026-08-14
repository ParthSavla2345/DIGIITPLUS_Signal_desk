import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import incidentRoutes from './routes/incidents';
import knowledgeRoutes from './routes/knowledge';

const app = express();

// ============================================================
// Middleware
// ============================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ============================================================
// Routes
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SignalDesk API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/incidents', incidentRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================================
// Start server
// ============================================================

app.listen(env.PORT, () => {
  console.log(`\n🚀 SignalDesk API Server`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   Health: http://localhost:${env.PORT}/api/health\n`);
});

export default app;
