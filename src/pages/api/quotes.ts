// src/pages/api/quotes.ts
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const tickersRaw = url.searchParams.get('tickers');

  if (!tickersRaw) {
    return new Response(JSON.stringify({ error: 'tickers required' }), { status: 400 });
  }

  const tickers = Array.from(new Set(
    tickersRaw
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0 && t.length <= 30)
  )).slice(0, 30);

  if (tickers.length === 0) {
    return new Response(JSON.stringify({ error: 'no valid tickers' }), { status: 400 });
  }

  try {
    const data: Record<string, any> = {};
    const redis = getRedis(context);

    // 1. 처음 캐시 확인
    let cachedArray = await redis.mget(...tickers.map(t => `gidne_quote_${t}`));
    let missingTickers: string[] = [];

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const cachedData = cachedArray[i];
      if (cachedData) {
        data[ticker] = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      } else {
        missingTickers.push(ticker);
      }
    }

    // 2. 누락된 티커가 있다면 Data Pump 큐에 등록하고 폴링
    if (missingTickers.length > 0) {
      const remainingTickers = missingTickers.slice(1);
      await redis.sadd('gidne_queue_quote', missingTickers[0], ...remainingTickers);

      // 최대 10번 (약 5초) 대기하며 폴링
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, 500));
        
        const newCachedArray = await redis.mget(...missingTickers.map(t => `gidne_quote_${t}`));
        const stillMissing: string[] = [];
        
        for (let i = 0; i < missingTickers.length; i++) {
          const ticker = missingTickers[i];
          const cachedData = newCachedArray[i];
          if (cachedData) {
            data[ticker] = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
          } else {
            stillMissing.push(ticker);
          }
        }
        
        missingTickers = stillMissing;
        if (missingTickers.length === 0) break; // 모두 찾음
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[quotes] batch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quotes' }), { status: 500 });
  }
};

