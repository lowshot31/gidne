// src/pages/api/returns.ts
import type { APIRoute } from 'astro';
import { yahooFinance } from '../../lib/yahoo-finance';
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
        const period1 = new Date(); 
        period1.setMonth(period1.getMonth() - 2); // 넉넉히 2달치 (1M 계산을 위해)
        const chart: any = await yahooFinance.chart(t, { period1, interval: '1d' as any });
        
        const quotes = chart.quotes.filter((q: any) => q.close !== null && q.close !== undefined);
        if (quotes.length > 0) {
          const latest = quotes[quotes.length - 1].close;
          
          // 1W (약 5거래일 전)
          const idx1W = Math.max(0, quotes.length - 6);
          const price1W = quotes[idx1W].close || latest;
          
          // 1M (약 21거래일 전)
          const idx1M = Math.max(0, quotes.length - 22);
          const price1M = quotes[idx1M].close || latest;

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
