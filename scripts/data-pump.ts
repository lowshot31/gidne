import 'dotenv/config';
import { fetchQuotes, yahooFinance } from '../src/lib/yahoo-finance';
import { fetchAlpacaQuotes } from '../src/lib/alpaca';
import { buildSectorData } from '../src/lib/indicators';
import { calculateMarketPulse } from '../src/lib/market-pulse';
import {
  getAllTickers,
  TICKER_STRIP,
  MACRO_TICKERS,
  INDICES,
  SECTOR_ETFS,
  SECTOR_HOLDINGS,
  isUSMarketOpen,
  getPollingInterval,
} from '../src/lib/tickers';
import { Redis } from 'ioredis';
import type { MarketDataResponse, TickerQuote, MacroData, IndexQuote } from '../src/lib/types';

const redis = new Redis(process.env.REDIS_URL || '');

const CHART_TICKERS = [
  ...SECTOR_ETFS.map(t => t.ticker),
  ...INDICES.map(t => t.ticker),
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
  'BTC-USD', 'ETH-USD',
];

const EVENT_TRANSLATIONS: Record<string, string> = {
  'CPI': '소비자물가지수(CPI)',
  'Core CPI': '근원 소비자물가지수(CPI)',
  'PPI': '생산자물가지수(PPI)',
  'Core PPI': '근원 생산자물가지수(PPI)',
  'Interest Rate Decision': '기준금리 결정',
  'Federal Funds Rate': '연준(Fed) 기준금리',
  'Non-Farm Employment Change': '비농업 고용지수',
  'Unemployment Rate': '실업률',
  'GDP': '국내총생산(GDP)',
  'Retail Sales': '소매판매',
  'Core Retail Sales': '근원 소매판매',
  'ISM Manufacturing PMI': 'ISM 제조업 PMI',
  'ISM Services PMI': 'ISM 서비스업 PMI',
  'Initial Jobless Claims': '신규 실업수당 청구건수',
  'Continuing Jobless Claims': '연속 실업수당 청구건수',
  'FOMC Statement': 'FOMC 성명서 발표',
  'FOMC Press Conference': '파월 의장 기자회견',
  'JOLTs Job Openings': 'JOLTs 구인배율',
  'Chicago PMI': '시카고 PMI',
  'CB Consumer Confidence': 'CB 소비자신뢰지수',
  'Michigan Consumer Sentiment': '미시간대 소비자심리지수',
};

function translateEvent(title: string): string {
  for (const [eng, kor] of Object.entries(EVENT_TRANSLATIONS)) {
    if (title.includes(eng)) return title.replace(eng, kor);
  }
  if (title.toLowerCase().includes('fed chair') && title.toLowerCase().includes('speaks')) {
    return '연준(Fed) 의장 연설';
  }
  return title;
}

// ========== 1. 메인 대시보드 데이터 펌프 ==========
async function pumpMarketData() {
  try {
    const allTickers = getAllTickers();
    
    // Alpaca 무료 티어(IEX)는 ETF 거래량이 매우 적어 데이터가 누락되는 현상(0.00%) 발생.
    // 따라서 ETF들은 Yahoo Finance로 강제 라우팅.
    const ETF_TICKERS = [...SECTOR_ETFS.map(t => t.ticker), 'SPY', 'QQQ', 'HYG', 'LQD', 'TLT'];
    
    const alpacaTickers = allTickers.filter(t => 
      (/^[A-Z]+$/.test(t) || t.includes('-USD')) && !ETF_TICKERS.includes(t)
    );
    const yahooTickers = allTickers.filter(t => !alpacaTickers.includes(t));

    const [alpacaQuotes, yahooQuotes] = await Promise.all([
      fetchAlpacaQuotes(alpacaTickers),
      fetchQuotes(yahooTickers)
    ]);

    const quotes = new Map([...alpacaQuotes, ...yahooQuotes]);

    const tickerStrip: TickerQuote[] = TICKER_STRIP.map(t => {
      const q = quotes.get(t.ticker);
      return { symbol: t.ticker, name: t.name, price: q?.price ?? 0, change: q?.change ?? 0, changePercent: q?.changePercent ?? 0, previousClose: q?.previousClose ?? 0 };
    });

    const sectors = buildSectorData(quotes);
    const macro: MacroData[] = MACRO_TICKERS.map(t => {
      const q = quotes.get(t.ticker);
      return { ticker: t.ticker, name: t.name, category: t.category, price: q?.price ?? 0, change: q?.change ?? 0, changePercent: q?.changePercent ?? 0 };
    });

    const indices: IndexQuote[] = INDICES.map(t => {
      const q = quotes.get(t.ticker);
      return { symbol: t.ticker, name: t.name, price: q?.price ?? 0, change: q?.change ?? 0, changePercent: q?.changePercent ?? 0, previousClose: q?.previousClose ?? 0, region: t.region, flag: t.flag };
    });

    const vixQuote = quotes.get('^VIX') ?? undefined;
    const marketPulse = calculateMarketPulse({ sectors, vixQuote });

    const response: MarketDataResponse = {
      tickerStrip, sectors, marketPulse, macro, indices,
      meta: { isMarketOpen: isUSMarketOpen(), lastUpdated: new Date().toISOString(), pollingInterval: getPollingInterval() },
    };

    await redis.set('gidne_market_data', JSON.stringify(response), 'EX', 60);

    const msetPayload: Record<string, string> = {};
    for (const [ticker, q] of quotes.entries()) {
      if (q) {
         msetPayload[`gidne_quote_${ticker}`] = JSON.stringify({
          symbol: ticker, name: q.name || ticker, price: q.price ?? 0, change: q.change ?? 0, changePercent: q.changePercent ?? 0, previousClose: q.previousClose ?? 0,
          open: q.open, dayHigh: q.dayHigh, dayLow: q.dayLow, volume: q.volume, avgVolume: q.avgVolume, marketCap: q.marketCap, fiftyTwoWeekHigh: q.fiftyTwoWeekHigh, fiftyTwoWeekLow: q.fiftyTwoWeekLow, exchange: q.exchange, quoteType: q.quoteType
        });
      }
    }
    if (Object.keys(msetPayload).length > 0) {
      await redis.mset(msetPayload);
    }

    // gidne_watched_tickers: 사용자 커스텀 워치리스트 종목 (FDX, CRWD 등)
    // api/quotes에서 최초 패치 시 이 셋에 등록 → 이후 15초마다 AAPL처럼 자동 갱신
    const watchedTickers = await redis.smembers('gidne_watched_tickers');
    if (watchedTickers && watchedTickers.length > 0) {
      console.log(`[Pump] 👁️ Refreshing ${watchedTickers.length} watched: ${watchedTickers.slice(0, 5).join(', ')}...`);
      try {
        const watchedAlpaca = watchedTickers.filter(t => /^[A-Z]+$/.test(t) || t.includes('-USD'));
        const watchedYahoo = watchedTickers.filter(t => !watchedAlpaca.includes(t));

        const [wAlpacaQuotes, wYahooQuotes] = await Promise.all([
          fetchAlpacaQuotes(watchedAlpaca),
          fetchQuotes(watchedYahoo)
        ]);
        const watchedQuotes = new Map([...wAlpacaQuotes, ...wYahooQuotes]);
        const watchedMsetPayload: Record<string, string> = {};
        for (const [ticker, q] of watchedQuotes.entries()) {
          if (q) {
            watchedMsetPayload[`gidne_quote_${ticker}`] = JSON.stringify({
              symbol: ticker, name: q.name || ticker, price: q.price ?? 0,
              change: q.change ?? 0, changePercent: q.changePercent ?? 0,
              previousClose: q.previousClose ?? 0,
              open: q.open, dayHigh: q.dayHigh, dayLow: q.dayLow, volume: q.volume, avgVolume: q.avgVolume, marketCap: q.marketCap, fiftyTwoWeekHigh: q.fiftyTwoWeekHigh, fiftyTwoWeekLow: q.fiftyTwoWeekLow, exchange: q.exchange, quoteType: q.quoteType
            });
          }
        }
        if (Object.keys(watchedMsetPayload).length > 0) {
          await redis.mset(watchedMsetPayload);
        }
      } catch (e) {
        console.error('[Pump] Watched tickers refresh error:', e);
      }
    }
  } catch (error) {
    console.error('[Pump] Market data error:', error);
  }
}

// ========== 1.5. 섹터 홀딩스 펌프 (60초 주기) ==========
async function pumpHoldingsData() {
  try {
    const holdingTickers = new Set<string>();
    Object.values(SECTOR_HOLDINGS).forEach(stocks => stocks.forEach(s => holdingTickers.add(s.ticker)));
    
    // 개별 종목 시세 패치 (전부 미국 주식이므로 Alpaca 사용)
    const quotes = await fetchAlpacaQuotes(Array.from(holdingTickers));
    
    const holdings: Record<string, TickerQuote[]> = {};
    for (const [sectorId, stocks] of Object.entries(SECTOR_HOLDINGS)) {
      holdings[sectorId] = stocks.map(t => {
        const q = quotes.get(t.ticker);
        return { symbol: t.ticker, name: t.name, price: q?.price ?? 0, change: q?.change ?? 0, changePercent: q?.changePercent ?? 0, previousClose: q?.previousClose ?? 0 };
      });
    }

    // gidne_holdings_v2 키에 별도 저장 (만료시간 120초)
    await redis.set('gidne_holdings_v2', JSON.stringify(holdings), 'EX', 120);
    
    // 이 개별 종목들도 quote로 저장해두면 좋음
    const holdingsMsetPayload: Record<string, string> = {};
    for (const [ticker, q] of quotes.entries()) {
      if (q) {
         holdingsMsetPayload[`gidne_quote_${ticker}`] = JSON.stringify({
          symbol: ticker, name: q.name || ticker, price: q.price ?? 0, change: q.change ?? 0, changePercent: q.changePercent ?? 0, previousClose: q.previousClose ?? 0,
          open: q.open, dayHigh: q.dayHigh, dayLow: q.dayLow, volume: q.volume, avgVolume: q.avgVolume, marketCap: q.marketCap, fiftyTwoWeekHigh: q.fiftyTwoWeekHigh, fiftyTwoWeekLow: q.fiftyTwoWeekLow, exchange: q.exchange, quoteType: q.quoteType
        });
      }
    }
    if (Object.keys(holdingsMsetPayload).length > 0) {
      await redis.mset(holdingsMsetPayload);
    }
  } catch (error) {
    console.error('[Pump] Holdings data error:', error);
  }
}

// ========== 2. 온디맨드 큐(Demand Queue) 처리기 ==========
async function pumpDemandQueues(): Promise<boolean> {
  let processedAny = false;

  // 개별 티커 단위 처리
  const processQueue = async (queueName: string, cachePrefix: string, fetchFn: (t: string) => Promise<any>, ttl: number) => {
    const tickers = await redis.smembers(queueName);
    if (!tickers || tickers.length === 0) return;
    
    processedAny = true;
    console.log(`[Pump:Queue] Processing ${tickers.length} demands from ${queueName}`);
    const pipeline = redis.pipeline();
    
    for (const ticker of tickers) {
      try {
        const data = await fetchFn(ticker);
        pipeline.set(`${cachePrefix}${ticker}`, JSON.stringify(data), 'EX', ttl);
      } catch (err: any) {
        console.error(`[Pump:Queue] Failed ${queueName} for ${ticker}: ${err.message}`);
        if (err.message?.includes('429') || err.message?.includes('Too Many')) {
          console.warn('[Pump] ⚠️ 야후 429 에러 감지! 15초간 펌프 강제 휴식...');
          await new Promise(r => setTimeout(r, 15000));
          break; // 현재 큐 진행 중단
        }
      }
      pipeline.srem(queueName, ticker);
      // 폭주 방지: 큐 아이템 간 0.5초 딜레이 (Yahoo 차단 방어)
      await new Promise(r => setTimeout(r, 500));
    }
    await pipeline.exec();
  };

  // 1) Quotes (워치리스트) 처리
  await processQueue('gidne_queue_quote', 'gidne_quote_', async (ticker: string) => {
    // 1. 먼저 Alpaca 지원 포맷인지 확인
    if (/^[A-Z]+$/.test(ticker) || ticker.includes('-USD')) {
      const alpacaResult = await fetchAlpacaQuotes([ticker]);
      const q = alpacaResult.get(ticker);
      if (q) return q; // 알피카에서 찾았으면 반환
    }

    // 2. Alpaca 지원 외(지수 등)이거나 Alpaca에서 실패한 경우 Yahoo Fallback
    const apiTicker = ticker.toUpperCase().endsWith('USDT') ? ticker.toUpperCase().replace('USDT', '-USD') : ticker;
    const q: any = await yahooFinance.quote(apiTicker);
    if (!q) throw new Error('Yahoo API returned empty quote');
    return {
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
  }, 60);

  // 2) 요약(Summary) 데이터 처리
  await processQueue('gidne_queue_summary', 'gidne_summary_v2_', async (ticker: string) => {
    const apiTicker = ticker.toUpperCase().endsWith('USDT') ? ticker.toUpperCase().replace('USDT', '-USD') : ticker;
    try {
      const summary: any = await yahooFinance.quoteSummary(apiTicker, {
        modules: ['assetProfile', 'financialData', 'defaultKeyStatistics', 'summaryDetail', 'recommendationTrend'],
      });
      return {
        profile: {
          sector: summary.assetProfile?.sector || 'Unknown',
          industry: summary.assetProfile?.industry || 'Unknown',
          website: summary.assetProfile?.website || '',
          description: summary.assetProfile?.longBusinessSummary || '',
          employees: summary.assetProfile?.fullTimeEmployees || 0,
        },
        financials: {
          targetHigh: summary.financialData?.targetHighPrice || 0,
          targetLow: summary.financialData?.targetLowPrice || 0,
          targetMean: summary.financialData?.targetMeanPrice || 0,
          recommendationKey: summary.financialData?.recommendationKey || 'none',
          numberOfAnalysts: summary.financialData?.numberOfAnalystOpinions || 0,
          totalRevenue: summary.financialData?.totalRevenue || 0,
          ebitda: summary.financialData?.ebitda || 0,
          debtToEquity: summary.financialData?.debtToEquity || 0,
          profitMargins: summary.financialData?.profitMargins || 0,
          operatingMargins: summary.financialData?.operatingMargins || 0,
          returnOnEquity: summary.financialData?.returnOnEquity || 0,
        },
        statistics: {
          trailingPE: summary.summaryDetail?.trailingPE || 0,
          forwardPE: summary.defaultKeyStatistics?.forwardPE || 0,
          priceToBook: summary.defaultKeyStatistics?.priceToBook || 0,
          beta: summary.defaultKeyStatistics?.beta || 0,
          shortRatio: summary.defaultKeyStatistics?.shortRatio || 0,
          shortPercentOfFloat: summary.defaultKeyStatistics?.shortPercentOfFloat || 0,
          dividendYield: summary.summaryDetail?.dividendYield || summary.summaryDetail?.trailingAnnualDividendYield || 0,
        },
        trends: summary.recommendationTrend?.trend || [],
        filings: summary.secFilings?.filings || []
      };
    } catch (e: any) {
      console.warn(`[Pump] quoteSummary for ${ticker} threw error. Returning empty defaults.`, e.message);
      return {
        profile: { sector: 'Unknown', industry: 'Unknown', website: '', description: 'Data not available', employees: 0 },
        financials: { targetHigh: 0, targetLow: 0, targetMean: 0, recommendationKey: 'none', numberOfAnalysts: 0, totalRevenue: 0, ebitda: 0, debtToEquity: 0, profitMargins: 0, operatingMargins: 0, returnOnEquity: 0 },
        statistics: { trailingPE: 0, forwardPE: 0, priceToBook: 0, beta: 0, shortRatio: 0, shortPercentOfFloat: 0, dividendYield: 0 },
        trends: [], filings: []
      };
    }
  }, 3600); // 1hr

  // 3) Expected Move (임플라이드 볼라틸리티) 데이터 처리
  await processQueue('gidne_queue_em', 'gidne_em_', async (ticker: string) => {
    const apiTicker = ticker.toUpperCase().endsWith('USDT') ? ticker.toUpperCase().replace('USDT', '-USD') : ticker;
    const quote: any = await yahooFinance.quote(apiTicker);
    const price = quote.regularMarketPrice;
    if (!price) throw new Error('No price found');

    const optionsResponse: any = await yahooFinance.options(apiTicker);
    if (!optionsResponse || !optionsResponse.options || optionsResponse.options.length === 0) {
      throw new Error('No options data');
    }
    const closestExpiration = optionsResponse.options[0];
    const calls = closestExpiration.calls || [];
    const puts = closestExpiration.puts || [];

    // Find ATM strike (closest to current price)
    let closestStrike = -1;
    let minDiff = Infinity;
    const allStrikes = [...new Set([...calls.map((c: any) => c.strike), ...puts.map((p: any) => p.strike)])];
    for (const strike of allStrikes) {
      const diff = Math.abs((strike as number) - price);
      if (diff < minDiff) {
        minDiff = diff;
        closestStrike = strike as number;
      }
    }

    const atmCall = calls.find((c: any) => c.strike === closestStrike);
    const atmPut = puts.find((p: any) => p.strike === closestStrike);
    if (!atmCall || !atmPut) throw new Error('ATM missing');

    const blendedIv = ((atmCall.impliedVolatility || 0) + (atmPut.impliedVolatility || 0)) / 2;
    const callPrice = ((atmCall.bid ?? 0) + (atmCall.ask ?? 0)) / 2 || atmCall.lastPrice || 0;
    const putPrice = ((atmPut.bid ?? 0) + (atmPut.ask ?? 0)) / 2 || atmPut.lastPrice || 0;

    const expirationDate = optionsResponse.expirationDates && optionsResponse.expirationDates.length > 0 
      ? new Date(optionsResponse.expirationDates[0] * 1000) 
      : new Date();
    const daysToE = Math.max(1, (expirationDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    
    // stat + straddle blend
    const statDailyEM = price * blendedIv * Math.sqrt(1 / 252);
    const statWeeklyEM = price * blendedIv * Math.sqrt(5 / 252);
    const statMonthlyEM = price * blendedIv * Math.sqrt(21 / 252);

    const straddleDailyEM = (callPrice + putPrice) * Math.sqrt(1 / daysToE);
    const straddleWeeklyEM = (callPrice + putPrice) * Math.sqrt(5 / daysToE);
    const straddleMonthlyEM = (callPrice + putPrice) * Math.sqrt(21 / daysToE);

    const finalDailyEM = (statDailyEM + straddleDailyEM) / 2;
    const finalWeeklyEM = (statWeeklyEM + straddleWeeklyEM) / 2;
    const finalMonthlyEM = (statMonthlyEM + straddleMonthlyEM) / 2;

    return {
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
  }, 1800);

  // 4) 수익률(Returns 1W, 1M) 데이터 처리
  await processQueue('gidne_queue_returns', 'gidne_ret_v2_', async (ticker: string) => {
    const apiTicker = ticker.toUpperCase().endsWith('USDT') ? ticker.toUpperCase().replace('USDT', '-USD') : ticker;
    const period1 = new Date(); 
    period1.setMonth(period1.getMonth() - 2); // 넉넉히 2달치 (1M 계산을 위해)
    const chart: any = await yahooFinance.chart(apiTicker, { period1, interval: '1d' as any });
    
    const quotes = chart.quotes.filter((q: any) => q.close !== null && q.close !== undefined);
    if (quotes.length === 0) throw new Error('No historical quotes');

    const latest = quotes[quotes.length - 1].close;
    
    // 1W (약 5거래일 전)
    const idx1W = Math.max(0, quotes.length - 6);
    const price1W = quotes[idx1W].close || latest;
    
    // 1M (약 21거래일 전)
    const idx1M = Math.max(0, quotes.length - 22);
    const price1M = quotes[idx1M].close || latest;

    const change1W = ((latest - price1W) / price1W) * 100;
    const change1M = ((latest - price1M) / price1M) * 100;

    return { change1W, change1M };
  }, 14400); // 4 hours TTL

  return processedAny;
}

// ========== 3. 기타 배치 (차트, 캘린더) ==========
async function pumpChartData() {
  for (const ticker of CHART_TICKERS) {
    try {
      const cacheKey = `gidne_chart_${ticker}_1d`;
      if (await redis.exists(cacheKey)) continue;

      const period1 = new Date(); period1.setMonth(period1.getMonth() - 6);
      const result: any = await yahooFinance.chart(ticker, { period1, interval: '1d' as any });
      
      const chartData = result.quotes
        .filter((q: any) => q.close !== null && q.close !== undefined)
        .map((q: any) => ({ time: q.date.toISOString().split('T')[0], open: q.open, high: q.high, low: q.low, close: q.close }));

      await redis.set(cacheKey, JSON.stringify(chartData), 'EX', 300);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {}
  }
}

async function pumpCalendar() {
  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9',
      }
    });
    if (!response.ok) return;
    const xml = await response.text();
    const eventsPattern = /<event>([\s\S]*?)<\/event>/g;
    const events: any[] = [];
    let match;
    while ((match = eventsPattern.exec(xml)) !== null) {
      const eventXml = match[1];
      const extract = (tag: string) => { 
        const m = eventXml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i')) || 
                  eventXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i')); 
        return m ? m[1].trim() : ''; 
      };
      const impact = extract('impact');
      const country = extract('country');

      if ((impact === 'High' || impact === 'Medium') && ['USD', 'EUR', 'GBP', 'JPY', 'CNY'].includes(country)) {
        events.push({
          id: Math.random().toString(36).substring(2, 11),
          title: translateEvent(extract('title')), // CDATA가 정제된 후 한글 번역
          country: country === 'USD' ? 'US' : country === 'EUR' ? 'EU' : country === 'GBP' ? 'GB' : country === 'JPY' ? 'JP' : 'CN',
          date: extract('date'), time: extract('time'), impact: impact.toLowerCase(), forecast: extract('forecast') || '-', previous: extract('previous') || '-'
        });
      }
    }
    await redis.set('gidne_calendar_v2', JSON.stringify(events.slice(0, 15)), 'EX', 3600);
  } catch (err) {}
}

// ========== Main Loop ==========
async function main() {
  console.log('[Pump] 🚀 Data Pump Bot initialized.');
  await pumpCalendar();
  await pumpMarketData(); // 즉시 1회 실행하여 UI 표시 준비
  await pumpHoldingsData(); // 즉시 1회 실행
  await pumpChartData();

  let lastMarketPump = Date.now();
  let lastHoldingsPump = Date.now();
  let lastChartPump = Date.now();
  let lastCalendarPump = Date.now();

  const POLLING_INTERVAL = getPollingInterval(); // 보통 15000ms

  let lastQueuePump = Date.now();
  let currentPollDelay = 1000; // 초기 큐 폴링 딜레이
  const MAX_POLL_DELAY = 1500; // 큐가 빌 경우 최대 대기 시간 (1.5초 - UI 반응성 최우선)

  while (true) {
    const now = Date.now();

    // 1. 적응형 큐 폴링 (Adaptive Polling: 하드 제한 방어 & 실시간성 확보)
    if (now - lastQueuePump >= currentPollDelay) {
      lastQueuePump = now;
      try {
        const didWork = await pumpDemandQueues();
        if (didWork) {
          // 큐에 처리할 일이 있었다면, 대기 시간을 즉시 단축
          currentPollDelay = 2000; 
        } else {
          // 큐가 비어있다면 대기 시간을 점진적으로 늘림 (최대 10초 대기)
          currentPollDelay = Math.min(currentPollDelay * 1.5, MAX_POLL_DELAY);
        }
      } catch (e) {
        console.error('[Pump] Demand Queue error:', e);
      }
    }
    
    // 2. 주기적 마켓데이터 전체 펌프 (폴링 인터벌, 약 15초)
    if (now - lastMarketPump >= POLLING_INTERVAL) {
      lastMarketPump = now;
      pumpMarketData().catch(e => console.error(e)); // Non-blocking
    }
    
    // 2.5. 홀딩스 데이터 (60초)
    if (now - lastHoldingsPump >= 60000) {
      lastHoldingsPump = now;
      pumpHoldingsData().catch(e => console.error(e)); // Non-blocking
    }

    // 3. 차트 (5분)
    if (now - lastChartPump >= 300000) {
      lastChartPump = now;
      pumpChartData().catch(e => console.error(e)); // Non-blocking
    }
    
    // 4. 캘린더 (1시간)
    if (now - lastCalendarPump >= 3600000) {
      lastCalendarPump = now;
      pumpCalendar().catch(e => console.error(e)); // Non-blocking
    }

    await new Promise(r => setTimeout(r, 200)); // 항상 0.2초 대기 (CPU 폭주 방지)
  }
}

main();

