import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard, ComplianceBadge, ErrorBanner } from '../adapters/ui/components/shared';

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total Routes" value="5" />);
    expect(screen.getByText('Total Routes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders sub text when provided', () => {
    render(<KpiCard label="CB" value="100 MgCO₂e" sub="Surplus" />);
    expect(screen.getByText('Surplus')).toBeInTheDocument();
  });
});

describe('ComplianceBadge', () => {
  it('shows COMPLIANT when compliant=true', () => {
    render(<ComplianceBadge compliant={true} />);
    expect(screen.getByText(/COMPLIANT/)).toBeInTheDocument();
  });

  it('shows DEFICIT when compliant=false', () => {
    render(<ComplianceBadge compliant={false} />);
    expect(screen.getByText(/DEFICIT/)).toBeInTheDocument();
  });
});

describe('ErrorBanner', () => {
  it('renders error message', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });
});
