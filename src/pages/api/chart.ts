// src/pages/api/chart.ts
// Yahoo Finance 공개 HTTP 차트 엔드포인트 직접 호출
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker') || 'SPY';
  const interval = (url.searchParams.get('interval') || '1d') as '1d' | '1wk' | '1mo';

  const redis = getRedis(context);
  const cacheKey = `gidne_chart_${ticker}_${interval}`;

  try {
    // [Step 1] Redis 캐시 확인
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), { 
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
      });
    }

    // [Step 2] 캐시 미스 → Yahoo Finance 공개 HTTP 엔드포인트
    let range = '6mo';
    if (interval === '1mo') range = '5y';
    else if (interval === '1wk') range = '2y';

    const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
    const res = await fetch(yfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`);

    const result = await res.json();
    const meta = result?.chart?.result?.[0];
    if (!meta) throw new Error('No chart data returned');

    const timestamps = meta.timestamp || [];
    const ohlcv = meta.indicators?.quote?.[0] || {};

    const chartData = timestamps
      .map((ts: number, i: number) => {
        const close = ohlcv.close?.[i];
        if (close === null || close === undefined) return null;
        const d = new Date(ts * 1000);
        return {
          time: d.toISOString().split('T')[0],
          open: ohlcv.open?.[i] ?? close,
          high: ohlcv.high?.[i] ?? close,
          low: ohlcv.low?.[i] ?? close,
          close,
          volume: ohlcv.volume?.[i] ?? 0,
        };
      })
      .filter(Boolean);

    // [Step 3] Redis에 60초 TTL로 캐싱
    await redis.set(cacheKey, JSON.stringify(chartData), 'EX', 60);

    return new Response(JSON.stringify(chartData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  } catch (error) {
    console.error(`[chart] Failed for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch chart data' }), { status: 500 });
  }
};
