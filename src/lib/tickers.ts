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
  // 1. Early Cycle (Recovery - 회복기) : 금리 인하 수혜, 소비 꿈틀
  { ticker: 'XLY', name: 'Discretionary', cycle: 'Early (Recovery)', color: '#22c55e' }, // Green
  { ticker: 'XLF', name: 'Financials', cycle: 'Early (Recovery)', color: '#22c55e' },
  { ticker: 'XLRE', name: 'Real Estate', cycle: 'Early (Recovery)', color: '#22c55e' },
  
  // 2. Mid Cycle (Expansion - 호황기) : 실적 장세, 기업 투자 증가
  { ticker: 'XLK', name: 'Technology', cycle: 'Mid (Expansion)', color: '#eab308' }, // Yellow/Gold
  { ticker: 'XLC', name: 'Communication', cycle: 'Mid (Expansion)', color: '#eab308' },
  { ticker: 'XLI', name: 'Industrials', cycle: 'Mid (Expansion)', color: '#eab308' },
  
  // 3. Late Cycle (Slowdown - 후퇴기) : 인플레이션 헤지, 원자재 강세
  { ticker: 'XLE', name: 'Energy', cycle: 'Late (Slowdown)', color: '#f97316' }, // Orange
  { ticker: 'XLB', name: 'Materials', cycle: 'Late (Slowdown)', color: '#f97316' },
  
  // 4. Defensive (Recession - 침체기) : 경기 방어, 배당/필수소비재
  { ticker: 'XLV', name: 'Healthcare', cycle: 'Defensive (Recession)', color: '#0ea5e9' }, // Blue
  { ticker: 'XLP', name: 'Staples', cycle: 'Defensive (Recession)', color: '#0ea5e9' },
  { ticker: 'XLU', name: 'Utilities', cycle: 'Defensive (Recession)', color: '#0ea5e9' },
] as const;

// 섹터 ETF → Top 5 구성종목 매핑 (EOD 리포트 드릴다운용)
export const SECTOR_HOLDINGS: Record<string, { ticker: string; name: string }[]> = {
  XLK: [
    { ticker: 'AAPL', name: 'Apple' },
    { ticker: 'MSFT', name: 'Microsoft' },
    { ticker: 'NVDA', name: 'NVIDIA' },
    { ticker: 'AVGO', name: 'Broadcom' },
    { ticker: 'CRM', name: 'Salesforce' },
  ],
  XLF: [
    { ticker: 'BRK-B', name: 'Berkshire' },
    { ticker: 'JPM', name: 'JPMorgan' },
    { ticker: 'V', name: 'Visa' },
    { ticker: 'MA', name: 'Mastercard' },
    { ticker: 'BAC', name: 'BofA' },
  ],
  XLY: [
    { ticker: 'AMZN', name: 'Amazon' },
    { ticker: 'TSLA', name: 'Tesla' },
    { ticker: 'HD', name: 'Home Depot' },
    { ticker: 'MCD', name: "McDonald's" },
    { ticker: 'NKE', name: 'Nike' },
  ],
  XLE: [
    { ticker: 'XOM', name: 'ExxonMobil' },
    { ticker: 'CVX', name: 'Chevron' },
    { ticker: 'COP', name: 'ConocoPhillips' },
    { ticker: 'EOG', name: 'EOG Resources' },
    { ticker: 'SLB', name: 'Schlumberger' },
  ],
  XLV: [
    { ticker: 'UNH', name: 'UnitedHealth' },
    { ticker: 'JNJ', name: 'J&J' },
    { ticker: 'LLY', name: 'Eli Lilly' },
    { ticker: 'ABT', name: 'Abbott' },
    { ticker: 'PFE', name: 'Pfizer' },
  ],
  XLI: [
    { ticker: 'GE', name: 'GE Aerospace' },
    { ticker: 'CAT', name: 'Caterpillar' },
    { ticker: 'UNP', name: 'Union Pacific' },
    { ticker: 'HON', name: 'Honeywell' },
    { ticker: 'BA', name: 'Boeing' },
  ],
  XLC: [
    { ticker: 'META', name: 'Meta' },
    { ticker: 'GOOGL', name: 'Alphabet' },
    { ticker: 'NFLX', name: 'Netflix' },
    { ticker: 'DIS', name: 'Disney' },
    { ticker: 'TMUS', name: 'T-Mobile' },
  ],
  XLP: [
    { ticker: 'PG', name: 'P&G' },
    { ticker: 'KO', name: 'Coca-Cola' },
    { ticker: 'PEP', name: 'PepsiCo' },
    { ticker: 'COST', name: 'Costco' },
    { ticker: 'WMT', name: 'Walmart' },
  ],
  XLU: [
    { ticker: 'NEE', name: 'NextEra' },
    { ticker: 'SO', name: 'Southern Co' },
    { ticker: 'DUK', name: 'Duke Energy' },
    { ticker: 'D', name: 'Dominion' },
    { ticker: 'AEP', name: 'AEP' },
  ],
  XLB: [
    { ticker: 'LIN', name: 'Linde' },
    { ticker: 'SHW', name: 'Sherwin-Williams' },
    { ticker: 'FCX', name: 'Freeport' },
    { ticker: 'APD', name: 'Air Products' },
    { ticker: 'NEM', name: 'Newmont' },
  ],
  XLRE: [
    { ticker: 'PLD', name: 'Prologis' },
    { ticker: 'AMT', name: 'American Tower' },
    { ticker: 'EQIX', name: 'Equinix' },
    { ticker: 'SPG', name: 'Simon Property' },
    { ticker: 'O', name: 'Realty Income' },
  ],
};

// 매크로 지표 → 섹터 원인 연결 맵 (EOD "왜(Why)" 분석용)
export const MACRO_SECTOR_DRIVERS: Record<string, { macro: string; direction: 'same' | 'inverse'; label: string }[]> = {
  XLE: [{ macro: 'CL=F', direction: 'same', label: 'WTI 원유' }, { macro: 'BZ=F', direction: 'same', label: '브렌트유' }],
  XLB: [{ macro: 'HG=F', direction: 'same', label: '구리' }, { macro: 'GC=F', direction: 'same', label: '금' }],
  XLK: [{ macro: '^TNX', direction: 'inverse', label: '10Y 금리' }],
  XLY: [{ macro: '^TNX', direction: 'inverse', label: '10Y 금리' }],
  XLF: [{ macro: '^TNX', direction: 'same', label: '10Y 금리' }],
  XLU: [{ macro: '^TNX', direction: 'inverse', label: '10Y 금리' }],
  XLRE: [{ macro: '^TNX', direction: 'inverse', label: '10Y 금리' }],
  XLP: [],
  XLV: [],
  XLI: [{ macro: 'HG=F', direction: 'same', label: '구리(경기)' }],
  XLC: [{ macro: '^TNX', direction: 'inverse', label: '10Y 금리' }],
};

export const MACRO_TICKERS = [
  // 1. 변동성 & 리스크 척도 (HOT)
  { ticker: '^VIX', name: 'S&P 500 공포 지수 (VIX)', category: 'volatility' as const },
  { ticker: '^VVIX', name: '공포의 공포 지수 (VVIX)', category: 'volatility' as const },
  { ticker: '^SKEW', name: '꼬리위험 지수 (SKEW)', category: 'volatility' as const }, // 블랙스완 위험 리스크를 나타냄

  // 2. 금리 & 신용 채권 (RATES)
  { ticker: '^IRX', name: '미 3개월물 국채 (단기)', category: 'rates' as const },
  { ticker: '^FVX', name: '미 5년물 국채 (중기)', category: 'rates' as const },
  { ticker: '^TNX', name: '미 10년물 국채 (장기/기준표)', category: 'rates' as const },
  { ticker: '^TYX', name: '미 30년물 국채 (초장기)', category: 'rates' as const },
  { ticker: 'HYG', name: '미 정크본드 채권 ETF (신용위험)', category: 'rates' as const },
  { ticker: 'LQD', name: '미 투자등급 회사채 ETF', category: 'rates' as const },
  { ticker: 'TLT', name: '미 20년+ 장기 국채 ETF 가격', category: 'rates' as const },

  // 3. 글로벌 외환 & 유동성 (CURRENCY)
  { ticker: 'DX-Y.NYB', name: '글로벌 달러 인덱스 (DXY)', category: 'currency' as const },
  { ticker: 'KRW=X', name: '원/달러 환율', category: 'currency' as const },
  { ticker: 'JPY=X', name: '엔/달러 환율', category: 'currency' as const },
  { ticker: 'CNY=X', name: '위안/달러 환율 (중국 리스크)', category: 'currency' as const },
  { ticker: 'EURUSD=X', name: '유로/달러 환율', category: 'currency' as const },

  // 4. 원자재 & 실물 경기 (COMMODITY)
  { ticker: 'CL=F', name: 'WTI 국제 원유', category: 'commodity' as const },
  { ticker: 'BZ=F', name: '브렌트유 (유럽 기준 유가)', category: 'commodity' as const },
  { ticker: 'NG=F', name: '천연가스 (에너지/난방)', category: 'commodity' as const },
  { ticker: 'HG=F', name: '닥터 코퍼 (구리 - 실물경기)', category: 'commodity' as const },
  { ticker: 'GC=F', name: '금 (대표 안전자산)', category: 'commodity' as const },
  { ticker: 'SI=F', name: '은 (산업/귀금속 혼합)', category: 'commodity' as const },
  { ticker: 'ZC=F', name: '옥수수 (곡물 인플레이션/애그플레이션)', category: 'commodity' as const },
] as const;

export const TICKER_STRIP = [
  { ticker: '^GSPC', name: 'S&P 500' },
  { ticker: '^IXIC', name: 'NASDAQ' },
  { ticker: '^KS11', name: 'KOSPI' },
  { ticker: '^N225', name: 'NIKKEI' },
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
  return isUSMarketOpen() ? 5_000 : 60_000; // 
}
