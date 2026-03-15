import { Router, Request, Response } from 'express';
import { PgRouteRepository } from '../repositories/PgRouteRepository';
import { PgBankRepository } from '../repositories/PgBankRepository';
import { ComputeCBUseCase } from '../../core/usecases/ComputeCB';
import { BankSurplusUseCase } from '../../core/usecases/BankSurplus';
import { ApplyBankedUseCase } from '../../core/usecases/ApplyBanked';

const router = Router();
const routeRepo = new PgRouteRepository();
const bankRepo = new PgBankRepository();
const computeCB = new ComputeCBUseCase(routeRepo);
const bankSurplus = new BankSurplusUseCase(bankRepo, computeCB);
const applyBanked = new ApplyBankedUseCase(bankRepo, computeCB);

// GET /banking/records?shipId=&year=
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const entries = await bankRepo.findByShipAndYear(
      String(shipId),
      parseInt(String(year), 10),
    );
    const total = await bankRepo.getTotalBanked(String(shipId), parseInt(String(year), 10));
    res.json({ data: { entries, totalBanked: total } });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /banking/bank
router.post('/bank', async (req: Request, res: Response) => {
  try {
    const { shipId, year, amount } = req.body;
    if (!shipId || !year || amount == null) {
      return res.status(400).json({ error: 'shipId, year, and amount are required' });
    }
    const cb = await computeCB.execute(String(shipId), parseInt(String(year), 10));
    const entry = await bankSurplus.execute(String(shipId), parseInt(String(year), 10), Number(amount));
    res.json({
      data: {
        entry,
        cb_before: cb.cbGco2eq,
        banked: entry.amountGco2eq,
        cb_after: cb.cbGco2eq - entry.amountGco2eq,
      },
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /banking/apply
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { shipId, year, amount } = req.body;
    if (!shipId || !year || amount == null) {
      return res.status(400).json({ error: 'shipId, year, and amount are required' });
    }
    const cb = await computeCB.execute(String(shipId), parseInt(String(year), 10));
    const result = await applyBanked.execute(String(shipId), parseInt(String(year), 10), Number(amount));
    res.json({
      data: {
        cb_before: cb.cbGco2eq,
        applied: result.applied,
        cb_after: result.cbAfter,
      },
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
