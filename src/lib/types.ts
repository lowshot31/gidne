// src/lib/types.ts
// 공유 타입 정의

export interface TickerQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  avgVolume?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  exchange?: string;
  quoteType?: string;
}

export interface IndexQuote extends TickerQuote {
  region: 'americas' | 'europe' | 'asia' | 'emerging' | string;
  flag: string;
}

export interface SectorData {
  ticker: string;
  name: string;
  color: string;
  cycle: string;
  price: number;
  change: number;
  changePercent: number;
  rs: number;           // S&P 500 대비 상대강도 (% 차이)
  rsRank: number;       // 현재 RS 순위 (1 = 최강)
  rsRankChange: number; // 어제 대비 순위 변동 (양수 = 상승)
}

export interface MarketPulseData {
  score: number;         // 0-100
  label: string;         // EXTREME_FEAR ~ EXTREME_GREED
  emoji: string;         // 🔴🟠🟡🟢🔵
  bullishSectors: number;
  totalSectors: number;
  rsLeader: {
    name: string;
    ticker: string;
    changePercent: number;
  };
  summary: string;       // "8/11 섹터 상승 중, RS 리더: XLK +2.31%"
}

export interface MacroData {
  ticker: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketDataResponse {
  tickerStrip: TickerQuote[];
  sectors: SectorData[];
  marketPulse: MarketPulseData;
  macro: MacroData[];
  indices: IndexQuote[];
  meta: {
    isMarketOpen: boolean;
    lastUpdated: string;
    pollingInterval: number;
  };
  holdings?: Record<string, TickerQuote[]>;
}
