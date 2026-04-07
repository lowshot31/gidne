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

  for (const t of tickers) {
    const cached = await redis.get(`gidne_ret_v2_${t}`);
    if (cached) {
      results[t] = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } else {
      missing.push(t);
    }
  }

  if (missing.length > 0) {
    for (const t of missing) {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=3mo`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        if (!res.ok) throw new Error(`YF Chart HTTP error: ${res.status}`);
        
        const json = await res.json();
        const result = json.chart?.result?.[0];
        if (!result) continue;
        
        const closePrices = result.indicators?.quote?.[0]?.close || [];
        const quotes = closePrices.filter((c: number | null) => c !== null && c !== undefined);
        
        if (quotes.length > 0) {
          const latest = quotes[quotes.length - 1];
          
          // 1W (약 5거래일 전)
          const idx1W = Math.max(0, quotes.length - 6);
          const price1W = quotes[idx1W] || latest;
          
          // 1M (약 21거래일 전)
          const idx1M = Math.max(0, quotes.length - 22);
          const price1M = quotes[idx1M] || latest;

          const change1W = ((latest - price1W) / price1W) * 100;
          const change1M = ((latest - price1M) / price1M) * 100;
          
          const ret = { change1W, change1M };
          results[t] = ret;
          
          // 4시간 캐싱 (과거 수익률이므로 자주 바뀔 필요 없음)
          await redis.set(`gidne_ret_v2_${t}`, JSON.stringify(ret), { ex: 14400 });
        }
      } catch(e) {
        console.error(`Failed returns for ${t}:`, e);
      }
      // Throttling for Yahoo (200ms per ticker)
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
