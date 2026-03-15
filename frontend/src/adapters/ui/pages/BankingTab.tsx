import { useState, useEffect } from 'react';
import { useBanking } from '../hooks/useBanking';
import { KpiCard, Spinner, ErrorBanner, SectionHeader, Button, Input, Select } from './shared';
import { formatCB } from '../../../core/domain/types';

const SHIPS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS  = ['2024', '2025'];

export default function BankingTab() {
  const [shipId, setShipId] = useState('R002');
  const [year,   setYear]   = useState(2024);
  const [amount, setAmount] = useState('');
  const [mode,   setMode]   = useState<'bank' | 'apply'>('bank');
  const [toast,  setToast]  = useState<string | null>(null);

  const { cb, records, loading, error, fetchData, bankSurplus, applyBanked } = useBanking(shipId, year);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      if (mode === 'bank') {
        const r = await bankSurplus(amt);
        showToast(`✅ Banked ${formatCB(r.banked)} · CB after: ${formatCB(r.cb_after)}`);
      } else {
        const r = await applyBanked(amt);
        showToast(`✅ Applied ${formatCB(r.applied)} · CB after: ${formatCB(r.cb_after)}`);
      }
      setAmount('');
    } catch {/* error shown via hook */}
  };

  const isSurplus   = cb && cb.cbGco2eq > 0;
  const hasBanked   = records && records.totalBanked > 0;
  const canBank     = mode === 'bank' && isSurplus;
  const canApply    = mode === 'apply' && hasBanked;
  const canSubmit   = canBank || canApply;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="BANKING — ARTICLE 20"
        sub="Bank surplus compliance balance for future use or apply stored surplus to offset deficits"
      />

      {/* Ship + Year selectors */}
      <div className="flex flex-wrap gap-4 p-4 bg-ocean-800/40 rounded border border-ocean-700">
        <Select
          label="Ship / Route"
          value={shipId}
          onChange={(e) => setShipId(e.target.value)}
          options={SHIPS.map((s) => ({ value: s, label: s }))}
        />
        <Select
          label="Year"
          value={String(year)}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          options={YEARS.map((y) => ({ value: y, label: y }))}
        />
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={fetchData}>Refresh</Button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {error && <ErrorBanner message={error} />}

          {/* KPIs */}
          {cb && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="Compliance Balance"
                value={formatCB(cb.cbGco2eq)}
                sub={cb.cbGco2eq > 0 ? 'Surplus' : 'Deficit'}
                accent={cb.cbGco2eq > 0 ? 'green' : 'red'}
              />
              <KpiCard
                label="GHG Intensity"
                value={`${cb.actualIntensity} gCO₂e/MJ`}
                sub={`Target: ${cb.targetIntensity}`}
                accent={cb.actualIntensity <= cb.targetIntensity ? 'green' : 'red'}
              />
              <KpiCard
                label="Energy In Scope"
                value={`${(cb.energyInScope / 1e6).toFixed(1)} TJ`}
                accent="blue"
              />
              <KpiCard
                label="Total Banked"
                value={records ? formatCB(records.totalBanked) : '—'}
                sub={records?.entries.length ? `${records.entries.length} entries` : 'None stored'}
                accent={hasBanked ? 'yellow' : 'neutral'}
              />
            </div>
          )}

          {/* Action Panel */}
          <div className="border border-ocean-700 rounded p-5 bg-ocean-800/30 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-ocean-300">Action</p>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'bank' ? 'primary' : 'ghost'}
                onClick={() => setMode('bank')}
                disabled={!isSurplus}
              >
                Bank Surplus
              </Button>
              <Button
                variant={mode === 'apply' ? 'primary' : 'ghost'}
                onClick={() => setMode('apply')}
                disabled={!hasBanked}
              >
                Apply Banked
              </Button>
            </div>

            {!isSurplus && mode === 'bank' && (
              <p className="text-xs text-fuel-red font-mono">⚠ No surplus to bank — CB must be positive</p>
            )}
            {!hasBanked && mode === 'apply' && (
              <p className="text-xs text-fuel-red font-mono">⚠ No banked surplus available for this ship/year</p>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label={`Amount to ${mode === 'bank' ? 'bank' : 'apply'} (gCO₂e)`}
                  type="number"
                  min="1"
                  step="1000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100000000"
                />
              </div>
              <Button
                variant="primary"
                disabled={!canSubmit || !amount || parseFloat(amount) <= 0}
                onClick={handleAction}
              >
                {mode === 'bank' ? 'Bank →' : 'Apply →'}
              </Button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="border border-fuel-green/40 bg-fuel-green/5 rounded px-4 py-3 text-fuel-green text-sm font-mono animate-pulse">
              {toast}
            </div>
          )}

          {/* Bank Entries Log */}
          {records && records.entries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-widest text-ocean-300">Banking Ledger</p>
              <div className="border border-ocean-700 rounded overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-ocean-800 border-b border-ocean-700">
                      <th className="px-4 py-2 text-left text-ocean-400 uppercase tracking-widest">Entry ID</th>
                      <th className="px-4 py-2 text-left text-ocean-400 uppercase tracking-widest">Amount</th>
                      <th className="px-4 py-2 text-left text-ocean-400 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.entries.map((e) => (
                      <tr key={e.id} className="border-b border-ocean-800 hover:bg-ocean-800/30">
                        <td className="px-4 py-2 text-ocean-400">{e.id.slice(0, 8)}…</td>
                        <td className="px-4 py-2 text-fuel-green">{formatCB(e.amountGco2eq)}</td>
                        <td className="px-4 py-2 text-ocean-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
