// src/pages/api/quotes.ts
// 개인 워치리스트용 API — 온디맨드 (Lazy) 서버리스 캐싱
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { redis } from '../../lib/redis';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const tickersRaw = url.searchParams.get('tickers');

  if (!tickersRaw) {
    return new Response(JSON.stringify({ error: 'tickers required' }), { status: 400 });
  }

  // 최대 30개 제한
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

    // [Step 1] Redis MGET으로 모든 티커 동시 조회 시도
    // MGET은 [data1, null, data3...] 형식으로 반환합니다.
    const cachedArray = await redis.mget(...tickers.map(t => `gidne_quote_${t}`));

    // [Step 2] 캐시 히트(Hit)와 미스(Miss) 분류
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const cachedData = cachedArray[i];

      if (cachedData) {
        // Upstash Redis는 객체를 자동 파싱하기도 하므로 체크
        data[ticker] = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      } else {
        missingTickers.push(ticker);
      }
    }

    // [Step 3] 캐시 미스 발생 시에만 Yahoo Finance에서 병렬 호출!
    if (missingTickers.length > 0) {
      console.log(`[Cache Miss] Fetching ${missingTickers.length} tickers from YF...`);
      
      const CHUNK_SIZE = 10;
      const chunks: string[][] = [];
      for (let i = 0; i < missingTickers.length; i += CHUNK_SIZE) {
        chunks.push(missingTickers.slice(i, i + CHUNK_SIZE));
      }

      const chunkResults = await Promise.allSettled(
        chunks.map(async (chunk) => {
          const results = await yahooFinance.quote(chunk);
          return Array.isArray(results) ? results : [results];
        })
      );

      const pipeline = redis.pipeline(); // 다중 SETEX를 위한 파이프라인

      for (const res of chunkResults) {
        if (res.status === 'fulfilled') {
          res.value.forEach(q => {
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

              // 새로 가져온 데이터는 15초(TTL) 세팅으로 파이프라인에 담기
              pipeline.setex(`gidne_quote_${q.symbol}`, 15, JSON.stringify(quoteData));
            }
          });
        }
      }

      // 파이프라인으로 Redis에 일괄 저장 (Non-blocking)
      try {
        await pipeline.exec();
      } catch (err) {
        console.error('[quotes] Redis pipeline error:', err);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5', // 클라우드플레어 인메모리 5초 방어
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[quotes] batch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quotes' }), { status: 500 });
  }
};
