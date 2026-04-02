import React from 'react';
import type { SectorData } from '../lib/types';

interface Props {
  sectors: SectorData[];
}

export default function RSLeaderboard({ sectors }: Props) {
  // 섹터 약칭 매핑 — 잘림 방지
  const SHORT_NAMES: Record<string, string> = {
    'Technology': 'Tech',
    'Financials': 'Fin',
    'Healthcare': 'Health',
    'Energy': 'Energy',
    'Industrials': 'Indust',
    'Staples': 'Staples',
    'Discretionary': 'Discrt',
    'Utilities': 'Util',
    'Materials': 'Matrl',
    'Real Estate': 'RE',
    'Communication': 'Comm',
  };

  return (
    <div className="bento-item h-full leaderboard-container">
      <h3 className="text-secondary mb-md">RS LEADERBOARD</h3>
      <div className="leader-list">
        {sectors.map((s, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
          const isRsPositive = s.rs > 0;
          const rsClass = isRsPositive ? 'text-bull' : 'text-bear';
          const rsSign = isRsPositive ? '+' : '';
          const shortName = SHORT_NAMES[s.name] || s.name;

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
                <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold', flexShrink: 0 }}>{medal}</span>
                <div className="leader-name">
                  <strong>{s.ticker}</strong>
                  <span className="text-muted leader-short-name">{shortName}</span>
                </div>
                <div style={{ width: '78px', textAlign: 'right', flexShrink: 0 }} className={rsClass}>
                  {rsSign}{s.rs.toFixed(2)}%
                </div>
                <div style={{ width: '38px', textAlign: 'right', fontSize: '0.9rem', flexShrink: 0 }}>
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
          overflow-y: auto;
        }
        .leader-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .leader-name {
          flex: 1;
          display: flex;
          gap: 0.4rem;
          align-items: center;
          min-width: 0;
          overflow: hidden;
        }
        .leader-short-name {
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
