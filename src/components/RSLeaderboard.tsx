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
      <h3 className="text-secondary mb-md" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>RS LEADERBOARD</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>vs SPX</span>
      </h3>
      <div className="leader-list">
        {sectors.map((s, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
          
          // 상대수익률 (RS)
          const isRsPositive = s.rs > 0;
          const rsClass = isRsPositive ? 'text-bull' : 'text-bear';
          const rsSign = isRsPositive ? '+' : '';
          
          // 절대수익률 (ETF Price)
          const isPricePositive = s.changePercent >= 0;
          const priceClass = isPricePositive ? 'text-bull' : 'text-bear';
          const priceSign = isPricePositive ? '+' : '';
          
          const shortName = SHORT_NAMES[s.name] || s.name;

          // 순위 변동 기호 (변동 없을 때는 아예 안 보이게 처리해서 깔끔하게)
          let rankChangeEl = null;
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
                  <span>UNDERPERFORM vs SPX</span>
                </div>
              )}
              <a href={`/chart/${s.ticker}`} className="leader-row">
                <span className="leader-medal">{medal}</span>
                
                <div className="leader-name-group">
                  <div className="leader-title">
                    <strong>{s.ticker}</strong>
                    <span className="text-muted short-name">{shortName}</span>
                  </div>
                  <div className="leader-price text-muted">
                    {s.price.toFixed(2)} <span className={priceClass} style={{ marginLeft: '2px' }}>
                      ({priceSign}{s.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="leader-rs-group">
                  <div className={`leader-rs ${rsClass}`}>
                    {rsSign}{s.rs.toFixed(2)}%
                  </div>
                  <div className="leader-rank-change">
                    {rankChangeEl}
                  </div>
                </div>
              </a>
            </React.Fragment>
          );
        })}
      </div>
      <style>{`
        .leaderboard-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .leader-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .leader-row {
          display: flex;
          align-items: center;
          padding: 0.6rem 0.2rem;
          border-bottom: 1px solid var(--glass-border);
          text-decoration: none;
          color: inherit;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
          border-radius: var(--radius-sm);
        }
        .leader-row:hover {
          background-color: var(--bg-secondary);
          transform: translateX(4px);
        }
        .leader-medal {
          width: 28px;
          text-align: center;
          font-weight: bold;
          flex-shrink: 0;
          font-size: 1.1rem;
        }
        .leader-name-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
          padding-left: 0.4rem;
        }
        .leader-title {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
          min-width: 0;
        }
        .short-name {
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .leader-price {
          font-size: 0.75rem;
          letter-spacing: -0.2px;
        }
        .leader-rs-group {
          text-align: right;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          width: 70px;
        }
        .leader-rs {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .leader-rank-change {
          font-size: 0.8rem;
        }
        .divider {
          text-align: center;
          padding: 0.75rem 0;
          margin: 0.5rem 0;
          position: relative;
        }
        .divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.3), transparent);
        }
        .divider span {
          background: var(--card-bg);
          padding: 0 0.5rem;
          position: relative;
          color: var(--bear);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
