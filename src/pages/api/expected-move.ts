import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { cache } from '../../lib/cache';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker) return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });

  const cacheKey = `em_v2_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const quote = await yahooFinance.quote(ticker);
    const price = quote.regularMarketPrice;
    if (!price) throw new Error('No price found');

    const options = await yahooFinance.options(ticker);
    
    if (!options || !options.options || options.options.length === 0) {
       return new Response(JSON.stringify({ error: 'No options data for this symbol' }), { status: 404 });
    }

    const calls = options.options[0].calls || [];
    const puts = options.options[0].puts || [];
    if (calls.length === 0 || puts.length === 0) {
      return new Response(JSON.stringify({ error: 'Incomplete options chain' }), { status: 404 });
    }

    // 1. 가장 가까운 ATM(At-The-Money) 스트라이크 찾기
    let closestStrike = calls[0].strike;
    let minDiff = Math.abs(closestStrike - price);
    
    for (const c of calls) {
      const diff = Math.abs(c.strike - price);
      if (diff < minDiff) {
        minDiff = diff;
        closestStrike = c.strike;
      }
    }

    // 2. ATM 콜, 풋 객체 추출
    const atmCall = calls.find(c => c.strike === closestStrike);
    const atmPut = puts.find(p => p.strike === closestStrike);

    if (!atmCall || !atmPut) {
       return new Response(JSON.stringify({ error: 'ATM options not found' }), { status: 404 });
    }

    // 3. 내재변동성(IV) 블렌딩 (Call IV와 Put Skew를 모두 반영하기 위해 평균 사용)
    const callIv = atmCall.impliedVolatility || 0;
    const putIv = atmPut.impliedVolatility || 0;
    const blendedIv = (callIv + putIv) / 2;

    if (blendedIv === 0) {
      return new Response(JSON.stringify({ error: 'Zero IV logic error' }), { status: 404 });
    }

    // 4. 모델 A: 통계적 내재변동성 모델 (1-SD, Black-Scholes 기반)
    const statDailyEM = price * blendedIv * Math.sqrt(1 / 252);
    // const statWeeklyEM = price * blendedIv * Math.sqrt(5 / 252); // Not used

    // 5. 모델 B: 실전 스트래들 프라이싱 (TastyTrade 방식)
    // 콜 중간가격 + 풋 중간가격 (시장이 실제로 돈을 걸고 있는 프리미엄 합)
    const callPrice = ((atmCall.bid ?? 0) + (atmCall.ask ?? 0)) / 2 || atmCall.lastPrice || 0;
    const putPrice = ((atmPut.bid ?? 0) + (atmPut.ask ?? 0)) / 2 || atmPut.lastPrice || 0;
    const straddlePrice = callPrice + putPrice;

    // 만기일까지 남은 거래일(DTE) 계산을 통한 역산
    const expDateRaw = options.options[0].expirationDate;
    const expirationDate = expDateRaw instanceof Date ? expDateRaw : new Date(Number(expDateRaw) * 1000);
    const today = new Date();
    const daysToE = Math.max(1, (expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    // 스트래들은 기본적으로 해당 만기까지의 범위를 의미하므로, 하루(1-day)로 축소하려면 루트 일수로 나눔
    const straddleDailyEM = straddlePrice * Math.sqrt(1 / daysToE);

    // 두 가지 모델을 평균 내어 극단적 오차를 방지 (프리미엄 쏠림 교정)
    const finalDailyEM = (statDailyEM + straddleDailyEM) / 2;
    const finalWeeklyEM = finalDailyEM * Math.sqrt(5);
    const finalMonthlyEM = finalDailyEM * Math.sqrt(21); // 한 달은 약 21 거래일

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

    cache.set(cacheKey, data, 1800_000); // 30 minutes cache
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[expected-move error] for ${ticker}:`, err.message);
    return new Response(JSON.stringify({ error: 'Failed to calculate expected move' }), { status: 500 });
  }
};
