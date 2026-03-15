import { Router, Request, Response } from 'express';
import { PgRouteRepository } from '../repositories/PgRouteRepository';
import { RouteComparisonUseCase } from '../../core/usecases/RouteComparison';

const router = Router();
const routeRepo = new PgRouteRepository();
const comparisonUseCase = new RouteComparisonUseCase(routeRepo);

// GET /routes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const routes = await routeRepo.findAll();
    res.json({ data: routes, count: routes.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /routes/:id/baseline
router.post('/:id/baseline', async (req: Request, res: Response) => {
  try {
    const route = await routeRepo.setBaseline(req.params.id);
    res.json({ data: route, message: 'Baseline set successfully' });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// GET /routes/comparison
router.get('/comparison', async (_req: Request, res: Response) => {
  try {
    const result = await comparisonUseCase.execute();
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
