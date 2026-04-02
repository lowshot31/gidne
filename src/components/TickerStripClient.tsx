import React, { useMemo } from 'react';
import TickerStrip from './TickerStrip';
import { useMarketData } from '../hooks/useMarketData';
import { useFinnhubStream } from '../hooks/useFinnhubStream';
import { useBinanceStream } from '../hooks/useBinanceStream';

// Yahoo 심볼 → Finnhub 심볼 매핑 (미국 주식/지수)
const YAHOO_TO_FINNHUB: Record<string, string> = {
  'SPY': 'SPY',
  'QQQ': 'QQQ',
  '^GSPC': 'SPY',
  '^IXIC': 'QQQ',
};

// Yahoo 심볼 → Binance 심볼 매핑 (암호화폐)
const YAHOO_TO_BINANCE: Record<string, string> = {
  'BTC-USD': 'BTCUSDT',
  'ETH-USD': 'ETHUSDT',
};

const FINNHUB_SYMBOLS = Array.from(new Set(Object.values(YAHOO_TO_FINNHUB)));
const BINANCE_SYMBOLS = Array.from(new Set(Object.values(YAHOO_TO_BINANCE)));

export default function TickerStripClient() {
  const { data, loading, error } = useMarketData();
  
  // 주식은 Finnhub, 코인은 Binance를 통해 초 단위 실시간 업데이트 받기 (장이 열려있을 때만 주식 갱신됨)
  const finnhubPrices = useFinnhubStream(FINNHUB_SYMBOLS);
  const binancePrices = useBinanceStream(BINANCE_SYMBOLS);

  const mergedQuotes = useMemo(() => {
    if (!data?.tickerStrip) return [];

    return data.tickerStrip.map(q => {
      // 1. Finnhub (주식) 확인
      const finnhubSymbol = YAHOO_TO_FINNHUB[q.symbol];
      if (finnhubSymbol) {
        const live = finnhubPrices.get(finnhubSymbol);
        if (live) {
          return {
            ...q,
            price: live.price,
            change: live.change,
            changePercent: live.changePercent,
            previousClose: live.prevClose,
          };
        }
      }

      // 2. Binance (암호화폐) 확인
      const binanceSymbol = YAHOO_TO_BINANCE[q.symbol];
      if (binanceSymbol) {
        const live = binancePrices.get(binanceSymbol);
        if (live) {
          // Binance의 등락금액은 현재가 - (현재가 / (1 + 변동률/100)) 로 근사하거나 생략
          const prevClose = live.price / (1 + (live.change24h / 100));
          return {
            ...q,
            price: live.price,
            change: live.price - prevClose, 
            changePercent: live.change24h,
            // previousClose 생략 가능
          };
        }
      }

      // 없으면 기존 야후 데이터 반환
      return q;
    });
  }, [data?.tickerStrip, finnhubPrices, binancePrices]);

  if (loading || error || !data) {
    return <div className="ticker-strip" style={{ padding: '10px 1.5rem', background: 'rgba(15, 15, 20, 0.9)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Loading Tickers...</div>;
  }

  return <TickerStrip quotes={mergedQuotes} />;
}
