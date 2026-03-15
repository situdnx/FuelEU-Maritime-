import { useState, useCallback } from 'react';
import { complianceApi, bankingApi } from '../api/client';
import type { ComplianceBalance, BankingRecords, BankResult, ApplyResult } from '../../core/domain/types';

export function useBanking(shipId: string, year: number) {
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [records, setRecords] = useState<BankingRecords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankResult, setBankResult] = useState<BankResult | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  const fetchData = useCallback(async () => {
    if (!shipId || !year) return;
    try {
      setLoading(true);
      setError(null);
      const [cbData, recData] = await Promise.all([
        complianceApi.getCB(shipId, year),
        bankingApi.getRecords(shipId, year),
      ]);
      setCb(cbData);
      setRecords(recData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banking data');
    } finally {
      setLoading(false);
    }
  }, [shipId, year]);

  const bankSurplus = useCallback(async (amount: number) => {
    try {
      setError(null);
      const result = await bankingApi.bank(shipId, year, amount);
      setBankResult(result);
      await fetchData();
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Banking failed';
      setError(msg);
      throw new Error(msg);
    }
  }, [shipId, year, fetchData]);

  const applyBanked = useCallback(async (amount: number) => {
    try {
      setError(null);
      const result = await bankingApi.apply(shipId, year, amount);
      setApplyResult(result);
      await fetchData();
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apply failed';
      setError(msg);
      throw new Error(msg);
    }
  }, [shipId, year, fetchData]);

  return { cb, records, loading, error, bankResult, applyResult, fetchData, bankSurplus, applyBanked };
}
