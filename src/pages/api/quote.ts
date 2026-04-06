// src/pages/api/quote.ts
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || ticker.length > 20) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });
  }

  const redis = getRedis(context);
  const cacheKey = `gidne_quote_${ticker}`;

  try {
    // 1. 캐시 확인
    let cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=5' },
      });
    }

    // 2. 캐시 미스 → Data Pump 큐에 추가
    await redis.sadd('gidne_queue_quote', ticker);

    // 3. 지수 백오프 폴링 (최대 약 5초 대기)
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      cached = await redis.get(cacheKey);
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=5' },
        });
      }
    }

    // 4. 시간 초과
    return new Response(JSON.stringify({ error: 'Data pump fetch timeout' }), { status: 504 });
  } catch (error) {
    console.error(`[quote] error for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Internal edge error' }), { status: 500 });
  }
};


