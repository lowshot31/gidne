export const GET = async () => {
  try {
    // 1. Upbit BTC 가격 (김프 계산용)
    const upbitRes = fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC').then(r => r.json());
    
    // 2. Binance 펀딩레이트 (과열 지표)
    const fundingRes = fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT').then(r => r.json());
    
    // 3. Binance 글로벌 롱/숏 비율 (시장 심리)
    const lsRes = fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1').then(r => r.json());

    // 4. Yahoo Finance: 환율 (USD/KRW) 및 글로벌 BTC 시세
    // _t 파라미터로 캐시 버스팅
    const yfRes = fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=KRW=X,BTC-USD&_t=${Date.now()}`).then(r => r.json());

    const [upbit, funding, lsRates, yfData] = await Promise.all([upbitRes, fundingRes, lsRes, yfRes]);

    const upbitPrice = upbit[0]?.trade_price || 0;
    const binanceFundingRate = parseFloat(funding.lastFundingRate || '0') * 100; // %로 변환
    const longShortRatio = parseFloat(lsRates[0]?.longShortRatio || '1');
    
    const quotes = yfData.quoteResponse.result;
    const krwRateInfo = quotes.find((q: any) => q.symbol === 'KRW=X');
    const btcGlobalInfo = quotes.find((q: any) => q.symbol === 'BTC-USD');
    
    const usdKrwRate = krwRateInfo?.regularMarketPrice || 1350;
    const btcGlobalPrice = btcGlobalInfo?.regularMarketPrice || 60000;

    // 김치 프리미엄 계산
    const kimp = ((upbitPrice / (btcGlobalPrice * usdKrwRate)) - 1) * 100;

    return new Response(JSON.stringify({
      upbitPrice,
      usdKrwRate,
      btcGlobalPrice,
      kimp,
      binanceFundingRate,
      longShortRatio,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
