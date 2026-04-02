// src/pages/api/market-data.ts
// Astro API Route — 모든 시장 데이터를 한 번에 반환
// React 컴포넌트들이 이 엔드포인트 하나만 호출하면 됨

import type { APIRoute } from 'astro';
import { fetchQuotes } from '../../lib/yahoo-finance';
import { buildSectorData } from '../../lib/indicators';
import { calculateMarketPulse } from '../../lib/market-pulse';
import {
  getAllTickers,
  TICKER_STRIP,
  SECTOR_ETFS,
  MACRO_TICKERS,
  INDICES,
  isUSMarketOpen,
  getPollingInterval,
} from '../../lib/tickers';
import type { MarketDataResponse, TickerQuote, MacroData } from '../../lib/types';

export const GET: APIRoute = async () => {
  try {
    // 1. 전체 티커 배치 요청 (1회 호출로 모든 데이터 fetch)
    const allTickers = getAllTickers();
    const quotes = await fetchQuotes(allTickers);

    // 2. Ticker Strip 데이터
    const tickerStrip: TickerQuote[] = TICKER_STRIP.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    // 3. 섹터 데이터 (RS 계산 포함)
    const sectors = buildSectorData(quotes);

    // 4. Macro 데이터
    const macro: MacroData[] = MACRO_TICKERS.map(t => {
      const q = quotes.get(t.ticker);
      return {
        ticker: t.ticker,
        name: t.name,
        category: t.category,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
      };
    });

    // 5. 지수 데이터
    const indices: TickerQuote[] = INDICES.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    // 6. Market Pulse 계산
    const vixQuote = quotes.get('^VIX') ?? undefined;
    const marketPulse = calculateMarketPulse({ sectors, vixQuote });

    // 7. 응답 조립
    const response: MarketDataResponse = {
      tickerStrip,
      sectors,
      marketPulse,
      macro,
      indices,
      meta: {
        isMarketOpen: isUSMarketOpen(),
        lastUpdated: new Date().toISOString(),
        pollingInterval: getPollingInterval(),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15', // CDN에서 15초 캐시
      },
    });
  } catch (error) {
    console.error('[API] /api/market-data error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
