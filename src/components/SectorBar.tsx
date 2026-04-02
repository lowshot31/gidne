import React from 'react';
import type { SectorData } from '../lib/types';

interface Props {
  sectors: SectorData[];
}

export default function SectorBar({ sectors }: Props) {
  // 원래 S&P 섹터 표준 순서에 맞출지, 아니면 상승률/RS 순서로 그릴지
  // 디자인에 따르면 상승률/RS 순서로 수평 바들을 보여줌 (위가 가장 강함)
  
  // 최대 퍼센트를 기준으로 막대 길이를 상대적으로 그림
  const maxAbsChange = Math.max(...sectors.map(s => Math.abs(s.changePercent)), 1);

  return (
    <div className="bento-item h-full sector-container">
      <h3 className="text-secondary mb-md">SECTOR STRENGTH</h3>
      <div className="bars-wrapper">
        {sectors.map((s) => {
          const isUp = s.changePercent >= 0;
          const barWidth = `${(Math.abs(s.changePercent) / maxAbsChange) * 100}%`;
          const sign = isUp ? '+' : '';
          const valColor = isUp ? 'var(--bull)' : 'var(--bear)';
          
          return (
            <div key={s.ticker} className="bar-row">
              <span className="ticker-label text-muted" style={{ width: '40px', fontWeight: 'bold' }}>{s.ticker}</span>
              <div className="bar-track">
                {/* 0.0을 중심으로 양쪽으로 뻗어나가는 방식 대신, 동일한 시작점에서 길이 비율로 표현 */}
                <div 
                  className="bar-fill"
                  style={{
                    width: barWidth,
                    background: s.color,  // 섹터 고유 컬러 유지
                    opacity: isUp ? 1 : 0.6 // 하락 섹터는 컬러 투명도 적용
                  }}
                />
              </div>
              <span className="ticker-val" style={{ width: '60px', textAlign: 'right', color: valColor }}>
                {sign}{s.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="cycle-legend text-muted" style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
        <span>● Early/Growth</span>
        <span>● Mid/Defensive</span>
        <span>● Late/Rate-Sens</span>
      </div>

      <style>{`
        .sector-container {
          display: flex;
          flex-direction: column;
        }
        .bars-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          flex: 1;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.95rem;
        }
        .bar-track {
          flex: 1;
          height: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
