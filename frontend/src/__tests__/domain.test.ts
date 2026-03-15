import { describe, it, expect } from 'vitest';
import {
  getTargetIntensity,
  formatCB,
  TARGET_INTENSITY_2024,
  TARGET_INTENSITY_2025,
} from '../core/domain/types';

describe('getTargetIntensity', () => {
  it('returns 2024 target for year 2024', () => {
    expect(getTargetIntensity(2024)).toBe(TARGET_INTENSITY_2024);
  });

  it('returns 2025 target for year 2025', () => {
    expect(getTargetIntensity(2025)).toBe(TARGET_INTENSITY_2025);
  });

  it('returns 2025 target for years after 2025', () => {
    expect(getTargetIntensity(2030)).toBe(TARGET_INTENSITY_2025);
  });
});

describe('formatCB', () => {
  it('formats values in billions as GgCO₂e', () => {
    expect(formatCB(758400000)).toContain('MgCO₂e');
  });

  it('formats values in millions as MgCO₂e', () => {
    expect(formatCB(5000000)).toContain('MgCO₂e');
  });

  it('formats thousands as kgCO₂e', () => {
    expect(formatCB(5000)).toContain('kgCO₂e');
  });

  it('formats small values as gCO₂e', () => {
    expect(formatCB(42)).toContain('gCO₂e');
  });

  it('handles negative values', () => {
    const result = formatCB(-758400000);
    expect(result).toContain('-');
    expect(result).toContain('MgCO₂e');
  });
});
