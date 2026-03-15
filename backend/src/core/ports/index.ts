// Ports — abstractions between core and adapters

import {
  Route,
  ComplianceBalance,
  BankEntry,
  Pool,
  PoolMember,
} from '../domain/entities';

// Inbound Ports (use-case interfaces)
export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(id: string): Promise<Route>;
  save(route: Omit<Route, 'id'>): Promise<Route>;
}

export interface IComplianceRepository {
  findCB(shipId: string, year: number): Promise<ComplianceBalance | null>;
  saveCB(cb: Omit<ComplianceBalance, 'id'>): Promise<ComplianceBalance>;
}

export interface IBankRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  save(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  deductAmount(shipId: string, year: number, amount: number): Promise<void>;
}

export interface IPoolRepository {
  create(year: number): Promise<Pool>;
  addMember(poolId: string, member: Omit<PoolMember, 'poolId'>): Promise<PoolMember>;
  findById(id: string): Promise<Pool | null>;
  findAllWithMembers(): Promise<Pool[]>;
}

// Use-Case Ports
export interface IComputeCBUseCase {
  execute(shipId: string, year: number): Promise<ComplianceBalance>;
}

export interface IGetAdjustedCBUseCase {
  execute(shipId: string, year: number): Promise<{ original: ComplianceBalance; adjusted: number }>;
}

export interface IBankSurplusUseCase {
  execute(shipId: string, year: number, amount: number): Promise<BankEntry>;
}

export interface IApplyBankedUseCase {
  execute(shipId: string, year: number, amount: number): Promise<{ applied: number; cbAfter: number }>;
}

export interface ICreatePoolUseCase {
  execute(year: number, members: Array<{ shipId: string; amount: number }>): Promise<Pool>;
}

export interface IRouteComparisonUseCase {
  execute(): Promise<{
    baseline: Route;
    comparisons: Array<{
      route: Route;
      percentDiff: number;
      compliant: boolean;
    }>;
  }>;
}
