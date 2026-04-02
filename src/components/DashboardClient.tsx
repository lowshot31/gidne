import React from 'react';
import { useMarketData } from '../hooks/useMarketData';
import MarketPulse from './MarketPulse';
import SectorBar from './SectorBar';
import RSLeaderboard from './RSLeaderboard';
import SkeletonCard from './SkeletonCard';

export default function DashboardClient() {
  const { data, loading, error } = useMarketData();

  if (loading || !data) {
    return (
      <div className="bento-grid">
        <SkeletonCard title="MARKET PULSE" />
        <div className="grid-columns">
          <div className="column macro">
            <SkeletonCard title="MACRO FOCUS" />
            <SkeletonCard title="EVENT HORIZON" />
          </div>
          <div className="column sector">
            <SkeletonCard title="SECTOR STRENGTH" />
            <SkeletonCard title="PRICE CHART (Coming Soon)" />
          </div>
          <div className="column leaderboard">
            <SkeletonCard title="RS LEADERBOARD" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bento-item bg-bear text-primary" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>데이터 로딩 실패</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bento-grid">
      <MarketPulse data={data.marketPulse} />

      <div className="grid-columns">
        <div className="column macro">
          <div className="bento-item h-full">
            <h3 className="text-secondary mb-md">MACRO FOCUS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {data.macro.map(m => {
                const isUp = m.changePercent >= 0;
                return (
                  <div key={m.ticker} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                    <span className="text-muted">{m.name}</span>
                    <strong className={isUp ? 'text-bull' : 'text-bear'}>
                      {m.price.toFixed(2)} ({isUp ? '+' : ''}{m.changePercent.toFixed(2)}%)
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bento-item">
            <h3 className="text-secondary mb-md">MARKET META</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              Update: {new Date(data.meta.lastUpdated).toLocaleTimeString()}<br/>
              Status: {data.meta.isMarketOpen ? '장중 (30s Polling)' : '장 마감 (5m Polling)'}
            </p>
          </div>
        </div>
        
        <div className="column sector">
          <SectorBar sectors={data.sectors} />
        </div>
        
        <div className="column leaderboard">
          <RSLeaderboard sectors={data.sectors} />
        </div>
      </div>

      <style>{`
        .bento-grid {
          display: flex;
          flex-direction: column;
          gap: var(--gap-md);
          height: 100%;
        }
        .grid-columns {
          display: grid;
          grid-template-columns: 250px 1fr 300px;
          gap: var(--gap-md);
          flex: 1;
        }
        .column {
          display: flex;
          flex-direction: column;
          gap: var(--gap-md);
        }
        .h-full { flex: 1; }
        .mb-md { margin-bottom: var(--gap-sm); }
        .text-secondary { color: var(--text-secondary); }
        .text-muted { color: var(--text-muted); }
        
        @media (max-width: 1200px) {
          .grid-columns { grid-template-columns: 1fr 300px; }
          .macro { flex-direction: row; }
          .macro .bento-item { flex: 1; }
        }
        @media (max-width: 768px) {
          .grid-columns { grid-template-columns: 1fr; }
          .macro { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
