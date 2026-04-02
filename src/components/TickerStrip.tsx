import React from 'react';
import type { TickerQuote } from '../lib/types';
import { useFlash } from '../hooks/useFlash';

interface Props {
  quotes: TickerQuote[];
}

function TickerItem({ q }: { q: TickerQuote }) {
  const flash = useFlash(q.price); // 퍼센트가 아닌 가격 변동 시 플래시
  const isUp = q.changePercent >= 0;
  const colorClass = isUp ? 'text-bull' : 'text-bear';
  const sign = isUp ? '▲' : '▼';
  
  return (
    <span className={`strip-item ${flash}`} style={{ padding: '2px 6px' }}>
      <strong>{q.name}</strong>
      <span>{q.price.toFixed(2)}</span>
      <span className={colorClass}>
        {sign}{Math.abs(q.changePercent).toFixed(2)}%
      </span>
    </span>
  );
}

export default function TickerStrip({ quotes }: Props) {
  if (!quotes || quotes.length === 0) return <div className="ticker-strip">Loading...</div>;

  return (
    <div className="ticker-strip">
      <div className="ticker-track">
        {/* 무한 스크롤 효과를 위해 배열을 두 번 렌더링 */}
        {[...quotes, ...quotes].map((q, idx) => (
          <TickerItem key={`${q.symbol}-${idx}`} q={q} />
        ))}
      </div>
      <style>{`
        .ticker-strip {
          overflow: hidden;
          white-space: nowrap;
          padding: 10px 0;
          background: var(--bg-secondary, #111111);
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
