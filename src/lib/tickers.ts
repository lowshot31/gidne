// src/lib/tickers.ts
// 고정 티커 목록 — DESIGN.md §6 기반

export const INDICES = [
  { ticker: '^GSPC', name: 'S&P 500', symbol: 'SPY', flag: '🇺🇸' },
  { ticker: '^IXIC', name: 'Nasdaq 100', symbol: 'QQQ', flag: '🇺🇸' },
  { ticker: '^DJI', name: 'Dow Jones', symbol: 'DIA', flag: '🇺🇸' },
  { ticker: '^RUT', name: 'Russell 2000', symbol: 'IWM', flag: '🇺🇸' },
  { ticker: '^KS11', name: 'KOSPI', symbol: 'KOSPI', flag: '🇰🇷' },
  { ticker: '^KQ11', name: 'KOSDAQ', symbol: 'KOSDAQ', flag: '🇰🇷' },
] as const;

export const SECTOR_ETFS = [
  { ticker: 'XLK', name: 'Technology', cycle: 'Late', color: '#6366f1' },
  { ticker: 'XLF', name: 'Financials', cycle: 'Early', color: '#22c55e' },
  { ticker: 'XLV', name: 'Healthcare', cycle: 'Defensive', color: '#06b6d4' },
  { ticker: 'XLE', name: 'Energy', cycle: 'Mid', color: '#f97316' },
  { ticker: 'XLI', name: 'Industrials', cycle: 'Early', color: '#eab308' },
  { ticker: 'XLP', name: 'Staples', cycle: 'Defensive', color: '#84cc16' },
  { ticker: 'XLY', name: 'Discretionary', cycle: 'Early', color: '#ec4899' },
  { ticker: 'XLU', name: 'Utilities', cycle: 'Defensive', color: '#a855f7' },
  { ticker: 'XLB', name: 'Materials', cycle: 'Mid', color: '#14b8a6' },
  { ticker: 'XLRE', name: 'Real Estate', cycle: 'Rate-Sensitive', color: '#f43f5e' },
  { ticker: 'XLC', name: 'Communication', cycle: 'Growth', color: '#3b82f6' },
] as const;

export const MACRO_TICKERS = [
  { ticker: '^VIX', name: 'VIX', category: 'volatility' as const },
  { ticker: 'DX-Y.NYB', name: 'Dollar Index', category: 'currency' as const },
  { ticker: '^TNX', name: '10Y Yield', category: 'rates' as const },
  { ticker: 'GC=F', name: 'Gold', category: 'commodity' as const },
  { ticker: 'TLT', name: '20Y Bond ETF', category: 'rates' as const },
] as const;

export const TICKER_STRIP = [
  { ticker: 'GC=F', name: 'GOLD' },
  { ticker: '^IXIC', name: 'NASDAQ' },
  { ticker: '^GSPC', name: 'S&P 500' },
  { ticker: '^KS11', name: 'KOSPI' },
  { ticker: '^N225', name: 'NIKKEI' },
  { ticker: 'BTC-USD', name: 'BTC' },
  { ticker: 'DX-Y.NYB', name: 'DXY' },
  { ticker: '^TNX', name: 'US10Y' },
] as const;

// 전체 유니크 티커 목록 — 배치 요청용
export function getAllTickers(): string[] {
  const set = new Set<string>();
  INDICES.forEach(t => set.add(t.ticker));
  SECTOR_ETFS.forEach(t => set.add(t.ticker));
  MACRO_TICKERS.forEach(t => set.add(t.ticker));
  TICKER_STRIP.forEach(t => set.add(t.ticker));
  // SPY는 S&P 500 RS 계산의 벤치마크
  set.add('SPY');
  return Array.from(set);
}

// 미국 장중 여부 판단 (ET 기준 9:30~16:00)
export function isUSMarketOpen(): boolean {
  const now = new Date();
  const etOffset = -5; // EST (DST 미적용 시 -5, 적용 시 -4)
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const etHour = (utcHour + etOffset + 24) % 24;
  const etMinutes = etHour * 60 + utcMinute;
  
  const marketOpen = 9 * 60 + 30;  // 9:30 ET
  const marketClose = 16 * 60;     // 16:00 ET
  const day = now.getUTCDay();
  
  // 주말 제외
  if (day === 0 || day === 6) return false;
  
  return etMinutes >= marketOpen && etMinutes < marketClose;
}

// 폴링 간격 반환 (ms)
export function getPollingInterval(): number {
  return isUSMarketOpen() ? 30_000 : 300_000; // 장중 30초, 장외 5분
}
