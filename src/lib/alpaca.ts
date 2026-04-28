import Alpaca from '@alpacahq/alpaca-trade-api';
import type { TickerQuote } from './types';

// 싱글톤 인스턴스 생성
export const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || '',
  secretKey: process.env.ALPACA_SECRET_KEY || '',
  paper: true,
});

/**
 * Alpaca API를 사용하여 여러 종목의 스냅샷(현재가, 시가, 고가, 저가, 전일종가 등)을 가져옵니다.
 * Yahoo Finance의 청크 분할 429 에러를 해결하기 위한 목적.
 */
export async function fetchAlpacaQuotes(tickers: string[]): Promise<Map<string, TickerQuote>> {
  const result = new Map<string, TickerQuote>();
  if (!tickers || tickers.length === 0) return result;

  // 알파카는 주식(알파벳)과 크립토를 분리해서 조회해야 함. 지수(^VIX 등)는 지원하지 않음.
  const stockTickers = tickers.filter(t => /^[A-Z]+$/.test(t));
  const cryptoTickers = tickers.filter(t => t.includes('-USD'));

  try {
    // 1. 주식 스냅샷 조회
    if (stockTickers.length > 0) {
      // getSnapshots는 여러 심볼을 한 번에 가져올 수 있음
      const snapshots = await alpaca.getSnapshots(stockTickers);
      
      for (const [symbol, snap] of Object.entries(snapshots) as [string, any][]) {
        if (!snap || !snap.dailyBar || !snap.prevDailyBar) continue;
        
        const price = snap.latestTrade ? snap.latestTrade.p : snap.dailyBar.c;
        const previousClose = snap.prevDailyBar.c;
        const change = price - previousClose;
        const changePercent = (change / previousClose) * 100;

        result.set(symbol, {
          symbol,
          name: symbol, // 알파카는 이름을 주지 않음. 프론트엔드에서 매핑 필요
          price,
          change,
          changePercent,
          previousClose,
          open: snap.dailyBar.o,
          dayHigh: snap.dailyBar.h,
          dayLow: snap.dailyBar.l,
          volume: snap.dailyBar.v,
        });
      }
    }

    // 2. 크립토 스냅샷 조회 (알파카는 BTC/USD 포맷을 사용)
    if (cryptoTickers.length > 0) {
      const alpacaCryptoSymbols = cryptoTickers.map(t => t.replace('-USD', '/USD'));
      try {
        const cryptoSnapshots = await alpaca.getCryptoSnapshots(alpacaCryptoSymbols);
        for (const [alpacaSymbol, snap] of Object.entries(cryptoSnapshots) as [string, any][]) {
          if (!snap || !snap.dailyBar || !snap.prevDailyBar) continue;
          
          const symbol = alpacaSymbol.replace('/USD', '-USD');
          const price = snap.latestTrade ? snap.latestTrade.p : snap.dailyBar.c;
          const previousClose = snap.prevDailyBar.c;
          const change = price - previousClose;
          const changePercent = (change / previousClose) * 100;

          result.set(symbol, {
            symbol,
            name: symbol,
            price,
            change,
            changePercent,
            previousClose,
            open: snap.dailyBar.o,
            dayHigh: snap.dailyBar.h,
            dayLow: snap.dailyBar.l,
            volume: snap.dailyBar.v,
          });
        }
      } catch (err: any) {
        console.warn(`[Alpaca] Crypto fetch warning: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error('[Alpaca] fetchQuotes error:', error.message);
  }

  return result;
}
