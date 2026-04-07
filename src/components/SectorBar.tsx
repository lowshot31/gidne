import React from 'react';
import type { SectorData } from '../lib/types';

interface Props {
  sectors: SectorData[];
}

const SECTOR_NAMES: Record<string, string> = {
  XLE: 'Energy', XLU: 'Util', XLB: 'Matrl', XLF: 'Fin', XLRE: 'RE',
  XLC: 'Comm', XLV: 'Health', XLI: 'Indust', XLP: 'Staples', XLY: 'Discret', XLK: 'Tech'
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
          
          return (
            <div key={s.ticker} className="bar-row">
              <div className="ticker-col">
                <span className="ticker-label">{s.ticker}</span>
                <span className="ticker-sub">{SECTOR_NAMES[s.ticker] || ''}</span>
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
      <div className="cycle-legend" style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', justifyContent: 'center' }}>
        <span><span style={{ color: '#22c55e' }}>●</span> Early (회복)</span>
        <span><span style={{ color: '#eab308' }}>●</span> Mid (호황)</span>
        <span><span style={{ color: '#f97316' }}>●</span> Late (후퇴)</span>
        <span><span style={{ color: '#0ea5e9' }}>●</span> Defensive (침체)</span>
      </div>

      <style>{`
        .sector-container { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        .bars-wrapper { display: flex; flex-direction: column; gap: 0.9rem; flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px; }
        .bars-wrapper::-webkit-scrollbar { width: 4px; }
        .bars-wrapper::-webkit-scrollbar-track { background: transparent; }
        .bars-wrapper::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .bars-wrapper:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        .bar-row { display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-mono); }
        .ticker-col { width: 50px; display: flex; flex-direction: column; flex-shrink: 0; line-height: 1.2; }
        .ticker-label { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); letter-spacing: 0.5px; }
        .ticker-sub { font-size: 0.65rem; color: var(--text-muted); font-weight: 500; font-family: var(--font-body); }
        .bar-track { flex: 1; height: 10px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); overflow: hidden; }
        [data-theme='light'] .bar-track { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.05); box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
        .bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); min-width: 2px; }
        .ticker-val { width: 65px; text-align: right; font-weight: 600; font-size: 0.85rem; flex-shrink: 0; }
        .cycle-legend span { display: flex; align-items: center; gap: 4px; }
      `}</style>
    </div>
  );
}
