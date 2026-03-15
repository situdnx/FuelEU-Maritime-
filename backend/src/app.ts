import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routesController from './adapters/http/routesController';
import complianceController from './adapters/http/complianceController';
import bankingController from './adapters/http/bankingController';
import poolsController from './adapters/http/poolsController';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fueleu-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/routes', routesController);
app.use('/compliance', complianceController);
app.use('/banking', bankingController);
app.use('/pools', poolsController);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
