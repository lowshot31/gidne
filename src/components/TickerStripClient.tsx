import React, { useMemo } from 'react';
import TickerStrip from './TickerStrip';
import { useMarketData } from '../hooks/useMarketData';
import { useFinnhubStream } from '../hooks/useFinnhubStream';

// Yahoo 심볼 → Finnhub 심볼 매핑 (주식/ETF만)
const YAHOO_TO_FINNHUB: Record<string, string> = {
  'SPY': 'SPY',
  'QQQ': 'QQQ',
  '^GSPC': 'SPY',
  '^IXIC': 'QQQ',
};

const FINNHUB_SYMBOLS = Array.from(new Set(Object.values(YAHOO_TO_FINNHUB)));

export default function TickerStripClient() {
  const { data, loading, error } = useMarketData();
  const finnhubPrices = useFinnhubStream(FINNHUB_SYMBOLS);

  const mergedQuotes = useMemo(() => {
    if (!data?.tickerStrip) return [];

    return data.tickerStrip.map(q => {
      const finnhubSymbol = YAHOO_TO_FINNHUB[q.symbol];
      if (!finnhubSymbol) return q;

      const live = finnhubPrices.get(finnhubSymbol);
      if (!live) return q;

      return {
        ...q,
        price: live.price,
        change: live.change,
        changePercent: live.changePercent,
        previousClose: live.prevClose,
      };
    });
  }, [data?.tickerStrip, finnhubPrices]);

  if (loading || error || !data) {
    return <div className="ticker-strip" style={{ padding: '10px 1.5rem', background: 'rgba(15, 15, 20, 0.9)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Loading Tickers...</div>;
  }

  return <TickerStrip quotes={mergedQuotes} />;
}
