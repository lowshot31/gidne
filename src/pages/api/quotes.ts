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

    // 2. 누락된 티커가 있다면, Data Pump 큐에 넣고 기다리지 않고 즉시 Yahoo Finance 에서 병렬로 가져옴 (큐 지연 방지 및 Redis 사용량 절감)
    if (missingTickers.length > 0) {
      const { yahooFinance } = await import('../../lib/yahoo-finance');
      await Promise.all(missingTickers.map(async (ticker) => {
        try {
          const apiTicker = ticker.toUpperCase().endsWith('USDT') ? ticker.toUpperCase().replace('USDT', '-USD') : ticker;
          const q: any = await yahooFinance.quote(apiTicker);
          const formatted = {
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose ?? 0,
            open: q.regularMarketOpen ?? 0,
            dayHigh: q.regularMarketDayHigh ?? 0,
            dayLow: q.regularMarketDayLow ?? 0,
            volume: q.regularMarketVolume ?? 0,
            avgVolume: q.averageDailyVolume3Month ?? 0,
            marketCap: q.marketCap ?? 0,
            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
            fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
            exchange: q.fullExchangeName || q.exchange || '',
            quoteType: q.quoteType || '',
          };
          data[ticker] = formatted;
          // 캐시에 저장 (5분 TTL - SWR 5초 폴링 동안 야후 직접 호출 방지)
          await redis.set(`gidne_quote_${ticker}`, JSON.stringify(formatted), { ex: 300 });
          // 영구 watched 셋에 등록 → data-pump 15초 주기에서 AAPL처럼 함께 갱신됨
          // gidne_queue_quote 큐는 처리 후 SREM으로 삭제되므로 지속 갱신 불가
          await redis.sadd('gidne_watched_tickers', ticker);
        } catch (e) {
          console.error(`[quotes fallback] fetch failed for ${ticker}`, e);
        }
      }));
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

