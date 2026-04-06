// src/pages/api/quote.ts
// 단일 티커 상세 시세 API
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { getRedis } from '../../lib/redis';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || ticker.length > 20) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });
  }

  const redis = getRedis(context);
  const cacheKey = `gidne_quote_${ticker}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=5' },
      });
    }

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

    await redis.set(cacheKey, JSON.stringify(data), { ex: 15 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=5' },
    });
  } catch (error) {
    console.error(`[quote] error for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quote' }), { status: 500 });
  }
};

