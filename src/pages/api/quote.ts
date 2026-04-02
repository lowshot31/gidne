// src/pages/api/quote.ts
// 단일 티커 상세 시세 API
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { cache } from '../../lib/cache';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || ticker.length > 20) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });
  }

  const cacheKey = `quote_detail_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const q = await yahooFinance.quote(ticker);
    if (!q || !q.symbol) {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    }

    const data = {
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      open: q.regularMarketOpen ?? 0,
      dayHigh: q.regularMarketDayHigh ?? 0,
      dayLow: q.regularMarketDayLow ?? 0,
      volume: q.regularMarketVolume ?? 0,
      avgVolume: q.averageDailyVolume3Month ?? 0,
      marketCap: q.marketCap ?? 0,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
      exchange: q.fullExchangeName || q.exchange || '',
      quoteType: q.quoteType || '',
    };

    cache.set(cacheKey, data, 10_000); // 10초 캐시 (Watchlist 실시간성 확보)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[quote] error for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quote' }), { status: 500 });
  }
};
