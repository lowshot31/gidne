import { describe, it, expect } from 'vitest';
import { calculateRS, getRSLabel } from './indicators';

describe('indicators', () => {
  describe('calculateRS', () => {
    it('should correctly calculate the relative strength', () => {
      // Ticker +5%, SPY +2% => RS +3.0
      expect(calculateRS(5, 2)).toBe(3.0);
      
      // Ticker -1%, SPY +2% => RS -3.0
      expect(calculateRS(-1, 2)).toBe(-3.0);
      
      // Ticker +1.52345, SPY +0.51234 => RS +1.0111
      expect(calculateRS(1.52345, 0.51234)).toBe(1.0111);
    });
  });

  describe('getRSLabel', () => {
    it('returns STRONG for RS > 1.0', () => {
      expect(getRSLabel(1.1)).toBe('STRONG');
      expect(getRSLabel(5.0)).toBe('STRONG');
    });

    it('returns WEAK for RS < -1.0', () => {
      expect(getRSLabel(-1.1)).toBe('WEAK');
      expect(getRSLabel(-5.0)).toBe('WEAK');
    });

    it('returns NEUTRAL for RS between -1.0 and 1.0', () => {
      expect(getRSLabel(1.0)).toBe('NEUTRAL');
      expect(getRSLabel(-1.0)).toBe('NEUTRAL');
      expect(getRSLabel(0.5)).toBe('NEUTRAL');
    });
  });
});
