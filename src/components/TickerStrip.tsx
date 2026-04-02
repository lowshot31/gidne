import React, { useEffect, useRef } from 'react';
import type { TickerQuote } from '../lib/types';

interface Props {
  quotes: TickerQuote[];
}

function TickerItem({ q }: { q: TickerQuote }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevPrice = useRef(q.price);

  useEffect(() => {
    if (q.price === prevPrice.current) return;
    
    const isUp = q.price > prevPrice.current;
    prevPrice.current = q.price;

    const el = spanRef.current;
    if (el) {
      // 리액트 DOM 조작 한계를 가장 확실하게 우회하는 Web Animation API 사용
      const color = isUp ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
      el.animate([
        { backgroundColor: color },
        { backgroundColor: 'transparent' }
      ], {
        duration: 800,
        easing: 'ease-out'
      });
    }
  }, [q.price]);

  const isUpTotal = q.changePercent >= 0;
  const colorClass = isUpTotal ? 'text-bull' : 'text-bear';
  const sign = isUpTotal ? '▲' : '▼';
  
  return (
    <span ref={spanRef} className="strip-item" style={{ padding: '2px 6px' }}>
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
          border-radius: 4px;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
