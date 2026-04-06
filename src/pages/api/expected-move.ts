// src/pages/api/expected-move.ts
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker) return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });

  const redis = getRedis(context);
  const cacheKey = `gidne_em_${ticker}`;

  try {
    let cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    await redis.sadd('gidne_queue_em', ticker);

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      cached = await redis.get(cacheKey);
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Data pump timeout' }), { status: 504 });
  } catch (err: any) {
    console.error(`[expected-move error] for ${ticker}:`, err.message);
    return new Response(JSON.stringify({ error: 'Edge process failed' }), { status: 500 });
  }
};

