// src/pages/api/quotes.ts
// 배치 시세 API — 여러 종목을 한 번의 요청으로 조회
import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { cache } from '../../lib/cache';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const tickersRaw = url.searchParams.get('tickers');

  if (!tickersRaw) {
    return new Response(JSON.stringify({ error: 'tickers required' }), { status: 400 });
  }

  // 최대 20개 제한 (과도한 요청 방지)
  const tickers = tickersRaw
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0 && t.length <= 20)
    .slice(0, 20);

  if (tickers.length === 0) {
    return new Response(JSON.stringify({ error: 'no valid tickers' }), { status: 400 });
  }

  // 캐시 확인 — 전체 배치 키
  const cacheKey = `quotes_batch_${tickers.sort().join(',')}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const CHUNK_SIZE = 10;

    // 청크로 분할 → 병렬 요청
    const chunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
      chunks.push(tickers.slice(i, i + CHUNK_SIZE));
    }

    const chunkResults = await Promise.allSettled(
      chunks.map(async (chunk) => {
        const results = await yahooFinance.quote(chunk);
        return Array.isArray(results) ? results : [results];
      })
    );

    const data: Record<string, any> = {};
    for (const res of chunkResults) {
      if (res.status === 'fulfilled') {
        res.value.forEach(q => {
          if (q && q.symbol) {
            data[q.symbol] = {
              symbol: q.symbol,
              name: q.shortName || q.longName || q.symbol,
              price: q.regularMarketPrice ?? 0,
              change: q.regularMarketChange ?? 0,
              changePercent: q.regularMarketChangePercent ?? 0,
              previousClose: q.regularMarketPreviousClose ?? 0,
              volume: q.regularMarketVolume ?? 0,
              exchange: q.fullExchangeName || q.exchange || '',
            };
          }
        });
      } else {
        console.error('[quotes] chunk failed:', res.reason);
      }
    }

    cache.set(cacheKey, data, 5_000); // 5초 캐시

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[quotes] batch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quotes' }), { status: 500 });
  }
};
