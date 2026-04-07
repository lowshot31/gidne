// src/pages/api/returns.ts
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const tickersStr = url.searchParams.get('tickers') || '';
  if (!tickersStr) return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' }});
  
  // 최대 100개까지만 처리하여 서버 보호
  const tickers = Array.from(new Set(tickersStr.split(',').map(t => t.trim().toUpperCase()).filter(Boolean))).slice(0, 100);

  const redis = getRedis({ locals });
  const results: Record<string, { change1W: number; change1M: number }> = {};
  const missing: string[] = [];

  if (tickers.length > 0) {
    // 1번의 요청으로 모든 키를 한 번에 가져와서 Cloudflare Subrequest Limit 방어
    const keys = tickers.map(t => `gidne_ret_v2_${t}`);
    const cachedValues = await redis.mget(...keys);

    tickers.forEach((t, i) => {
      const cached = cachedValues[i];
      if (cached) {
        results[t] = typeof cached === 'string' ? JSON.parse(cached) : cached;
      } else {
        missing.push(t);
      }
    });

    if (missing.length > 0) {
      // 큐에 추가하여 data-pump가 오프라인 환경에서 처리하도록 위임
      // 단 1건의 요청으로 큐 삽입 
      // @ts-ignore : Upstash redis types can be tricky
      await redis.sadd('gidne_queue_returns', missing[0], ...missing.slice(1));
      
      // 당장 표시할 캐시가 없으므로 프론트에 임시 0 반환
      for (const t of missing) {
        results[t] = { change1W: 0, change1M: 0 };
      }
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
