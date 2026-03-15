import { useState, useEffect, useCallback } from 'react';
import { complianceApi, poolsApi } from '../api/client';
import type { Pool, ComplianceBalance } from '../../core/domain/types';

export interface PoolMemberInput {
  shipId: string;
  amount: number;
  cb?: ComplianceBalance;
}

export function usePools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await poolsApi.getAll();
      setPools(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const createPool = useCallback(async (year: number, members: PoolMemberInput[]) => {
    try {
      setError(null);
      const pool = await poolsApi.create({
        year,
        members: members.map((m) => ({ shipId: m.shipId, amount: m.amount })),
      });
      await fetchPools();
      return pool;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pool creation failed';
      setError(msg);
      throw new Error(msg);
    }
  }, [fetchPools]);

  return { pools, loading, error, createPool, refetch: fetchPools };
}

export function useShipCB(shipId: string, year: number) {
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shipId || !year) return;
    setLoading(true);
    complianceApi.getAdjustedCB(shipId, year)
      .then(setCb)
      .catch(() => setCb(null))
      .finally(() => setLoading(false));
  }, [shipId, year]);

  return { cb, loading };
}
