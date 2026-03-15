import { Route } from '../domain/entities';
import { IRouteRepository, IRouteComparisonUseCase } from '../ports';
import { getTargetIntensity } from '../domain/entities';

export class RouteComparisonUseCase implements IRouteComparisonUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<{
    baseline: Route;
    comparisons: Array<{ route: Route; percentDiff: number; compliant: boolean }>;
  }> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      throw new Error('No baseline route set');
    }

    const allRoutes = await this.routeRepo.findAll();
    const others = allRoutes.filter((r) => r.id !== baseline.id);

    const comparisons = others.map((route) => {
      // percentDiff = ((comparison / baseline) − 1) × 100
      const percentDiff = ((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const target = getTargetIntensity(route.year);
      const compliant = route.ghgIntensity <= target;

      return { route, percentDiff, compliant };
    });

    return { baseline, comparisons };
  }
}
