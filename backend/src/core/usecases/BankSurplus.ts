import { BankEntry } from '../domain/entities';
import { IBankRepository, IBankSurplusUseCase, IComputeCBUseCase } from '../ports';

export class BankSurplusUseCase implements IBankSurplusUseCase {
  constructor(
    private readonly bankRepo: IBankRepository,
    private readonly computeCB: IComputeCBUseCase,
  ) {}

  async execute(shipId: string, year: number, amount: number): Promise<BankEntry> {
    if (amount <= 0) {
      throw new Error('Amount to bank must be positive');
    }

    const cb = await this.computeCB.execute(shipId, year);

    if (cb.cbGco2eq <= 0) {
      throw new Error(`Ship ${shipId} has no surplus to bank (CB: ${cb.cbGco2eq.toFixed(2)})`);
    }

    if (amount > cb.cbGco2eq) {
      throw new Error(
        `Cannot bank ${amount.toFixed(2)} — available surplus is ${cb.cbGco2eq.toFixed(2)}`,
      );
    }

    return this.bankRepo.save({ shipId, year, amountGco2eq: amount });
  }
}
