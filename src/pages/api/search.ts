// src/pages/api/search.ts
// 티커 검색 API — yahoo-finance2 search() 활용
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { getRedis } from '../../lib/redis';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 1 || query.length > 30) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const redis = getRedis(context);
  const cacheKey = `gidne_search_${query.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      });
    }

    const result = await yahooFinance.search(query, { newsCount: 0 });

    const suggestions = (result.quotes || [])
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'INDEX'))
      .slice(0, 8)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
        exchange: q.exchange || '',
      }));

    // 5분 캐시
    await redis.set(cacheKey, JSON.stringify(suggestions), { ex: 300 });

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    console.error('[search] error:', error);
    return new Response(JSON.stringify([]), { status: 500 });
  }
};

