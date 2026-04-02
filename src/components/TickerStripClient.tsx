import React from 'react';
import TickerStrip from './TickerStrip';
import { useMarketData } from '../hooks/useMarketData';

export default function TickerStripClient() {
  const { data, loading, error } = useMarketData();

  if (loading || error || !data) {
    return <div className="ticker-strip" style={{ padding: '10px 1.5rem', background: 'rgba(15, 15, 20, 0.9)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Loading Tickers...</div>;
  }

  return <TickerStrip quotes={data.tickerStrip} />;
}
