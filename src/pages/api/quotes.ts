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

    // 1. 캐시 확인
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

    // 2. 캐시 미스 → Data Pump 큐 등록 및 빠른 fetch() 시도 (Alpaca + Yahoo 하이브리드)
    if (missingTickers.length > 0) {
      try {
        await redis.sadd('gidne_queue_quote', missingTickers[0], ...missingTickers.slice(1));
        await redis.sadd('gidne_watched_tickers', missingTickers[0], ...missingTickers.slice(1));
        
        // 빠른 응답을 위해 1차 알파카, 2차 야후 하이브리드 폴백
        const initialAlpacaMisses = missingTickers.filter(t => /^[A-Z]+$/.test(t) || t.includes('-USD'));
        const initialYahooMisses = missingTickers.filter(t => !initialAlpacaMisses.includes(t));

        const { fetchAlpacaQuotes } = await import('../../lib/alpaca');
        const { fetchQuotes } = await import('../../lib/yahoo-finance');

        const alpacaResult = await fetchAlpacaQuotes(initialAlpacaMisses);
        
        const trueMissingAlpaca = initialAlpacaMisses.filter(t => {
          const q = alpacaResult.get(t);
          return !q || !q.price || q.price === 0;
        });

        const finalYahooMisses = [...initialYahooMisses, ...trueMissingAlpaca];
        const yahooResult = await fetchQuotes(finalYahooMisses);

        const merged = new Map([...alpacaResult, ...yahooResult]);

        for (const ticker of missingTickers) {
          const q = merged.get(ticker);
          if (q) {
            data[ticker] = q;
            await redis.set(`gidne_quote_${q.symbol}`, JSON.stringify(q), 'EX', 300);
            await redis.sadd('gidne_watched_tickers', q.symbol);
          }
        }
      } catch (fetchErr) {
        console.error('[quotes] Fast fetch failed:', fetchErr);
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

