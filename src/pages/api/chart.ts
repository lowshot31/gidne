// src/pages/api/chart.ts
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { cache } from '../../lib/cache';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const ticker = url.searchParams.get('ticker') || 'SPY';
  const interval = (url.searchParams.get('interval') || '1d') as '1d' | '1wk' | '1mo';

  const cacheKey = `chart_data_v2_${ticker}_${interval}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return new Response(JSON.stringify(cached), { 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
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
    
    // TradingView Lightweight Charts (Candlestick + Volume) 포맷
    const chartData = result.quotes
      .filter((q: any) => q.close !== null && q.close !== undefined)
      .map((q: any) => ({
        time: q.date.toISOString().split('T')[0], // YYYY-MM-DD
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0
      }));

    cache.set(cacheKey, chartData, 60_000); // 1분(60,000ms) 캐싱

    return new Response(JSON.stringify(chartData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' }
    });
  } catch (error) {
    console.error(`[chart] Failed to fetch historical data for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch chart data' }), { status: 500 });
  }
};
