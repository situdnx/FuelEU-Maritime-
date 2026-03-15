import axios from 'axios';
import type {
  Route,
  ComplianceBalance,
  BankingRecords,
  BankResult,
  ApplyResult,
  ComparisonResult,
  Pool,
  PoolInput,
} from '../../core/domain/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Routes ──────────────────────────────────────────────────────────────────
export const routesApi = {
  getAll: async (): Promise<Route[]> => {
    const res = await api.get('/routes');
    return res.data.data;
  },

  setBaseline: async (id: string): Promise<Route> => {
    const res = await api.post(`/routes/${id}/baseline`);
    return res.data.data;
  },

  getComparison: async (): Promise<ComparisonResult> => {
    const res = await api.get('/routes/comparison');
    return res.data.data;
  },
};

// ─── Compliance ──────────────────────────────────────────────────────────────
export const complianceApi = {
  getCB: async (shipId: string, year: number): Promise<ComplianceBalance> => {
    const res = await api.get('/compliance/cb', { params: { shipId, year } });
    return res.data.data;
  },

  getAdjustedCB: async (shipId: string, year: number): Promise<ComplianceBalance> => {
    const res = await api.get('/compliance/adjusted-cb', { params: { shipId, year } });
    return res.data.data;
  },
};

// ─── Banking ─────────────────────────────────────────────────────────────────
export const bankingApi = {
  getRecords: async (shipId: string, year: number): Promise<BankingRecords> => {
    const res = await api.get('/banking/records', { params: { shipId, year } });
    return res.data.data;
  },

  bank: async (shipId: string, year: number, amount: number): Promise<BankResult> => {
    const res = await api.post('/banking/bank', { shipId, year, amount });
    return res.data.data;
  },

  apply: async (shipId: string, year: number, amount: number): Promise<ApplyResult> => {
    const res = await api.post('/banking/apply', { shipId, year, amount });
    return res.data.data;
  },
};

// ─── Pools ───────────────────────────────────────────────────────────────────
export const poolsApi = {
  getAll: async (): Promise<Pool[]> => {
    const res = await api.get('/pools');
    return res.data.data;
  },

  create: async (input: PoolInput): Promise<Pool> => {
    const res = await api.post('/pools', input);
    return res.data.data;
  },
};
