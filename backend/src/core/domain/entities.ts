// Core Domain Entities — no framework dependencies

export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;      // gCO2e/MJ
  fuelConsumption: number;   // tonnes
  distance: number;          // km
  totalEmissions: number;    // tonnes
  isBaseline: boolean;
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbGco2eq: number;          // positive = surplus, negative = deficit
  energyInScope: number;     // MJ
  targetIntensity: number;   // gCO2e/MJ
  actualIntensity: number;   // gCO2e/MJ
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
  members: PoolMember[];
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface RouteComparison {
  baselineRoute: Route;
  comparisonRoute: Route;
  percentDiff: number;
  compliant: boolean;
}

// FuelEU Maritime Constants (Annex IV)
export const FUEL_EU_CONSTANTS = {
  TARGET_INTENSITY_2025: 89.3368,  // gCO2e/MJ (2% below 91.16)
  TARGET_INTENSITY_2024: 91.16,    // gCO2e/MJ (baseline year)
  ENERGY_CONTENT_HFO: 41000,       // MJ/t
  ENERGY_CONTENT_LNG: 50000,       // MJ/t
  ENERGY_CONTENT_MGO: 42700,       // MJ/t
  DEFAULT_ENERGY_CONTENT: 41000,   // MJ/t fallback
} as const;

export function getEnergyContent(fuelType: string): number {
  const map: Record<string, number> = {
    HFO: FUEL_EU_CONSTANTS.ENERGY_CONTENT_HFO,
    LNG: FUEL_EU_CONSTANTS.ENERGY_CONTENT_LNG,
    MGO: FUEL_EU_CONSTANTS.ENERGY_CONTENT_MGO,
  };
  return map[fuelType.toUpperCase()] ?? FUEL_EU_CONSTANTS.DEFAULT_ENERGY_CONTENT;
}

export function getTargetIntensity(year: number): number {
  if (year >= 2025) return FUEL_EU_CONSTANTS.TARGET_INTENSITY_2025;
  return FUEL_EU_CONSTANTS.TARGET_INTENSITY_2024;
}
