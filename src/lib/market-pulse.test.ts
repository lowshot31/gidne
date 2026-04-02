import { describe, it, expect } from 'vitest';
import { calculateMarketPulse } from './market-pulse';
import type { SectorData, TickerQuote } from './types';

describe('Market Pulse', () => {
  const dummySectors: SectorData[] = [
    { ticker: 'XLK', name: 'Tech', color: 'blue', cycle: 'growth', price: 100, change: 1, changePercent: 1.5, rs: 2.0, rsRank: 1, rsRankChange: 0 },
    { ticker: 'XLF', name: 'Finance', color: 'green', cycle: 'value', price: 50, change: 0.5, changePercent: 1.0, rs: 1.0, rsRank: 2, rsRankChange: 0 },
    { ticker: 'XLU', name: 'Utilities', color: 'orange', cycle: 'defensive', price: 30, change: -0.3, changePercent: -1.0, rs: -1.5, rsRank: 3, rsRankChange: 0 },
  ];

  it('calculates EXTREME GREED correctly when sectors are bullish and VIX is low', () => {
    const vix: TickerQuote = { symbol: '^VIX', name: 'VIX', price: 13, change: -1, changePercent: -5, previousClose: 14 };
    
    // bullish sectors = 2 out of 3 = 66% => 26.6 points
    // avg RS = (2.0 + 1.0 - 1.5) / 3 = 0.5 => Normalized: (0.5+2)/4 = 0.625 => 18.75 points
    // VIX = 13 (max points) => 20 points
    // Breadth = 0.66 * 10 => +6.6 points
    // Total approx: 26.6 + 18.75 + 20 + 6.6 = 72 => BULLISH
    
    const result = calculateMarketPulse({ sectors: dummySectors, vixQuote: vix });
    expect(result.score).toBeGreaterThan(60); 
    expect(result.rsLeader.ticker).toBe('XLK');
  });

  it('calculates EXTREME FEAR correctly when sectors are bearish and VIX is high', () => {
    const bearishSectors = dummySectors.map(s => ({ ...s, changePercent: -2, rs: -2.5 }));
    const vix: TickerQuote = { symbol: '^VIX', name: 'VIX', price: 40, change: 5, changePercent: 10, previousClose: 35 };

    const result = calculateMarketPulse({ sectors: bearishSectors, vixQuote: vix });
    
    // bullish sectors: 0
    // avg RS: -2.5 => Normalized: 0 => 0 points
    // VIX: 40 => Normalized: 0 => 0 points
    expect(result.score).toBe(0);
    expect(result.label).toBe('EXTREME FEAR');
  });
});
