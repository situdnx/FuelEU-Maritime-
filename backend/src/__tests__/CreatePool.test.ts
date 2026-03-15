import { CreatePoolUseCase } from '../core/usecases/CreatePool';
import { IPoolRepository, IComputeCBUseCase } from '../core/ports';
import { Pool, ComplianceBalance } from '../core/domain/entities';

const makeCB = (shipId: string, cb: number): ComplianceBalance => ({
  shipId,
  year: 2024,
  cbGco2eq: cb,
  energyInScope: 200000000,
  targetIntensity: 91.16,
  actualIntensity: 88.0,
});

const mockPool: Pool = {
  id: 'pool-uuid-1',
  year: 2024,
  createdAt: new Date(),
  members: [],
};

const mockPoolRepo: jest.Mocked<IPoolRepository> = {
  create: jest.fn().mockResolvedValue(mockPool),
  addMember: jest.fn().mockImplementation((_poolId, member) =>
    Promise.resolve({ poolId: 'pool-uuid-1', ...member }),
  ),
  findById: jest.fn(),
  findAllWithMembers: jest.fn(),
};

const mockComputeCB: jest.Mocked<IComputeCBUseCase> = {
  execute: jest.fn(),
};

describe('CreatePoolUseCase', () => {
  let useCase: CreatePoolUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPoolRepo.create.mockResolvedValue(mockPool);
    useCase = new CreatePoolUseCase(mockPoolRepo, mockComputeCB);
  });

  it('should create a valid pool with surplus + deficit members', async () => {
    // R002 surplus: +500, R003 deficit: -200 → sum = 300 ≥ 0 ✓
    mockComputeCB.execute
      .mockResolvedValueOnce(makeCB('R002', 500000000))
      .mockResolvedValueOnce(makeCB('R003', -200000000));

    const pool = await useCase.execute(2024, [
      { shipId: 'R002', amount: 500000000 },
      { shipId: 'R003', amount: -200000000 },
    ]);

    expect(mockPoolRepo.create).toHaveBeenCalledWith(2024);
    expect(mockPoolRepo.addMember).toHaveBeenCalledTimes(2);
    expect(pool.id).toBe('pool-uuid-1');
  });

  it('should reject pool where sum CB < 0', async () => {
    mockComputeCB.execute
      .mockResolvedValueOnce(makeCB('R003', -500000000))
      .mockResolvedValueOnce(makeCB('R001', -200000000));

    await expect(
      useCase.execute(2024, [
        { shipId: 'R003', amount: -500000000 },
        { shipId: 'R001', amount: -200000000 },
      ]),
    ).rejects.toThrow('Pool sum of CBs must be >= 0');
  });

  it('should reject pools with fewer than 2 members', async () => {
    await expect(
      useCase.execute(2024, [{ shipId: 'R001', amount: 0 }]),
    ).rejects.toThrow('at least 2 members');
  });

  it('should correctly allocate surplus to deficit via greedy algorithm', async () => {
    // R002: +400, R004: -300 → after: R002: +100, R004: 0
    mockComputeCB.execute
      .mockResolvedValueOnce(makeCB('R002', 400))
      .mockResolvedValueOnce(makeCB('R004', -300));

    await useCase.execute(2024, [
      { shipId: 'R002', amount: 400 },
      { shipId: 'R004', amount: -300 },
    ]);

    const addMemberCalls = mockPoolRepo.addMember.mock.calls;
    const r002After = addMemberCalls.find((c) => c[1].shipId === 'R002')?.[1].cbAfter;
    const r004After = addMemberCalls.find((c) => c[1].shipId === 'R004')?.[1].cbAfter;

    expect(r002After).toBe(100);
    expect(r004After).toBe(0);
  });
});
