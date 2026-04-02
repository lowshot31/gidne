import React from 'react';
import type { TickerQuote } from '../lib/types';

interface Props {
  quotes: TickerQuote[];
}

export default function TickerStrip({ quotes }: Props) {
  if (!quotes || quotes.length === 0) return <div className="ticker-strip">Loading...</div>;

  return (
    <div className="ticker-strip">
      <div className="ticker-track">
        {/* 무한 스크롤 효과를 위해 배열을 두 번 렌더링 */}
        {[...quotes, ...quotes].map((q, idx) => {
          const isUp = q.changePercent >= 0;
          const colorClass = isUp ? 'text-bull' : 'text-bear';
          const sign = isUp ? '▲' : '▼';
          
          return (
            <span key={`${q.symbol}-${idx}`} className="strip-item">
              <strong>{q.name}</strong>
              <span className={colorClass}>
                {sign}{Math.abs(q.changePercent).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
      <style>{`
        .ticker-strip {
          overflow: hidden;
          white-space: nowrap;
          padding: 10px 0;
          background: rgba(15, 15, 20, 0.9);
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }
        .ticker-track {
          display: inline-flex;
          gap: 2rem;
          animation: scroll 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        .strip-item {
          display: flex;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.95rem;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
