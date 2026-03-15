import { ComputeCBUseCase } from '../core/usecases/ComputeCB';
import { IRouteRepository } from '../core/ports';
import { Route } from '../core/domain/entities';

const mockRoute: Route = {
  id: 'uuid-1',
  routeId: 'R001',
  vesselType: 'Container',
  fuelType: 'HFO',
  year: 2024,
  ghgIntensity: 91.0,
  fuelConsumption: 5000,
  distance: 12000,
  totalEmissions: 4500,
  isBaseline: true,
};

const mockRouteRepo: jest.Mocked<IRouteRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByRouteId: jest.fn().mockResolvedValue(mockRoute),
  findBaseline: jest.fn(),
  setBaseline: jest.fn(),
  save: jest.fn(),
};

describe('ComputeCBUseCase', () => {
  let useCase: ComputeCBUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ComputeCBUseCase(mockRouteRepo);
  });

  it('should compute positive CB (surplus) when actual < target', async () => {
    // R002: LNG, ghgIntensity=88.0, fuelConsumption=4800
    const lngRoute: Route = { ...mockRoute, routeId: 'R002', fuelType: 'LNG', ghgIntensity: 88.0, fuelConsumption: 4800 };
    mockRouteRepo.findByRouteId.mockResolvedValueOnce(lngRoute);

    const result = await useCase.execute('R002', 2024);

    // energy = 4800 * 50000 = 240,000,000 MJ
    // CB = (91.16 - 88.0) * 240,000,000 = 758,400,000
    expect(result.cbGco2eq).toBeGreaterThan(0);
    expect(result.energyInScope).toBe(4800 * 50000);
    expect(result.actualIntensity).toBe(88.0);
  });

  it('should compute negative CB (deficit) when actual > target', async () => {
    // R001: HFO, ghgIntensity=91.0 (above target 91.16? No, 91.0 < 91.16 in 2024)
    // Use R003: MGO, ghgIntensity=93.5 (above target)
    const mgoRoute: Route = { ...mockRoute, routeId: 'R003', fuelType: 'MGO', ghgIntensity: 93.5, fuelConsumption: 5100 };
    mockRouteRepo.findByRouteId.mockResolvedValueOnce(mgoRoute);

    const result = await useCase.execute('R003', 2024);

    // energy = 5100 * 42700 = 217,770,000 MJ
    // CB = (91.16 - 93.5) * 217,770,000 → negative
    expect(result.cbGco2eq).toBeLessThan(0);
    expect(result.energyInScope).toBe(5100 * 42700);
  });

  it('should use 2025 target (89.3368) for year 2025', async () => {
    const route2025: Route = { ...mockRoute, routeId: 'R004', fuelType: 'HFO', ghgIntensity: 89.2, year: 2025 };
    mockRouteRepo.findByRouteId.mockResolvedValueOnce(route2025);

    const result = await useCase.execute('R004', 2025);

    expect(result.targetIntensity).toBe(89.3368);
    // 89.2 < 89.3368 → surplus
    expect(result.cbGco2eq).toBeGreaterThan(0);
  });

  it('should throw when route not found', async () => {
    mockRouteRepo.findByRouteId.mockResolvedValueOnce(null);
    await expect(useCase.execute('NONEXISTENT', 2024)).rejects.toThrow('Route not found');
  });

  it('should compute energy correctly for HFO (41000 MJ/t)', async () => {
    mockRouteRepo.findByRouteId.mockResolvedValueOnce(mockRoute);
    const result = await useCase.execute('R001', 2024);
    expect(result.energyInScope).toBe(5000 * 41000);
  });
});
