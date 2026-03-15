import { useComparison } from '../hooks/useRoutes';
import { DataTable, KpiCard, Spinner, ErrorBanner, SectionHeader, ComplianceBadge } from './shared';
import type { RouteComparison } from '../../../core/domain/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

const TARGET_2024 = 91.16;
const TARGET_2025 = 89.3368;

export default function CompareTab() {
  const { data, loading, error } = useComparison();

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;
  if (!data)   return <ErrorBanner message="No comparison data available — set a baseline first." />;

  const { baseline, comparisons } = data;
  const target = baseline.year >= 2025 ? TARGET_2025 : TARGET_2024;
  const compliantCount = comparisons.filter((c) => c.compliant).length;

  const chartData = [
    {
      name: `${baseline.routeId} (Baseline)`,
      ghg: baseline.ghgIntensity,
      isBaseline: true,
      compliant: baseline.ghgIntensity <= target,
    },
    ...comparisons.map((c) => ({
      name: c.route.routeId,
      ghg: c.route.ghgIntensity,
      isBaseline: false,
      compliant: c.compliant,
    })),
  ];

  const columns = [
    { key: 'routeId',    header: 'Route',      render: (c: RouteComparison) => <span className="text-fuel-blue">{c.route.routeId}</span> },
    { key: 'vessel',     header: 'Vessel',      render: (c: RouteComparison) => c.route.vesselType },
    { key: 'fuel',       header: 'Fuel',        render: (c: RouteComparison) => c.route.fuelType },
    { key: 'year',       header: 'Year',        render: (c: RouteComparison) => c.route.year },
    { key: 'ghg',        header: 'GHG (gCO₂e/MJ)', render: (c: RouteComparison) => c.route.ghgIntensity.toFixed(4) },
    {
      key: 'diff',
      header: '% vs Baseline',
      render: (c: RouteComparison) => {
        const color = c.percentDiff < 0 ? 'text-fuel-green' : 'text-fuel-red';
        const sign  = c.percentDiff > 0 ? '+' : '';
        return <span className={color}>{sign}{c.percentDiff.toFixed(2)}%</span>;
      },
    },
    { key: 'compliant',  header: 'Status',      render: (c: RouteComparison) => <ComplianceBadge compliant={c.compliant} /> },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ROUTE COMPARISON"
        sub={`Baseline: ${baseline.routeId} (${baseline.ghgIntensity} gCO₂e/MJ) · Target: ${target} gCO₂e/MJ`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Baseline GHG"  value={`${baseline.ghgIntensity} gCO₂e/MJ`}     accent="yellow" />
        <KpiCard label="Target"        value={`${target} gCO₂e/MJ`}                      accent="blue" />
        <KpiCard label="Compliant"     value={`${compliantCount}/${comparisons.length}`}  accent="green" />
        <KpiCard label="Non-Compliant" value={`${comparisons.length - compliantCount}/${comparisons.length}`} accent="red" />
      </div>

      {/* Bar Chart */}
      <div className="bg-ocean-800/40 border border-ocean-700 rounded p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-ocean-300 mb-4">GHG Intensity Comparison</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#072540" />
            <XAxis dataKey="name" tick={{ fill: '#5ba8e8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
            <YAxis
              domain={[85, 96]}
              tick={{ fill: '#5ba8e8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft', fill: '#2a80cc', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ background: '#041929', border: '1px solid #0a3258', fontFamily: 'JetBrains Mono', fontSize: 12 }}
              labelStyle={{ color: '#5ba8e8' }}
            />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
            <ReferenceLine y={target}   stroke="#00e8a0" strokeDasharray="6 3" label={{ value: 'Target', fill: '#00e8a0', fontSize: 10 }} />
            <ReferenceLine y={TARGET_2024} stroke="#ffe066" strokeDasharray="6 3" label={{ value: '2024 Limit', fill: '#ffe066', fontSize: 10 }} />
            <Bar dataKey="ghg" name="GHG Intensity" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.isBaseline ? '#ffe066' : entry.compliant ? '#00e8a0' : '#ff4d6a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <DataTable
        columns={columns}
        rows={comparisons}
        keyFn={(c) => c.route.id}
        emptyMessage="No comparison routes available"
      />

      <p className="text-xs text-ocean-500 font-mono">
        Formula: percentDiff = ((comparison / baseline) − 1) × 100 · Compliant = GHG ≤ FuelEU target
      </p>
    </div>
  );
}
