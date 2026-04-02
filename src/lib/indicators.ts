// src/lib/indicators.ts
// RS(상대강도) 계산 및 섹터 분석 — DESIGN.md §4 기반

import { SECTOR_ETFS } from './tickers';
import { cache, TTL } from './cache';
import type { TickerQuote, SectorData } from './types';

/**
 * RS(Relative Strength) 계산
 * RS Spread = Ticker 등락률(%) - S&P500 등락률(%)
 * 
 * 양수 = 시장 대비 강함 (Outperform)
 * 음수 = 시장 대비 약함 (Underperform)
 */
export function calculateRS(tickerChangePercent: number, spyChangePercent: number): number {
  return Number((tickerChangePercent - spyChangePercent).toFixed(4));
}

/**
 * RS 기반으로 섹터 데이터를 생성합니다.
 * - RS 계산, 순위 매기기, 어제 대비 순위 변동 계산
 */
export function buildSectorData(
  quotes: Map<string, TickerQuote>,
): SectorData[] {
  const spyQuote = quotes.get('SPY');
  const spyChangePercent = spyQuote?.changePercent ?? 0;

  // 섹터별 RS 계산
  const sectors: SectorData[] = SECTOR_ETFS.map(etf => {
    const quote = quotes.get(etf.ticker);

    return {
      ticker: etf.ticker,
      name: etf.name,
      color: etf.color,
      cycle: etf.cycle,
      price: quote?.price ?? 0,
      change: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
      rs: calculateRS(quote?.changePercent ?? 0, spyChangePercent),
      rsRank: 0,       // 아래에서 계산
      rsRankChange: 0,  // 아래에서 계산
    };
  });

  // RS 내림차순 정렬 + 순위 부여
  sectors.sort((a, b) => b.rs - a.rs);
  sectors.forEach((s, i) => {
    s.rsRank = i + 1;
  });

  // 어제 순위와 비교 (캐시에서 가져오기)
  const YESTERDAY_KEY = 'rs_ranks_yesterday';
  const yesterdayRanks = cache.get<Record<string, number>>(YESTERDAY_KEY);

  if (yesterdayRanks) {
    sectors.forEach(s => {
      const prevRank = yesterdayRanks[s.ticker];
      if (prevRank !== undefined) {
        // 양수 = 순위 상승 (예: 4위→2위 = +2)
        s.rsRankChange = prevRank - s.rsRank;
      }
    });
  }

  // 현재 순위를 "어제 순위"로 저장 (24시간 TTL)
  // 실제로는 첫 호출 시에만 저장되고, 이후 24시간 동안 유지됨
  if (!yesterdayRanks) {
    const currentRanks: Record<string, number> = {};
    sectors.forEach(s => {
      currentRanks[s.ticker] = s.rsRank;
    });
    cache.set(YESTERDAY_KEY, currentRanks, TTL.RS_RANK);
  }

  return sectors;
}

/**
 * RS 강도 라벨 반환
 */
export function getRSLabel(rs: number): 'STRONG' | 'NEUTRAL' | 'WEAK' {
  if (rs > 1.0) return 'STRONG';
  if (rs < -1.0) return 'WEAK';
  return 'NEUTRAL';
}
