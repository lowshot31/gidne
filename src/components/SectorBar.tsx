import React from 'react';
import type { SectorData } from '../lib/types';

interface Props {
  sectors: SectorData[];
}

const SECTOR_META: Record<string, {name: string, icon: string}> = {
  XLE: { name: 'Energy', icon: '⚡' },
  XLU: { name: 'Util', icon: '💡' },
  XLB: { name: 'Matrl', icon: '🧱' },
  XLF: { name: 'Fin', icon: '🏦' },
  XLRE: { name: 'RE', icon: '🏢' },
  XLC: { name: 'Comm', icon: '📱' },
  XLV: { name: 'Health', icon: '🏥' },
  XLI: { name: 'Indust', icon: '🏭' },
  XLP: { name: 'Staples', icon: '🛒' },
  XLY: { name: 'Discret', icon: '🛍️' },
  XLK: { name: 'Tech', icon: '💻' }
};

export default function SectorBar({ sectors }: Props) {
  // 최대 퍼센트를 기준으로 막대 길이를 상대적으로 그림
  const maxAbsChange = Math.max(...sectors.map(s => Math.abs(s.changePercent)), 1);

  return (
    <div className="bento-item h-full sector-container" style={{ padding: '1.25rem' }}>
      <h3 className="text-secondary" style={{ margin: 0, marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>📊</span> SECTOR STRENGTH
      </h3>
      <div className="bars-wrapper">
        {sectors.map((s) => {
          const isUp = s.changePercent >= 0;
          const barWidth = `${(Math.abs(s.changePercent) / maxAbsChange) * 100}%`;
          const sign = isUp ? '+' : '';
          const valColor = isUp ? 'var(--bull)' : 'var(--bear)';
          const meta = SECTOR_META[s.ticker] || { name: '', icon: '' };
          
          return (
            <div key={s.ticker} className="bar-row">
              <div className="ticker-col" style={{ width: '68px' }}>
                <span className="ticker-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{meta.icon}</span>
                  {s.ticker}
                </span>
                <span className="ticker-sub">{meta.name}</span>
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill"
                  style={{
                    width: barWidth,
                    background: `linear-gradient(90deg, ${s.color}15 0%, ${s.color} 100%)`,
                    boxShadow: `0 0 12px ${s.color}30`,
                    borderRight: `2px solid ${s.color}`,
                    opacity: isUp ? 1 : 0.8
                  }}
                />
              </div>
              <span className="ticker-val" style={{ color: valColor }}>
                {sign}{s.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="cycle-legend" style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', justifyContent: 'center', alignItems: 'center' }}>
        <span><span style={{ color: '#22c55e' }}>●</span> Early (회복)</span>
        <span><span style={{ color: '#eab308' }}>●</span> Mid (호황)</span>
        <span><span style={{ color: '#f97316' }}>●</span> Late (후퇴)</span>
        <span><span style={{ color: '#0ea5e9' }}>●</span> Defensive (침체)</span>
        
        <div className="sector-info-wrapper" style={{ marginLeft: '4px' }}>
          <span className="info-icon" style={{ cursor: 'help' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          <div className="sector-tooltip-card">
            <h4 style={{ margin: '0 0 0.5rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>경기 사이클 가이드</h4>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              현재 <strong>가장 높이 올라온 섹터들의 색깔</strong>을 보면, 지금 경제가 4가지 계절 중 어디쯤 와있는지 눈치챌 수 있어요!
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
              <li><strong style={{ color: '#22c55e' }}>● Early (회복기)</strong>: 금융(XLF), 부동산(XLRE), 소비재(XLY)가 앞장섭니다. 돈이 풀리며 경기가 살아나기 시작해요.</li>
              <li><strong style={{ color: '#eab308' }}>● Mid (호황기)</strong>: 테크(XLK), 통신(XLC), 산업(XLI)이 질주합니다. 공장이 팡팡 돌아가고 기술 혁신이 주도해요.</li>
              <li><strong style={{ color: '#f97316' }}>● Late (후퇴기)</strong>: 에너지(XLE), 소재(XLB)가 끝물에 불을 뿜습니다. 물가가 오르고 금리가 높아져 경기가 꺾이기 직전이에요.</li>
              <li><strong style={{ color: '#0ea5e9' }}>● Defensive (침체기)</strong>: 헬스케어(XLV), 필수소비재(XLP), 유틸리티(XLU)만 버팁니다. 다들 아플 때 약 찾듯, 경기와 무관한 안전빵만 찾아요.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .sector-container { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        .bars-wrapper { display: flex; flex-direction: column; gap: 0.9rem; flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px; }
        .bars-wrapper::-webkit-scrollbar { width: 4px; }
        .bars-wrapper::-webkit-scrollbar-track { background: transparent; }
        .bars-wrapper::-webkit-scrollbar-thumb { background: var(--overlay); border-radius: 4px; }
        .bars-wrapper:hover::-webkit-scrollbar-thumb { background: var(--overlay-hover); }
        .bar-row { display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-mono); }
        .ticker-col { display: flex; flex-direction: column; flex-shrink: 0; line-height: 1.2; }
        .ticker-label { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); letter-spacing: 0.5px; }
        .ticker-sub { font-size: 0.65rem; color: var(--text-muted); font-weight: 500; font-family: var(--font-body); }
        .bar-track { flex: 1; height: 10px; background: var(--overlay); border: 1px solid var(--overlay-hover); border-radius: 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); min-width: 2px; }
        .ticker-val { width: 65px; text-align: right; font-weight: 600; font-size: 0.85rem; flex-shrink: 0; }
        .cycle-legend span { display: flex; align-items: center; gap: 4px; }
        
        .sector-info-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .info-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
          display: flex;
          opacity: 0.6;
        }
        .sector-info-wrapper:hover .info-icon {
          color: var(--accent-primary);
          opacity: 1;
        }
        .sector-tooltip-card {
          position: absolute;
          bottom: calc(100% + 12px);
          right: -10px;
          width: 340px;
          background: var(--tooltip-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          color: var(--text-primary);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transform: translateY(5px);
          transition: all 0.2s ease;
          pointer-events: none;
          text-align: left;
          font-family: var(--font-sans);
        }
        .sector-info-wrapper:hover .sector-tooltip-card {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }
        @media (max-width: 480px) {
          .sector-tooltip-card { width: 300px; right: -50px; }
        }
      `}</style>
    </div>
  );
}
