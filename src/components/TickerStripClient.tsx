import React, { useMemo } from 'react';
import TickerStrip from './TickerStrip';
import { useMarketData } from '../hooks/useMarketData';
import { useBinanceStream } from '../hooks/useBinanceStream';

// Yahoo 심볼 → Binance 심볼 매핑 (암호화폐)
const YAHOO_TO_BINANCE: Record<string, string> = {
  'BTC-USD': 'BTCUSDT',
  'ETH-USD': 'ETHUSDT',
};

const BINANCE_SYMBOLS = Array.from(new Set(Object.values(YAHOO_TO_BINANCE)));

export default function TickerStripClient() {
  const { data, loading, error } = useMarketData();
  
  // 코인은 Binance를 통해 초 단위 실시간 업데이트 받기
  const binancePrices = useBinanceStream(BINANCE_SYMBOLS);

  const mergedQuotes = useMemo(() => {
    if (!data?.tickerStrip) return [];

    const quotes = [...data.tickerStrip];

    const btc = binancePrices.get('BTCUSDT');
    if (btc) {
      const prevClose = btc.price / (1 + (btc.change24h / 100));
      // 적절한 위치(대략 4번째)에 비트코인 삽입
      quotes.splice(4, 0, {
        symbol: 'BTCUSDT',
        name: 'BTC',
        price: btc.price,
        change: btc.price - prevClose,
        changePercent: btc.change24h,
        previousClose: prevClose,
      });
    }

    const eth = binancePrices.get('ETHUSDT');
    if (eth) {
      const prevClose = eth.price / (1 + (eth.change24h / 100));
      // 비트코인 바로 옆에 이더리움 삽입
      quotes.splice(5, 0, {
        symbol: 'ETHUSDT',
        name: 'ETH',
        price: eth.price,
        change: eth.price - prevClose,
        changePercent: eth.change24h,
        previousClose: prevClose,
      });
    }

    return quotes;
  }, [data?.tickerStrip, binancePrices]);

  if (loading || error || !data) {
    return <div className="ticker-strip" style={{ padding: '10px 1.5rem', background: 'rgba(15, 15, 20, 0.9)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Loading Tickers...</div>;
  }

  return <TickerStrip quotes={mergedQuotes} />;
}
