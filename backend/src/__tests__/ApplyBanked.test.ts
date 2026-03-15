import { ApplyBankedUseCase } from '../core/usecases/ApplyBanked';
import { IBankRepository, IComputeCBUseCase } from '../core/ports';
import { ComplianceBalance } from '../core/domain/entities';

const deficitCB: ComplianceBalance = {
  shipId: 'R003',
  year: 2024,
  cbGco2eq: -509379000,
  energyInScope: 217770000,
  targetIntensity: 91.16,
  actualIntensity: 93.5,
};

const mockComputeCB: jest.Mocked<IComputeCBUseCase> = {
  execute: jest.fn().mockResolvedValue(deficitCB),
};

const mockBankRepo: jest.Mocked<IBankRepository> = {
  findByShipAndYear: jest.fn(),
  getTotalBanked: jest.fn().mockResolvedValue(600000000),
  save: jest.fn(),
  deductAmount: jest.fn().mockResolvedValue(undefined),
};

describe('ApplyBankedUseCase', () => {
  let useCase: ApplyBankedUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockComputeCB.execute.mockResolvedValue(deficitCB);
    mockBankRepo.getTotalBanked.mockResolvedValue(600000000);
    mockBankRepo.deductAmount.mockResolvedValue(undefined);
    useCase = new ApplyBankedUseCase(mockBankRepo, mockComputeCB);
  });

  it('should apply banked amount and return updated CB', async () => {
    const result = await useCase.execute('R003', 2024, 500000000);
    expect(result.applied).toBe(500000000);
    expect(result.cbAfter).toBe(deficitCB.cbGco2eq + 500000000);
    expect(mockBankRepo.deductAmount).toHaveBeenCalledWith('R003', 2024, 500000000);
  });

  it('should throw if no banked surplus available', async () => {
    mockBankRepo.getTotalBanked.mockResolvedValueOnce(0);
    await expect(useCase.execute('R003', 2024, 100)).rejects.toThrow('No banked surplus available');
  });

  it('should throw if applying more than banked', async () => {
    await expect(useCase.execute('R003', 2024, 999999999999)).rejects.toThrow('Cannot apply');
  });

  it('should throw for non-positive amount', async () => {
    await expect(useCase.execute('R003', 2024, -100)).rejects.toThrow('must be positive');
    await expect(useCase.execute('R003', 2024, 0)).rejects.toThrow('must be positive');
  });
});
