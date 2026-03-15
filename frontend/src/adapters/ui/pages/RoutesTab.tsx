import { useState } from 'react';
import { useRoutes, useFilteredRoutes } from '../hooks/useRoutes';
import { DataTable, KpiCard, Spinner, ErrorBanner, SectionHeader, Button, Select } from './shared';
import type { Route, RouteFilters } from '../../../core/domain/types';

const VESSEL_TYPES = ['', 'Container', 'BulkCarrier', 'Tanker', 'RoRo'];
const FUEL_TYPES   = ['', 'HFO', 'LNG', 'MGO'];
const YEARS        = ['', '2024', '2025'];

export default function RoutesTab() {
  const { routes, loading, error, setBaseline } = useRoutes();
  const [filters, setFilters] = useState<RouteFilters>({ vesselType: '', fuelType: '', year: '' });
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);
  const filtered = useFilteredRoutes(routes, filters);

  const handleSetBaseline = async (id: string) => {
    setSettingBaseline(id);
    await setBaseline(id);
    setSettingBaseline(null);
  };

  const columns = [
    { key: 'routeId',        header: 'Route ID',            render: (r: Route) => <span className="text-fuel-blue">{r.routeId}</span> },
    { key: 'vesselType',     header: 'Vessel Type',         render: (r: Route) => r.vesselType },
    { key: 'fuelType',       header: 'Fuel',                render: (r: Route) => r.fuelType },
    { key: 'year',           header: 'Year',                render: (r: Route) => r.year },
    { key: 'ghgIntensity',   header: 'GHG (gCO₂e/MJ)',     render: (r: Route) => (
      <span className={r.ghgIntensity > 91.16 ? 'text-fuel-red' : 'text-fuel-green'}>
        {r.ghgIntensity.toFixed(4)}
      </span>
    )},
    { key: 'fuelConsumption',header: 'Fuel (t)',            render: (r: Route) => r.fuelConsumption.toLocaleString() },
    { key: 'distance',       header: 'Distance (km)',       render: (r: Route) => r.distance.toLocaleString() },
    { key: 'totalEmissions', header: 'Emissions (t)',       render: (r: Route) => r.totalEmissions.toLocaleString() },
    { key: 'baseline',       header: 'Baseline',            render: (r: Route) => (
      r.isBaseline
        ? <span className="text-fuel-yellow font-bold">★ BASELINE</span>
        : (
          <Button
            size="sm"
            variant="ghost"
            disabled={settingBaseline === r.id}
            onClick={() => handleSetBaseline(r.id)}
          >
            {settingBaseline === r.id ? '...' : 'Set'}
          </Button>
        )
    )},
  ];

  const totalRoutes   = routes.length;
  const compliantCount = routes.filter((r) => r.ghgIntensity <= (r.year >= 2025 ? 89.3368 : 91.16)).length;
  const avgGhg        = routes.length ? (routes.reduce((s, r) => s + r.ghgIntensity, 0) / routes.length).toFixed(2) : '—';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="FLEET ROUTES"
        sub="All registered routes with GHG intensity against FuelEU Maritime targets"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Routes"     value={String(totalRoutes)}   accent="neutral" />
        <KpiCard label="Compliant"        value={String(compliantCount)} accent="green" />
        <KpiCard label="Non-Compliant"    value={String(totalRoutes - compliantCount)} accent="red" />
        <KpiCard label="Avg GHG Intensity" value={`${avgGhg} gCO₂e/MJ`} accent="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-ocean-800/40 rounded border border-ocean-700">
        <Select
          label="Vessel Type"
          value={filters.vesselType}
          onChange={(e) => setFilters((f) => ({ ...f, vesselType: e.target.value }))}
          options={VESSEL_TYPES.map((v) => ({ value: v, label: v || 'All Types' }))}
        />
        <Select
          label="Fuel Type"
          value={filters.fuelType}
          onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value }))}
          options={FUEL_TYPES.map((v) => ({ value: v, label: v || 'All Fuels' }))}
        />
        <Select
          label="Year"
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
          options={YEARS.map((v) => ({ value: v, label: v || 'All Years' }))}
        />
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={() => setFilters({ vesselType: '', fuelType: '', year: '' })}>
            Clear Filters
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <Spinner /> : (
        <DataTable
          columns={columns}
          rows={filtered}
          keyFn={(r) => r.id}
          emptyMessage="No routes match the current filters"
        />
      )}

      <p className="text-xs text-ocean-500 font-mono">
        Target: 91.16 gCO₂e/MJ (2024) · 89.3368 gCO₂e/MJ (2025) — FuelEU Maritime Annex IV
      </p>
    </div>
  );
}
