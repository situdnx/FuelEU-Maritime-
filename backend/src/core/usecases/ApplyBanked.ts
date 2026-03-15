import { IBankRepository, IApplyBankedUseCase, IComputeCBUseCase } from '../ports';

export class ApplyBankedUseCase implements IApplyBankedUseCase {
  constructor(
    private readonly bankRepo: IBankRepository,
    private readonly computeCB: IComputeCBUseCase,
  ) {}

  async execute(
    shipId: string,
    year: number,
    amount: number,
  ): Promise<{ applied: number; cbAfter: number }> {
    if (amount <= 0) {
      throw new Error('Amount to apply must be positive');
    }

    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);

    if (totalBanked <= 0) {
      throw new Error(`No banked surplus available for ship ${shipId} in year ${year}`);
    }

    if (amount > totalBanked) {
      throw new Error(
        `Cannot apply ${amount.toFixed(2)} — only ${totalBanked.toFixed(2)} banked`,
      );
    }

    const cb = await this.computeCB.execute(shipId, year);

    await this.bankRepo.deductAmount(shipId, year, amount);

    const cbAfter = cb.cbGco2eq + amount;

    return { applied: amount, cbAfter };
  }
}
