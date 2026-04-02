// src/pages/api/search.ts
// 티커 검색 API — yahoo-finance2 search() 활용
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { cache } from '../../lib/cache';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 1 || query.length > 30) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
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

    cache.set(cacheKey, suggestions, 300_000); // 5분 캐시

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[search] error:', error);
    return new Response(JSON.stringify([]), { status: 500 });
  }
};
