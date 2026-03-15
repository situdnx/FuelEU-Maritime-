import { BankSurplusUseCase } from '../core/usecases/BankSurplus';
import { IBankRepository, IComputeCBUseCase } from '../core/ports';
import { ComplianceBalance, BankEntry } from '../core/domain/entities';

const surplusCB: ComplianceBalance = {
  shipId: 'R002',
  year: 2024,
  cbGco2eq: 758400000,
  energyInScope: 240000000,
  targetIntensity: 91.16,
  actualIntensity: 88.0,
};

const mockComputeCB: jest.Mocked<IComputeCBUseCase> = {
  execute: jest.fn().mockResolvedValue(surplusCB),
};

const mockBankEntry: BankEntry = {
  id: 'bank-uuid-1',
  shipId: 'R002',
  year: 2024,
  amountGco2eq: 100000000,
  createdAt: new Date(),
};

const mockBankRepo: jest.Mocked<IBankRepository> = {
  findByShipAndYear: jest.fn(),
  getTotalBanked: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue(mockBankEntry),
  deductAmount: jest.fn(),
};

describe('BankSurplusUseCase', () => {
  let useCase: BankSurplusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockComputeCB.execute.mockResolvedValue(surplusCB);
    mockBankRepo.save.mockResolvedValue(mockBankEntry);
    useCase = new BankSurplusUseCase(mockBankRepo, mockComputeCB);
  });

  it('should bank a valid surplus amount', async () => {
    const result = await useCase.execute('R002', 2024, 100000000);
    expect(mockBankRepo.save).toHaveBeenCalledWith({
      shipId: 'R002',
      year: 2024,
      amountGco2eq: 100000000,
    });
    expect(result.amountGco2eq).toBe(100000000);
  });

  it('should throw if amount is zero or negative', async () => {
    await expect(useCase.execute('R002', 2024, 0)).rejects.toThrow('must be positive');
    await expect(useCase.execute('R002', 2024, -500)).rejects.toThrow('must be positive');
  });

  it('should throw if ship has no surplus (negative CB)', async () => {
    mockComputeCB.execute.mockResolvedValueOnce({ ...surplusCB, cbGco2eq: -50000 });
    await expect(useCase.execute('R003', 2024, 10000)).rejects.toThrow('no surplus to bank');
  });

  it('should throw if amount exceeds available surplus', async () => {
    await expect(useCase.execute('R002', 2024, 999999999999)).rejects.toThrow('Cannot bank');
  });
});
