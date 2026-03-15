// Core domain types — no framework dependencies

export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbGco2eq: number;
  energyInScope: number;
  targetIntensity: number;
  actualIntensity: number;
  bankedAmount?: number;
  adjustedCB?: number;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: string;
}

export interface BankingRecords {
  entries: BankEntry[];
  totalBanked: number;
}

export interface BankResult {
  cb_before: number;
  banked: number;
  cb_after: number;
}

export interface ApplyResult {
  cb_before: number;
  applied: number;
  cb_after: number;
}

export interface RouteComparison {
  route: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComparisonResult {
  baseline: Route;
  comparisons: RouteComparison[];
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: string;
  members: PoolMember[];
}

export interface PoolInput {
  year: number;
  members: Array<{ shipId: string; amount: number }>;
}

// Filters
export interface RouteFilters {
  vesselType: string;
  fuelType: string;
  year: string;
}

export const TARGET_INTENSITY_2025 = 89.3368;
export const TARGET_INTENSITY_2024 = 91.16;

export function getTargetIntensity(year: number): number {
  return year >= 2025 ? TARGET_INTENSITY_2025 : TARGET_INTENSITY_2024;
}

export function formatCB(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)} GgCO₂e`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)} MgCO₂e`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)} kgCO₂e`;
  return `${value.toFixed(2)} gCO₂e`;
}
