// src/lib/tickers.ts
// 고정 티커 목록 — DESIGN.md §6 기반

export const INDICES = [
  { ticker: '^GSPC', name: 'S&P 500', symbol: 'SPY', flag: '🇺🇸' },
  { ticker: '^IXIC', name: 'Nasdaq 100', symbol: 'QQQ', flag: '🇺🇸' },
  { ticker: '^DJI', name: 'Dow Jones', symbol: 'DIA', flag: '🇺🇸' },
  { ticker: '^RUT', name: 'Russell 2000', symbol: 'IWM', flag: '🇺🇸' },
  { ticker: '^KS11', name: 'KOSPI', symbol: 'KOSPI', flag: '🇰🇷' },
  { ticker: '^KQ11', name: 'KOSDAQ', symbol: 'KOSDAQ', flag: '🇰🇷' },
  { ticker: '^N225', name: 'Nikkei 225', symbol: 'N225', flag: '🇯🇵' },
  { ticker: '000300.SS', name: 'CSI 300', symbol: 'CSI300', flag: '🇨🇳' },
  { ticker: '^STOXX50E', name: 'Euro Stoxx 50', symbol: 'SX5E', flag: '🇪🇺' },
  { ticker: '^FTSE', name: 'FTSE 100', symbol: 'FTSE', flag: '🇬🇧' },
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
  // 변동성
  { ticker: '^VIX', name: 'VIX', category: 'volatility' as const },
  { ticker: '^VVIX', name: 'VVIX', category: 'volatility' as const },
  // 금리
  { ticker: '^TNX', name: '10Y Yield', category: 'rates' as const },
  { ticker: '^FVX', name: '5Y Yield', category: 'rates' as const },
  { ticker: '^IRX', name: '13W T-Bill', category: 'rates' as const },
  // 통화
  { ticker: 'DX-Y.NYB', name: 'DXY', category: 'currency' as const },
  { ticker: 'KRW=X', name: 'USD/KRW', category: 'currency' as const },
  // 원자재
  { ticker: 'GC=F', name: 'Gold', category: 'commodity' as const },
  { ticker: 'CL=F', name: 'WTI Crude', category: 'commodity' as const },
] as const;

export const TICKER_STRIP = [
  { ticker: '^GSPC', name: 'S&P 500' },
  { ticker: '^IXIC', name: 'NASDAQ' },
  { ticker: '^KS11', name: 'KOSPI' },
  { ticker: '^N225', name: 'NIKKEI' },
  { ticker: 'BTC-USD', name: 'BTC' },
  { ticker: 'GC=F', name: 'GOLD' },
  { ticker: 'CL=F', name: 'WTI' },
  { ticker: 'DX-Y.NYB', name: 'DXY' },
  { ticker: 'KRW=X', name: 'KRW' },
  { ticker: '^TNX', name: 'US10Y' },
  { ticker: '^VIX', name: 'VIX' },
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
  
  // 뉴욕 시간대로 변환하여 요일과 시간을 추출
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric'
  });
  
  // 운영체제/Node 버전에 따른 문자열 차이를 무시하기 위해 formatToParts 사용
  const parts = formatter.formatToParts(now);
  let weekday = '';
  let hourStr = '0';
  let minuteStr = '0';

  for (const part of parts) {
    if (part.type === 'weekday') weekday = part.value;
    if (part.type === 'hour') hourStr = part.value;
    if (part.type === 'minute') minuteStr = part.value;
  }
  
  // 주말 제외
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const etMinutes = hour * 60 + minute;
  
  const marketOpen = 9 * 60 + 30;  // 9:30 ET
  const marketClose = 16 * 60;     // 16:00 ET
  
  return etMinutes >= marketOpen && etMinutes < marketClose;
}

// 폴링 간격 반환 (ms)
export function getPollingInterval(): number {
  return isUSMarketOpen() ? 5_000 : 60_000; // 야후파이낸스 차단 안 당하는 최소 한계치: 5초
}
