import { useState } from 'react';
import RoutesTab  from './adapters/ui/pages/RoutesTab';
import CompareTab from './adapters/ui/pages/CompareTab';
import BankingTab from './adapters/ui/pages/BankingTab';
import PoolingTab from './adapters/ui/pages/PoolingTab';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'routes',  label: 'Routes',  icon: '🛳' },
  { id: 'compare', label: 'Compare', icon: '📊' },
  { id: 'banking', label: 'Banking', icon: '🏦' },
  { id: 'pooling', label: 'Pooling', icon: '🔗' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  return (
    <div className="min-h-screen bg-ocean-950 text-ocean-100 font-body">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(10,50,88,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(10,50,88,0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-ocean-800 bg-ocean-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-widest text-ocean-50">
              FUEL<span className="text-fuel-blue">EU</span> MARITIME
            </h1>
            <p className="text-xs font-mono text-ocean-400 mt-0.5 tracking-widest uppercase">
              Compliance Platform · Regulation (EU) 2023/1805
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fuel-green animate-pulse" />
            <span className="text-xs font-mono text-ocean-400">Live</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-5 py-3 text-xs font-mono uppercase tracking-widest transition-all border-b-2
                  ${activeTab === tab.id
                    ? 'border-fuel-blue text-fuel-blue bg-ocean-800/40'
                    : 'border-transparent text-ocean-400 hover:text-ocean-200 hover:border-ocean-600'}
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'routes'  && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-ocean-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-mono text-ocean-600">
          <span>FuelEU Maritime · Articles 20–21 · Annex IV</span>
          <span>Target 2025: 89.3368 gCO₂e/MJ · Target 2024: 91.16 gCO₂e/MJ</span>
        </div>
      </footer>
    </div>
  );
}
