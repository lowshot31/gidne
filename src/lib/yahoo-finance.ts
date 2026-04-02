// src/lib/yahoo-finance.ts
// Yahoo Finance 데이터 fetch — 서버사이드 전용
// yahoo-finance2 패키지 사용

import yahooFinance from 'yahoo-finance2';
import { cache, TTL } from './cache';
import type { TickerQuote } from './types';

/**
 * 여러 티커의 실시간 시세를 배치로 가져옵니다.
 * 캐시 HIT 시 즉시 반환, MISS 시 Yahoo Finance API 호출.
 */
export async function fetchQuotes(tickers: string[]): Promise<Map<string, TickerQuote>> {
  const CACHE_KEY = 'yahoo_quotes_batch';
  
  const cached = cache.get<Map<string, TickerQuote>>(CACHE_KEY);
  if (cached) return cached;

  const result = new Map<string, TickerQuote>();

  try {
    // yahoo-finance2의 quote()는 배열을 지원
    const quotes = await yahooFinance.quote(tickers);

    // quote()가 단일 객체를 반환하는 경우 배열로 변환
    const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

    for (const q of quoteArray) {
      if (!q || !q.symbol) continue;
      
      result.set(q.symbol, {
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        previousClose: q.regularMarketPreviousClose ?? 0,
      });
    }

    cache.set(CACHE_KEY, result, TTL.QUOTE);
  } catch (error) {
    console.error('[yahoo-finance] fetch error:', error);
    // 에러 시 빈 Map 반환 — 컴포넌트에서 스켈레톤 표시
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
