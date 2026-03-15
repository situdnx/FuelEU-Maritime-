import { Router, Request, Response } from 'express';
import { PgRouteRepository } from '../repositories/PgRouteRepository';
import { PgPoolRepository } from '../repositories/PgPoolRepository';
import { ComputeCBUseCase } from '../../core/usecases/ComputeCB';
import { CreatePoolUseCase } from '../../core/usecases/CreatePool';

const router = Router();
const routeRepo = new PgRouteRepository();
const poolRepo = new PgPoolRepository();
const computeCB = new ComputeCBUseCase(routeRepo);
const createPool = new CreatePoolUseCase(poolRepo, computeCB);

// GET /pools
router.get('/', async (_req: Request, res: Response) => {
  try {
    const pools = await poolRepo.findAllWithMembers();
    res.json({ data: pools });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /pools
router.post('/', async (req: Request, res: Response) => {
  try {
    const { year, members } = req.body;
    if (!year || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'year and members array are required' });
    }
    const pool = await createPool.execute(parseInt(String(year), 10), members);
    res.status(201).json({ data: pool });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
