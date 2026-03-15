import { RouteComparisonUseCase } from '../core/usecases/RouteComparison';
import { IRouteRepository } from '../core/ports';
import { Route } from '../core/domain/entities';

const baseline: Route = {
  id: 'uuid-1', routeId: 'R001', vesselType: 'Container', fuelType: 'HFO',
  year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000,
  totalEmissions: 4500, isBaseline: true,
};

const routes: Route[] = [
  baseline,
  { ...baseline, id: 'uuid-2', routeId: 'R002', fuelType: 'LNG', ghgIntensity: 88.0, isBaseline: false },
  { ...baseline, id: 'uuid-3', routeId: 'R003', fuelType: 'MGO', ghgIntensity: 93.5, isBaseline: false },
];

const mockRouteRepo: jest.Mocked<IRouteRepository> = {
  findAll: jest.fn().mockResolvedValue(routes),
  findById: jest.fn(),
  findByRouteId: jest.fn(),
  findBaseline: jest.fn().mockResolvedValue(baseline),
  setBaseline: jest.fn(),
  save: jest.fn(),
};

describe('RouteComparisonUseCase', () => {
  let useCase: RouteComparisonUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteRepo.findAll.mockResolvedValue(routes);
    mockRouteRepo.findBaseline.mockResolvedValue(baseline);
    useCase = new RouteComparisonUseCase(mockRouteRepo);
  });

  it('should return baseline and comparisons', async () => {
    const result = await useCase.execute();
    expect(result.baseline.routeId).toBe('R001');
    expect(result.comparisons).toHaveLength(2);
  });

  it('should calculate correct percentDiff', async () => {
    const result = await useCase.execute();
    const r002 = result.comparisons.find((c) => c.route.routeId === 'R002');
    // percentDiff = ((88.0 / 91.0) - 1) * 100 ≈ -3.296%
    expect(r002?.percentDiff).toBeCloseTo(-3.296, 1);
  });

  it('should mark compliant routes correctly (2024 target = 91.16)', async () => {
    const result = await useCase.execute();
    const r002 = result.comparisons.find((c) => c.route.routeId === 'R002');
    const r003 = result.comparisons.find((c) => c.route.routeId === 'R003');
    expect(r002?.compliant).toBe(true);  // 88.0 <= 91.16
    expect(r003?.compliant).toBe(false); // 93.5 > 91.16
  });

  it('should throw if no baseline is set', async () => {
    mockRouteRepo.findBaseline.mockResolvedValueOnce(null);
    await expect(useCase.execute()).rejects.toThrow('No baseline route set');
  });
});
