// src/pages/api/search.ts
// 티커 검색 API — Yahoo Finance 공개 검색 엔드포인트 직접 호출
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

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

    // Yahoo Finance 공개 검색 엔드포인트 (npm 패키지 대신 직접 HTTP)
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0&enableFuzzyQuery=false`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`Yahoo search HTTP ${res.status}`);

    const result = await res.json();

    const suggestions = (result.quotes || [])
      .filter((q: any) => q.symbol && ['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'INDEX', 'CURRENCY', 'FUTURE'].includes(q.quoteType))
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
    return new Response(JSON.stringify([]), { status: 200 }); // 실패해도 200 (클라이언트 로컬 인덱스가 커버)
  }
};


