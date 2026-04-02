import React from 'react';
import type { MarketPulseData } from '../lib/types';

interface Props {
  data: MarketPulseData;
}

export default function MarketPulse({ data }: Props) {
  return (
    <div className="bento-item market-pulse">
      <div className="pulse-header">
        <h2>{data.emoji} MARKET PULSE</h2>
        <h2 className="score">{data.score}/100</h2>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${data.score}%`,
            background: data.score > 55 ? 'var(--bull)' : data.score < 45 ? 'var(--bear)' : 'var(--neutral)'
          }} 
        />
      </div>
      <div className="pulse-label" style={{ 
        color: data.score > 55 ? 'var(--bull)' : data.score < 45 ? 'var(--bear)' : 'var(--neutral)',
        fontWeight: 'bold',
        marginTop: '0.5rem'
      }}>
        {data.label}
      </div>

      <p className="summary text-muted">{data.summary}</p>

      <style>{`
        .pulse-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .score {
          font-size: 2rem;
        }
        .progress-bar-container {
          height: 16px;
          background: rgba(255,255,255,0.1);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 1s ease-in-out, background 0.3s ease;
        }
        .summary {
          margin-top: 1rem;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}
