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
    { key: 'volatility', label: 'VOL', icon: '⚡', desc: '시장 변동성 (VIX 등)' },
    { key: 'rates', label: 'RATES', icon: '📊', desc: '국채 금리 (10년, 30년 등)' },
    { key: 'currency', label: 'FX', icon: '💱', desc: '환율 (달러인덱스 등)' },
    { key: 'commodity', label: 'CMDTY', icon: '🛢️', desc: '원자재 (원유, 금 등)' },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>MARKET BREADTH</h3>
        <div className="tooltip-wrapper" style={{ cursor: 'help' }}>
          <span className="info-icon">?</span>
          <div className="tooltip" style={{ left: 0, transform: 'translateX(-20%)', width: '220px', whiteSpace: 'normal', lineHeight: '1.4' }}>
            <strong>시장 폭 (Market Breadth)</strong><br/>시장의 전반적인 상승/하락 에너지를 측정하는 지표입니다. 상승 종목 수와 하락 종목 수의 비율을 나타냅니다.
          </div>
        </div>
      </div>
      
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
              <div className="heat-label tooltip-wrapper">
                {cat.icon} {cat.label}
                <span className="info-icon">?</span>
                <div className="tooltip">{cat.desc}</div>
              </div>
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
          display: flex;
          align-items: center;
          gap: 4px;
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
          padding-top: 0.3rem;
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

        /* Tooltip System */
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          color: var(--text-muted);
          font-size: 0.6rem;
          font-weight: bold;
          cursor: help;
          transition: background 0.2s, color 0.2s;
        }
        .tooltip-wrapper:hover .info-icon {
          background: rgba(255,255,255,0.25);
          color: var(--text-primary);
        }
        .tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          background: rgba(15, 15, 20, 0.98);
          color: #f5f5f7;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 50;
          transition: all 0.2s ease-out;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }
        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: rgba(255,255,255,0.15) transparent transparent transparent;
        }
        .tooltip-wrapper:hover .tooltip {
          visibility: visible;
          opacity: 1;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
