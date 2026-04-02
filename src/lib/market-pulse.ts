// src/lib/market-pulse.ts
// Market Pulse 점수 계산 — DESIGN.md §4 기반
//
// Score (0-100) =
//   상승 섹터 비율 (40%)
//   RS 평균 강도 (30%)
//   VIX 안전 구간 (20%)
//   보합 보너스 (10%)

import type { SectorData, TickerQuote, MarketPulseData } from './types';

interface PulseInput {
  sectors: SectorData[];
  vixQuote: TickerQuote | undefined;
}

/**
 * Market Pulse 점수를 계산합니다.
 */
export function calculateMarketPulse({ sectors, vixQuote }: PulseInput): MarketPulseData {
  // 1. 상승 섹터 비율 (40점 배점)
  const bullishSectors = sectors.filter(s => s.changePercent > 0).length;
  const totalSectors = sectors.length || 1;
  const sectorScore = (bullishSectors / totalSectors) * 40;

  // 2. RS 평균 강도 (30점 배점)
  // RS 평균이 +2% 이상이면 만점, -2% 이하이면 0점
  const avgRS = sectors.reduce((sum, s) => sum + s.rs, 0) / totalSectors;
  const rsNormalized = Math.max(0, Math.min(1, (avgRS + 2) / 4)); // -2~+2 → 0~1
  const rsScore = rsNormalized * 30;

  // 3. VIX 안전 구간 (20점 배점)
  // VIX < 15 → 만점, VIX > 35 → 0점
  const vixValue = vixQuote?.price ?? 20;
  const vixNormalized = Math.max(0, Math.min(1, (35 - vixValue) / 20)); // 35~15 → 0~1
  const vixScore = vixNormalized * 20;

  // 4. 보합 보너스 (10점 배점)
  // 상승 섹터가 대부분이면 보너스
  const breadthRatio = bullishSectors / totalSectors;
  const breadthScore = breadthRatio * 10;

  // 총점
  const score = Math.round(sectorScore + rsScore + vixScore + breadthScore);
  const clampedScore = Math.max(0, Math.min(100, score));

  // 라벨 및 이모지
  const { label, emoji } = getPulseLabel(clampedScore);

  // RS 리더 (1등)
  const sortedBySectorRS = [...sectors].sort((a, b) => b.rs - a.rs);
  const leader = sortedBySectorRS[0];

  // 요약 문장
  const summary = `${bullishSectors}/${totalSectors} 섹터 상승 중, RS 리더: ${leader?.ticker ?? 'N/A'} ${leader?.changePercent >= 0 ? '+' : ''}${leader?.changePercent?.toFixed(2) ?? '0.00'}%`;

  return {
    score: clampedScore,
    label,
    emoji,
    bullishSectors,
    totalSectors,
    rsLeader: {
      name: leader?.name ?? 'N/A',
      ticker: leader?.ticker ?? 'N/A',
      changePercent: leader?.changePercent ?? 0,
    },
    summary,
  };
}

function getPulseLabel(score: number): { label: string; emoji: string } {
  if (score <= 25) return { label: 'EXTREME FEAR', emoji: '🔴' };
  if (score <= 45) return { label: 'BEARISH', emoji: '🟠' };
  if (score <= 55) return { label: 'NEUTRAL', emoji: '🟡' };
  if (score <= 75) return { label: 'BULLISH', emoji: '🟢' };
  return { label: 'EXTREME GREED', emoji: '🔵' };
}
