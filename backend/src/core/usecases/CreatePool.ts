import { Pool } from '../domain/entities';
import { IPoolRepository, ICreatePoolUseCase, IComputeCBUseCase } from '../ports';

export class CreatePoolUseCase implements ICreatePoolUseCase {
  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly computeCB: IComputeCBUseCase,
  ) {}

  async execute(
    year: number,
    members: Array<{ shipId: string; amount: number }>,
  ): Promise<Pool> {
    if (members.length < 2) {
      throw new Error('Pool requires at least 2 members');
    }

    // Compute CB for each member
    const memberCBs = await Promise.all(
      members.map(async (m) => {
        const cb = await this.computeCB.execute(m.shipId, year);
        return { shipId: m.shipId, cbBefore: cb.cbGco2eq, amount: m.amount };
      }),
    );

    // Validate: Sum(adjustedCB) >= 0
    const totalCB = memberCBs.reduce((sum, m) => sum + m.cbBefore, 0);
    if (totalCB < 0) {
      throw new Error(
        `Pool sum of CBs must be >= 0. Current sum: ${totalCB.toFixed(2)}`,
      );
    }

    // Greedy allocation: sort desc by CB, transfer surplus to deficits
    const sorted = [...memberCBs].sort((a, b) => b.cbBefore - a.cbBefore);
    const afterMap: Record<string, number> = {};
    sorted.forEach((m) => (afterMap[m.shipId] = m.cbBefore));

    let surplusIdx = 0;
    let deficitIdx = sorted.length - 1;

    while (surplusIdx < deficitIdx) {
      const surplus = sorted[surplusIdx];
      const deficit = sorted[deficitIdx];

      if (afterMap[surplus.shipId] <= 0) { surplusIdx++; continue; }
      if (afterMap[deficit.shipId] >= 0) { deficitIdx--; continue; }

      const transfer = Math.min(
        afterMap[surplus.shipId],
        Math.abs(afterMap[deficit.shipId]),
      );

      afterMap[surplus.shipId] -= transfer;
      afterMap[deficit.shipId] += transfer;

      if (afterMap[deficit.shipId] >= 0) deficitIdx--;
      if (afterMap[surplus.shipId] <= 0) surplusIdx++;
    }

    // Validate rules
    for (const m of memberCBs) {
      const before = m.cbBefore;
      const after = afterMap[m.shipId];

      // Deficit ship cannot exit worse
      if (before < 0 && after < before) {
        throw new Error(`Deficit ship ${m.shipId} would exit worse after pooling`);
      }

      // Surplus ship cannot exit negative
      if (before > 0 && after < 0) {
        throw new Error(`Surplus ship ${m.shipId} would exit negative after pooling`);
      }
    }

    // Persist pool
    const pool = await this.poolRepo.create(year);

    await Promise.all(
      memberCBs.map((m) =>
        this.poolRepo.addMember(pool.id, {
          shipId: m.shipId,
          cbBefore: m.cbBefore,
          cbAfter: afterMap[m.shipId],
        }),
      ),
    );

    return {
      ...pool,
      members: memberCBs.map((m) => ({
        poolId: pool.id,
        shipId: m.shipId,
        cbBefore: m.cbBefore,
        cbAfter: afterMap[m.shipId],
      })),
    };
  }
}
