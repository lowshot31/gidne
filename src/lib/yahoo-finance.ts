// src/lib/yahoo-finance.ts
// Yahoo Finance 데이터 fetch — 서버사이드 전용
// yahoo-finance2 패키지 사용

import YahooFinance from 'yahoo-finance2';
import { cache, TTL } from './cache';
import type { TickerQuote } from './types';

// yahoo-finance2 v3 이상부터는 인스턴스화가 필요합니다
export const yahooFinance = new YahooFinance();

/**
 * 여러 티커의 실시간 시세를 청크 병렬로 가져옵니다.
 * 33개 티커를 10개씩 나눠서 Promise.all로 동시 요청 → 응답 시간 ~3배 단축
 */
export async function fetchQuotes(tickers: string[]): Promise<Map<string, TickerQuote>> {
  const CACHE_KEY = 'yahoo_quotes_batch';
  const CHUNK_SIZE = 10;
  
  const cached = cache.get<Map<string, TickerQuote>>(CACHE_KEY);
  if (cached) return cached;

  const result = new Map<string, TickerQuote>();

  try {
    // 청크로 분할
    const chunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
      chunks.push(tickers.slice(i, i + CHUNK_SIZE));
    }

    // 모든 청크를 병렬 요청 — 원래 요청 티커도 함께 전달
    const chunkResults = await Promise.allSettled(
      chunks.map(async (chunk) => {
        const quotes = await yahooFinance.quote(chunk);
        const arr = Array.isArray(quotes) ? quotes : [quotes];
        return { requestedTickers: chunk, quotes: arr };
      })
    );

    // 결과 합치기 (실패한 청크는 무시)
    for (const res of chunkResults) {
      if (res.status === 'fulfilled') {
        const { requestedTickers, quotes } = res.value;
        
        // 결과 합치기: Yahoo Finance 응답 배열(quotes)은 요청 순서와 일치하지 않으므로 심볼 기반으로 찾아서 매핑합니다.
        for (const reqTicker of requestedTickers) {
          // 배열에서 요청한 티커(원본 혹은 Yahoo가 변환한 심볼) 찾기
          const q = quotes.find((quote: any) => 
            quote.symbol === reqTicker || 
            (reqTicker === 'KRW=X' && quote.symbol === 'USDKRW=X')
          );
          
          if (!q || !q.symbol) continue;
          
          const quoteData: TickerQuote = {
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose ?? 0,
          };
          
          // 반환된 심볼과 요청한 심볼 양쪽 모두로 캐싱
          result.set(q.symbol, quoteData);
          if (reqTicker !== q.symbol) {
            result.set(reqTicker, quoteData);
          }
        }
      } else {
        console.error('[yahoo-finance] chunk failed:', res.reason);
      }
    }

    cache.set(CACHE_KEY, result, TTL.QUOTE);
  } catch (error) {
    console.error('[yahoo-finance] fetch error:', error);
  }

  return result;
}

/**
 * 단일 티커의 시세를 가져옵니다.
 */
export async function fetchSingleQuote(ticker: string): Promise<TickerQuote | null> {
  try {
    const q = await yahooFinance.quote(ticker);
    if (!q || !q.symbol) return null;

    return {
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
    };
  } catch (error) {
    console.error(`[yahoo-finance] fetch error for ${ticker}:`, error);
    return null;
  }
}
