// src/pages/api/quote-summary.ts
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || ticker.length > 20) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });
  }

  const redis = getRedis(context);
  const cacheKey = `gidne_summary_${ticker}`;

  try {
    let cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      });
    }

    await redis.sadd('gidne_queue_summary', ticker);

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      cached = await redis.get(cacheKey);
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Data pump timeout' }), { status: 504 });
  } catch (error: any) {
    console.error(`[quote-summary] error for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Edge process failed' }), { status: 500 });
  }
};
