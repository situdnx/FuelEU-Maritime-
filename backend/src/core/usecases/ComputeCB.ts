import {
  ComplianceBalance,
  getEnergyContent,
  getTargetIntensity,
} from '../domain/entities';
import {
  IRouteRepository,
  IComputeCBUseCase,
} from '../ports';

export class ComputeCBUseCase implements IComputeCBUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    // Find route by routeId (shipId maps to routeId in our domain)
    const route = await this.routeRepo.findByRouteId(shipId);
    if (!route) {
      throw new Error(`Route not found for shipId: ${shipId}`);
    }

    const energyContent = getEnergyContent(route.fuelType);
    const energyInScope = route.fuelConsumption * energyContent; // MJ
    const targetIntensity = getTargetIntensity(year);
    const actualIntensity = route.ghgIntensity;

    // CB = (Target − Actual) × Energy in scope
    // Positive = Surplus, Negative = Deficit
    const cbGco2eq = (targetIntensity - actualIntensity) * energyInScope;

    return {
      shipId,
      year,
      cbGco2eq,
      energyInScope,
      targetIntensity,
      actualIntensity,
    };
  }
}
