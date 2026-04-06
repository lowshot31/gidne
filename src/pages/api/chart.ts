// src/pages/api/chart.ts
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { getRedis } from '../../lib/redis';

const yahooFinance = new YahooFinance();

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

    // [Step 2] 캐시 미스 → Yahoo Finance 호출
    const period1 = new Date();
    if (interval === '1mo') {
      period1.setFullYear(period1.getFullYear() - 5);
    } else if (interval === '1wk') {
      period1.setFullYear(period1.getFullYear() - 2);
    } else {
      period1.setMonth(period1.getMonth() - 6);
    }

    const result = await yahooFinance.chart(ticker, { 
      period1, 
      interval 
    });
    
    const chartData = result.quotes
      .filter((q: any) => q.close !== null && q.close !== undefined)
      .map((q: any) => ({
        time: q.date.toISOString().split('T')[0],
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0
      }));

    // [Step 3] Redis에 60초 TTL로 캐싱
    await redis.set(cacheKey, JSON.stringify(chartData), { ex: 60 });

    return new Response(JSON.stringify(chartData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  } catch (error) {
    console.error(`[chart] Failed to fetch historical data for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch chart data' }), { status: 500 });
  }
};

