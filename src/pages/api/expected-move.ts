// src/pages/api/expected-move.ts
// Expected Move 계산 — Yahoo Finance 공개 HTTP 엔드포인트 직접 호출
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker) return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });

  const redis = getRedis(context);
  const cacheKey = `gidne_em_${ticker}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    };

    // 시세 + 옵션 데이터 병렬 호출
    const [quoteRes, optionsRes] = await Promise.all([
      fetch(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`, { headers }),
      fetch(`https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}`, { headers }),
    ]);

    if (!quoteRes.ok) throw new Error(`Yahoo quote HTTP ${quoteRes.status}`);
    if (!optionsRes.ok) throw new Error(`Yahoo options HTTP ${optionsRes.status}`);

    const quoteResult = await quoteRes.json();
    const optionsResult = await optionsRes.json();

    const quoteData = quoteResult?.quoteResponse?.result?.[0];
    const price = quoteData?.regularMarketPrice;
    if (!price) throw new Error('No price found');

    const optionChain = optionsResult?.optionChain?.result?.[0];
    if (!optionChain || !optionChain.options || optionChain.options.length === 0) {
      return new Response(JSON.stringify({ error: 'No options data for this symbol' }), { status: 404 });
    }

    const calls = optionChain.options[0].calls || [];
    const puts = optionChain.options[0].puts || [];
    if (calls.length === 0 || puts.length === 0) {
      return new Response(JSON.stringify({ error: 'Incomplete options chain' }), { status: 404 });
    }

    // 1. ATM 스트라이크 찾기
    let closestStrike = calls[0].strike;
    let minDiff = Math.abs(closestStrike - price);
    
    for (const c of calls) {
      const diff = Math.abs(c.strike - price);
      if (diff < minDiff) {
        minDiff = diff;
        closestStrike = c.strike;
      }
    }

    // 2. ATM 콜/풋
    const atmCall = calls.find((c: any) => c.strike === closestStrike);
    const atmPut = puts.find((p: any) => p.strike === closestStrike);

    if (!atmCall || !atmPut) {
      return new Response(JSON.stringify({ error: 'ATM options not found' }), { status: 404 });
    }

    // 3. IV 블렌딩
    const callIv = atmCall.impliedVolatility || 0;
    const putIv = atmPut.impliedVolatility || 0;
    const blendedIv = (callIv + putIv) / 2;

    if (blendedIv === 0) {
      return new Response(JSON.stringify({ error: 'Zero IV' }), { status: 404 });
    }

    // 4. 통계적 IV 모델
    const statDailyEM = price * blendedIv * Math.sqrt(1 / 252);

    // 5. 스트래들 프라이싱
    const callPrice = ((atmCall.bid ?? 0) + (atmCall.ask ?? 0)) / 2 || atmCall.lastPrice || 0;
    const putPrice = ((atmPut.bid ?? 0) + (atmPut.ask ?? 0)) / 2 || atmPut.lastPrice || 0;
    const straddlePrice = callPrice + putPrice;

    const expTimestamp = optionChain.options[0].expirationDate;
    const expirationDate = new Date(expTimestamp * 1000);
    const daysToE = Math.max(1, (expirationDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    const straddleDailyEM = straddlePrice * Math.sqrt(1 / daysToE);

    const finalDailyEM = (statDailyEM + straddleDailyEM) / 2;
    const finalWeeklyEM = finalDailyEM * Math.sqrt(5);
    const finalMonthlyEM = finalDailyEM * Math.sqrt(21);

    const data = {
      price,
      impliedVolatility: blendedIv,
      dailyExpectedMove: finalDailyEM,
      dailyUpper: price + finalDailyEM,
      dailyLower: price - finalDailyEM,
      weeklyExpectedMove: finalWeeklyEM,
      weeklyUpper: price + finalWeeklyEM,
      weeklyLower: price - finalWeeklyEM,
      monthlyExpectedMove: finalMonthlyEM,
      monthlyUpper: price + finalMonthlyEM,
      monthlyLower: price - finalMonthlyEM,
    };

    await redis.set(cacheKey, JSON.stringify(data), { ex: 1800 });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[expected-move] error for ${ticker}:`, err.message);
    return new Response(JSON.stringify({ error: 'Failed to calculate expected move' }), { status: 500 });
  }
};

