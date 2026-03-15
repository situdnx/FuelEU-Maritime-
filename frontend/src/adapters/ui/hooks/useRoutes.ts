import { useState, useEffect, useCallback } from 'react';
import { routesApi } from '../api/client';
import type { Route, ComparisonResult, RouteFilters } from '../../core/domain/types';

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesApi.getAll();
      setRoutes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const setBaseline = useCallback(async (id: string) => {
    try {
      await routesApi.setBaseline(id);
      await fetchRoutes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set baseline');
    }
  }, [fetchRoutes]);

  return { routes, loading, error, setBaseline, refetch: fetchRoutes };
}

export function useFilteredRoutes(routes: Route[], filters: RouteFilters) {
  return routes.filter((r) => {
    if (filters.vesselType && r.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && r.fuelType !== filters.fuelType) return false;
    if (filters.year && r.year !== parseInt(filters.year, 10)) return false;
    return true;
  });
}

export function useComparison() {
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await routesApi.getComparison();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
