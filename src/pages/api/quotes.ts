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

    // 2. 캐시 미스 → Yahoo Finance REST API (v8)를 fetch()로 직접 호출
    //    yahoo-finance2 Node.js 패키지는 Cloudflare Workers에서 사용 불가하므로
    //    Workers 네이티브 fetch()를 사용하여 호환성을 확보합니다.
    if (missingTickers.length > 0) {
      try {
        const symbols = missingTickers.join(',');
        const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&crumb=`;
        
        const res = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (res.ok) {
          const json: any = await res.json();
          const results = json?.quoteResponse?.result || [];
          
          for (const q of results) {
            if (!q || !q.symbol) continue;
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
            
            // 요청 티커와 반환 심볼 모두에 매핑
            data[q.symbol] = formatted;
            const reqTicker = missingTickers.find(t => t === q.symbol || 
              (t === 'KRW=X' && q.symbol === 'USDKRW=X'));
            if (reqTicker && reqTicker !== q.symbol) {
              data[reqTicker] = formatted;
            }
            
            // 캐시 저장 (5분 TTL)
            await redis.set(`gidne_quote_${q.symbol}`, JSON.stringify(formatted), { ex: 300 });
            await redis.sadd('gidne_watched_tickers', q.symbol);
          }
        } else {
          console.error(`[quotes] Yahoo API returned ${res.status}`);
        }
      } catch (fetchErr) {
        console.error('[quotes] Yahoo REST fetch failed:', fetchErr);
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

