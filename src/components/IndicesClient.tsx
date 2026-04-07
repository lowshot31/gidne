import React from 'react';
import { useMarketData } from '../hooks/useMarketData';
import MarketPulse from './MarketPulse';
import PriceChart from './PriceChart';

export default function IndicesClient() {
  const { data, loading, error } = useMarketData();

  if (loading || !data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Indices...</div>;
  if (error) return <div className="text-bear" style={{ padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
      <MarketPulse data={data.marketPulse} />
      
      <style>{`
        .indices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .indices-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="indices-grid">
        <PriceChart ticker="^GSPC" name="S&P 500" />
        <PriceChart ticker="^IXIC" name="NASDAQ" />
        <PriceChart ticker="^KS11" name="KOSPI" />
        <PriceChart ticker="^N225" name="NIKKEI 225" />
      </div>
    </div>
  );
}
