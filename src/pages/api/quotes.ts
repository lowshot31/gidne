// src/pages/api/quotes.ts
// 개인 워치리스트용 API — Yahoo Finance 공개 HTTP 엔드포인트 직접 호출
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
    const missingTickers: string[] = [];

    // [Step 1] Redis MGET으로 모든 티커 동시 조회
    const redis = getRedis(context);
    const cachedArray = await redis.mget(...tickers.map(t => `gidne_quote_${t}`));

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const cachedData = cachedArray[i];

      if (cachedData) {
        data[ticker] = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      } else {
        missingTickers.push(ticker);
      }
    }

    // [Step 2] 캐시 미스 → Yahoo Finance 공개 HTTP 엔드포인트로 직접 호출
    if (missingTickers.length > 0) {
      console.log(`[Cache Miss] Fetching ${missingTickers.length} tickers via HTTP...`);

      const yfUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(missingTickers.join(','))}`;
      const res = await fetch(yfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const result = await res.json();
        const quotes = result?.quoteResponse?.result || [];
        const pipeline = redis.pipeline();

        for (const q of quotes) {
          if (q && q.symbol) {
            const quoteData = {
              symbol: q.symbol,
              name: q.shortName || q.longName || q.symbol,
              price: q.regularMarketPrice ?? 0,
              change: q.regularMarketChange ?? 0,
              changePercent: q.regularMarketChangePercent ?? 0,
              previousClose: q.regularMarketPreviousClose ?? 0,
              volume: q.regularMarketVolume ?? 0,
              exchange: q.fullExchangeName || q.exchange || '',
            };
            data[q.symbol] = quoteData;
            pipeline.set(`gidne_quote_${q.symbol}`, JSON.stringify(quoteData), { ex: 15 });
          }
        }

        try {
          await pipeline.exec();
        } catch (err) {
          console.error('[quotes] Redis pipeline error:', err);
        }
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

