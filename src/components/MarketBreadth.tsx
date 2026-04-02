import React from 'react';
import type { SectorData, MacroData } from '../lib/types';

interface Props {
  sectors: SectorData[];
  macro: MacroData[];
}

/**
 * Market Breadth 위젯 — 시장 참여 폭과 주요 지표 간 관계를 시각화
 * - 상승/하락 섹터 비율 (Advance/Decline)
 * - VIX vs SPY 상관관계 표시
 * - 매크로 지표 요약 히트맵
 */
export default function MarketBreadth({ sectors, macro }: Props) {
  const bullish = sectors.filter(s => s.changePercent > 0);
  const bearish = sectors.filter(s => s.changePercent <= 0);
  const total = sectors.length || 1;
  const bullPct = Math.round((bullish.length / total) * 100);
  const bearPct = 100 - bullPct;

  // 매크로 카테고리별 히트맵 데이터
  const categories = [
    { key: 'volatility', label: 'VOL', icon: '⚡' },
    { key: 'rates', label: 'RATES', icon: '📊' },
    { key: 'currency', label: 'FX', icon: '💱' },
    { key: 'commodity', label: 'CMDTY', icon: '🛢️' },
  ];

  const getCategoryAvg = (cat: string) => {
    const items = macro.filter(m => m.category === cat);
    if (items.length === 0) return 0;
    return items.reduce((sum, m) => sum + m.changePercent, 0) / items.length;
  };

  const getHeatColor = (pct: number) => {
    if (pct > 1) return 'var(--bull)';
    if (pct > 0.2) return 'rgba(38, 166, 154, 0.5)';
    if (pct > -0.2) return 'var(--text-muted)';
    if (pct > -1) return 'rgba(239, 83, 80, 0.5)';
    return 'var(--bear)';
  };

  return (
    <div className="bento-item breadth-container">
      <h3 className="text-secondary mb-md">MARKET BREADTH</h3>
      
      {/* A/D 바 */}
      <div className="ad-bar-wrapper">
        <div className="ad-labels">
          <span className="text-bull">{bullish.length} ▲</span>
          <span className="text-bear">{bearish.length} ▼</span>
        </div>
        <div className="ad-bar">
          <div 
            className="ad-fill-bull" 
            style={{ width: `${bullPct}%` }}
          />
          <div 
            className="ad-fill-bear" 
            style={{ width: `${bearPct}%` }}
          />
        </div>
        <div className="ad-pct">
          <span className="text-bull">{bullPct}%</span>
          <span className="text-bear">{bearPct}%</span>
        </div>
      </div>

      {/* 매크로 히트맵 */}
      <div className="heatmap-grid">
        {categories.map(cat => {
          const avg = getCategoryAvg(cat.key);
          const color = getHeatColor(avg);
          return (
            <div key={cat.key} className="heat-cell" style={{ borderColor: color }}>
              <div className="heat-label">{cat.icon} {cat.label}</div>
              <div className="heat-value" style={{ color }}>
                {avg >= 0 ? '+' : ''}{avg.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* 상위/하위 섹터 */}
      <div className="top-bottom">
        <div className="tb-item">
          <span className="tb-label text-muted">Strongest</span>
          <span className="text-bull">{bullish[0]?.ticker ?? '—'} {bullish[0] ? `+${bullish[0].changePercent.toFixed(2)}%` : ''}</span>
        </div>
        <div className="tb-item">
          <span className="tb-label text-muted">Weakest</span>
          <span className="text-bear">{bearish[bearish.length - 1]?.ticker ?? '—'} {bearish[bearish.length - 1] ? `${bearish[bearish.length - 1].changePercent.toFixed(2)}%` : ''}</span>
        </div>
      </div>

      <style>{`
        .breadth-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .ad-bar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .ad-labels, .ad-pct {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 500;
        }
        .ad-bar {
          display: flex;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--glass-border);
        }
        .ad-fill-bull {
          background: var(--bull);
          transition: width 0.5s ease;
        }
        .ad-fill-bear {
          background: var(--bear);
          transition: width 0.5s ease;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem;
        }
        .heat-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.4rem;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          transition: border-color 0.3s ease;
        }
        .heat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .heat-value {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .top-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding-top: 0.25rem;
          border-top: 1px solid var(--glass-border);
        }
        .tb-item {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }
        .tb-label {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
