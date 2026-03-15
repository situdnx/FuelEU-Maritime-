import { useState } from 'react';
import { usePools, useShipCB } from '../hooks/usePools';
import { KpiCard, Spinner, ErrorBanner, SectionHeader, Button, Select } from './shared';
import { formatCB } from '../../../core/domain/types';

const SHIPS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS  = ['2024', '2025'];

interface MemberRow {
  shipId: string;
  amount: number;
  cb?: number;
}

function MemberCBFetcher({ shipId, year, onCb }: { shipId: string; year: number; onCb: (cb: number) => void }) {
  const { cb } = useShipCB(shipId, year);
  if (cb && cb.adjustedCB !== undefined) {
    // trigger parent update
    setTimeout(() => onCb(cb.adjustedCB!), 0);
  }
  return null;
}

export default function PoolingTab() {
  const { pools, loading, error, createPool } = usePools();
  const [year,    setYear]    = useState(2024);
  const [members, setMembers] = useState<MemberRow[]>([
    { shipId: 'R002', amount: 0 },
    { shipId: 'R003', amount: 0 },
  ]);
  const [toast,   setToast]   = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [cbMap,   setCbMap]   = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const addMember = () => {
    const unused = SHIPS.find((s) => !members.some((m) => m.shipId === s));
    if (unused) setMembers((prev) => [...prev, { shipId: unused, amount: 0 }]);
  };

  const removeMember = (idx: number) => setMembers((prev) => prev.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof MemberRow, value: string | number) => {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const poolSum   = members.reduce((s, m) => s + (cbMap[m.shipId] ?? 0), 0);
  const isValid   = members.length >= 2 && poolSum >= 0;

  const handleCreate = async () => {
    try {
      setCreating(true);
      const pool = await createPool(year, members.map((m) => ({ shipId: m.shipId, amount: cbMap[m.shipId] ?? 0 })));
      showToast(`✅ Pool created: ${pool.id.slice(0, 8)} · ${pool.members.length} members`);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Pool creation failed'}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="POOLING — ARTICLE 21"
        sub="Create compliance pools to redistribute surplus CB and lift vessels out of deficit"
      />

      {/* Pool Builder */}
      <div className="border border-ocean-700 rounded p-5 bg-ocean-800/30 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-ocean-300">Configure Pool</p>
          <Select
            label="Year"
            value={String(year)}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            options={YEARS.map((y) => ({ value: y, label: y }))}
          />
        </div>

        {/* Pool Sum Indicator */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded border ${
          isValid ? 'border-fuel-green/40 bg-fuel-green/5' : 'border-fuel-red/40 bg-fuel-red/5'
        }`}>
          <span className="text-xs font-mono uppercase tracking-widest text-ocean-400">Pool ∑CB</span>
          <span className={`font-display text-xl ${isValid ? 'text-fuel-green' : 'text-fuel-red'}`}>
            {formatCB(poolSum)}
          </span>
          <span className={`text-xs font-mono ${isValid ? 'text-fuel-green' : 'text-fuel-red'}`}>
            {isValid ? '✓ Valid (≥ 0)' : '✗ Invalid (< 0)'}
          </span>
        </div>

        {/* Member rows */}
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-ocean-900/50 rounded border border-ocean-700">
              {/* Fetch CB silently */}
              <MemberCBFetcher
                shipId={m.shipId}
                year={year}
                onCb={(cb) => setCbMap((prev) => ({ ...prev, [m.shipId]: cb }))}
              />
              <Select
                label="Ship"
                value={m.shipId}
                onChange={(e) => updateMember(idx, 'shipId', e.target.value)}
                options={SHIPS.map((s) => ({ value: s, label: s }))}
              />
              <div className="flex-1">
                <p className="text-xs font-mono uppercase tracking-widest text-ocean-300 mb-1">CB (Adjusted)</p>
                <p className={`font-mono text-sm ${(cbMap[m.shipId] ?? 0) >= 0 ? 'text-fuel-green' : 'text-fuel-red'}`}>
                  {cbMap[m.shipId] !== undefined ? formatCB(cbMap[m.shipId]) : '—'}
                </p>
              </div>
              {members.length > 2 && (
                <button
                  onClick={() => removeMember(idx)}
                  className="text-ocean-500 hover:text-fuel-red transition-colors text-xs font-mono mt-4"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={addMember} disabled={members.length >= SHIPS.length}>
            + Add Member
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || creating}
            onClick={handleCreate}
          >
            {creating ? 'Creating...' : 'Create Pool →'}
          </Button>
        </div>

        {!isValid && poolSum < 0 && (
          <p className="text-xs text-fuel-red font-mono">⚠ Sum of adjusted CBs must be ≥ 0 (Article 21)</p>
        )}
      </div>

      {toast && (
        <div className={`border rounded px-4 py-3 text-sm font-mono ${
          toast.startsWith('✅')
            ? 'border-fuel-green/40 bg-fuel-green/5 text-fuel-green'
            : 'border-fuel-red/40 bg-fuel-red/5 text-fuel-red'
        }`}>
          {toast}
        </div>
      )}

      {/* Existing Pools */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-ocean-300">Existing Pools</p>
        {loading ? <Spinner /> : error ? <ErrorBanner message={error} /> : pools.length === 0 ? (
          <p className="text-ocean-500 font-mono text-xs py-4">No pools created yet</p>
        ) : (
          pools.map((pool) => {
            const poolTotal = pool.members.reduce((s, m) => s + m.cbAfter, 0);
            return (
              <div key={pool.id} className="border border-ocean-700 rounded p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ocean-300">Pool {pool.id.slice(0, 8)} · {pool.year}</span>
                  <KpiCard label="Pool ∑ After" value={formatCB(poolTotal)} accent={poolTotal >= 0 ? 'green' : 'red'} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {pool.members.map((mem) => (
                    <div key={mem.shipId} className="p-3 bg-ocean-900/50 rounded border border-ocean-700">
                      <p className="text-xs font-mono text-fuel-blue mb-1">{mem.shipId}</p>
                      <p className="text-xs text-ocean-400">Before: <span className={mem.cbBefore >= 0 ? 'text-fuel-green' : 'text-fuel-red'}>{formatCB(mem.cbBefore)}</span></p>
                      <p className="text-xs text-ocean-400">After: <span className={mem.cbAfter >= 0 ? 'text-fuel-green' : 'text-fuel-red'}>{formatCB(mem.cbAfter)}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
