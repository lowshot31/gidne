import React from 'react';
import type { SectorData } from '../lib/types';

interface Props {
  sectors: SectorData[];
}

export default function RSLeaderboard({ sectors }: Props) {
  // RS 기반 정렬된 상태이므로 상위 순서대로 표시
  return (
    <div className="bento-item h-full leaderboard-container">
      <h3 className="text-secondary mb-md">RS LEADERBOARD</h3>
      <div className="leader-list">
        {sectors.map((s, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
          const isRsPositive = s.rs > 0;
          const rsClass = isRsPositive ? 'text-bull' : 'text-bear';
          const rsSign = isRsPositive ? '+' : '';

          // 순위 변동 기호
          let rankChangeEl = <span style={{ color: 'var(--text-muted)' }}>──</span>;
          if (s.rsRankChange > 0) {
            rankChangeEl = <span className="text-bull">▲{s.rsRankChange}</span>;
          } else if (s.rsRankChange < 0) {
            rankChangeEl = <span className="text-bear">▼{Math.abs(s.rsRankChange)}</span>;
          }

          // 중간 중립선 표시 (RS가 +에서 -로 넘어가는 구간)
          const renderDivider = idx > 0 && sectors[idx - 1].rs >= 0 && s.rs < 0;

          return (
            <React.Fragment key={s.ticker}>
              {renderDivider && (
                <div className="divider">
                  <span className="text-muted">──── UNDERPERFORM ────</span>
                </div>
              )}
              <div className="leader-row" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{medal}</span>
                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <strong>{s.ticker}</strong>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{s.name.substring(0, 10)}</span>
                </div>
                <div style={{ width: '80px', textAlign: 'right' }} className={rsClass}>
                  {rsSign}{s.rs.toFixed(2)}%
                </div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.9rem' }}>
                  {rankChangeEl}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <style>{`
        .leaderboard-container {
          display: flex;
          flex-direction: column;
        }
        .leader-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-family: var(--font-mono);
          font-size: 0.95rem;
        }
        .leader-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .divider {
          text-align: center;
          padding: 1rem 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
