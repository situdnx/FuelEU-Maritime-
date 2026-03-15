import React from 'react';

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'yellow' | 'blue' | 'neutral';
}

export function KpiCard({ label, value, sub, accent = 'neutral' }: KpiCardProps) {
  const accentMap = {
    green:   'border-fuel-green text-fuel-green',
    red:     'border-fuel-red text-fuel-red',
    yellow:  'border-fuel-yellow text-fuel-yellow',
    blue:    'border-fuel-blue text-fuel-blue',
    neutral: 'border-ocean-600 text-ocean-100',
  };
  return (
    <div className={`border-l-2 pl-4 py-2 ${accentMap[accent]}`}>
      <p className="text-xs font-mono uppercase tracking-widest text-ocean-300 mb-1">{label}</p>
      <p className={`font-display text-2xl tracking-wide ${accentMap[accent].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-ocean-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface BadgeProps { compliant: boolean }
export function ComplianceBadge({ compliant }: BadgeProps) {
  return compliant
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-fuel-green/10 text-fuel-green border border-fuel-green/30">✅ COMPLIANT</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-fuel-red/10 text-fuel-red border border-fuel-red/30">❌ DEFICIT</span>;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-ocean-600 border-t-fuel-blue rounded-full animate-spin" />
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border border-fuel-red/40 bg-fuel-red/5 rounded px-4 py-3 text-fuel-red text-sm font-mono">
      ⚠ {message}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-3xl text-ocean-50 tracking-wide">{title}</h2>
      {sub && <p className="text-ocean-400 text-sm mt-1 font-body">{sub}</p>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, keyFn, emptyMessage = 'No data' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded border border-ocean-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ocean-700 bg-ocean-800/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-ocean-300"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-ocean-500 font-mono text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyFn(row)}
                className="border-b border-ocean-800 hover:bg-ocean-800/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 font-mono text-xs text-ocean-100 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function Input({ label, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-ocean-300 mb-1 block">{label}</span>
      <input
        {...props}
        className="w-full bg-ocean-800 border border-ocean-600 rounded px-3 py-2 text-ocean-100 font-mono text-sm focus:outline-none focus:border-fuel-blue transition-colors"
      />
    </label>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
}
export function Select({ label, options, ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-ocean-300 mb-1 block">{label}</span>
      <select
        {...props}
        className="w-full bg-ocean-800 border border-ocean-600 rounded px-3 py-2 text-ocean-100 font-mono text-sm focus:outline-none focus:border-fuel-blue transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'font-mono uppercase tracking-widest rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-xs' };
  const variants = {
    primary: 'bg-fuel-blue/20 border border-fuel-blue text-fuel-blue hover:bg-fuel-blue hover:text-ocean-950',
    danger:  'bg-fuel-red/10 border border-fuel-red/50 text-fuel-red hover:bg-fuel-red hover:text-white',
    ghost:   'border border-ocean-600 text-ocean-300 hover:border-ocean-400 hover:text-ocean-100',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
