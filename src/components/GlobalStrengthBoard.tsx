import React from 'react';
import type { IndexQuote } from '../lib/types';

interface Props {
  indices: IndexQuote[];
}

export default function GlobalStrengthBoard({ indices }: Props) {
  if (!indices || indices.length === 0) return null;

  // Sort by changePercent to find leaders/laggards
  const sorted = [...indices].sort((a, b) => b.changePercent - a.changePercent);
  
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice().reverse().slice(0, 3);

  return (
    <div className="global-strength-board glass-panel">
      <div className="strength-column">
        <h4 className="text-bull" style={{ margin: '0 0 8px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔥 글로벌 강세장
        </h4>
        <div className="strength-list">
          {strongest.map(idx => (
            <div key={idx.symbol} className="strength-item">
              <span className="strength-flag">{idx.flag}</span>
              <span className="strength-name">{idx.name}</span>
              <span className="text-bull" style={{ fontFamily: 'var(--font-mono)' }}>+{idx.changePercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="strength-divider" />

      <div className="strength-column">
        <h4 className="text-bear" style={{ margin: '0 0 8px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ❄️ 글로벌 약세장
        </h4>
        <div className="strength-list">
          {weakest.map(idx => (
            <div key={idx.symbol} className="strength-item">
              <span className="strength-flag">{idx.flag}</span>
              <span className="strength-name">{idx.name}</span>
              <span className="text-bear" style={{ fontFamily: 'var(--font-mono)' }}>{idx.changePercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .global-strength-board {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          height: 100%;
          align-items: center;
        }

        .strength-column {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .strength-divider {
          width: 1px;
          height: 80%;
          background: var(--border-color);
        }

        .strength-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .strength-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }

        .strength-name {
          flex: 1;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
