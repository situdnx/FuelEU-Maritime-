import { Router, Request, Response } from 'express';
import { PgRouteRepository } from '../repositories/PgRouteRepository';
import { PgBankRepository } from '../repositories/PgBankRepository';
import { ComputeCBUseCase } from '../../core/usecases/ComputeCB';
import { ApplyBankedUseCase } from '../../core/usecases/ApplyBanked';

const router = Router();
const routeRepo = new PgRouteRepository();
const bankRepo = new PgBankRepository();
const computeCB = new ComputeCBUseCase(routeRepo);
const applyBanked = new ApplyBankedUseCase(bankRepo, computeCB);

// GET /compliance/cb?shipId=&year=
router.get('/cb', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const cb = await computeCB.execute(String(shipId), parseInt(String(year), 10));
    res.json({ data: cb });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /compliance/adjusted-cb?shipId=&year=
router.get('/adjusted-cb', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const parsedYear = parseInt(String(year), 10);
    const cb = await computeCB.execute(String(shipId), parsedYear);
    const totalBanked = await bankRepo.getTotalBanked(String(shipId), parsedYear);

    res.json({
      data: {
        ...cb,
        bankedAmount: totalBanked,
        adjustedCB: cb.cbGco2eq + totalBanked,
      },
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
