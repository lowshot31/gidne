// scripts/data-pump.ts
import { fetchQuotes } from '../src/lib/yahoo-finance';
import { buildSectorData } from '../src/lib/indicators';
import { calculateMarketPulse } from '../src/lib/market-pulse';
import {
  getAllTickers,
  TICKER_STRIP,
  MACRO_TICKERS,
  INDICES,
  SECTOR_ETFS,
  isUSMarketOpen,
  getPollingInterval,
} from '../src/lib/tickers';
import { Redis } from '@upstash/redis';
import YahooFinance from 'yahoo-finance2';
import type { MarketDataResponse, TickerQuote, MacroData } from '../src/lib/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const yahooFinance = new YahooFinance();

// 차트 데이터를 캐싱할 주요 종목 리스트
const CHART_TICKERS = [
  ...SECTOR_ETFS.map(t => t.ticker),
  ...INDICES.map(t => t.ticker),
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
  'BTC-USD', 'ETH-USD',
];

// ========== 1. 메인 대시보드 데이터 펌프 ==========
async function pumpMarketData() {
  console.log(`[Pump] Starting market data cycle at ${new Date().toISOString()}`);
  
  try {
    const allTickers = getAllTickers();
    const quotes = await fetchQuotes(allTickers);

    const tickerStrip: TickerQuote[] = TICKER_STRIP.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    const sectors = buildSectorData(quotes);

    const macro: MacroData[] = MACRO_TICKERS.map(t => {
      const q = quotes.get(t.ticker);
      return {
        ticker: t.ticker,
        name: t.name,
        category: t.category,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
      };
    });

    const indices: TickerQuote[] = INDICES.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    const vixQuote = quotes.get('^VIX') ?? undefined;
    const marketPulse = calculateMarketPulse({ sectors, vixQuote });

    const response: MarketDataResponse = {
      tickerStrip,
      sectors,
      marketPulse,
      macro,
      indices,
      meta: {
        isMarketOpen: isUSMarketOpen(),
        lastUpdated: new Date().toISOString(),
        pollingInterval: getPollingInterval(),
      },
    };

    const jsonStr = JSON.stringify(response);
    await redis.set('gidne_market_data', jsonStr, { ex: 20 });
    console.log(`[Pump] Market data uploaded: ${jsonStr.length} chars`);

    // 개별 종목 시세도 Redis에 미리 적재 (quote.ts 및 quotes.ts용)
    const pipeline = redis.pipeline();
    for (const [ticker, q] of quotes.entries()) {
      if (q) {
        const quoteData = {
          symbol: ticker,
          name: q.name || ticker,
          price: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
          previousClose: q.previousClose ?? 0,
          volume: q.volume ?? 0,
          exchange: q.exchange || '',
        };
        pipeline.set(`gidne_quote_${ticker}`, JSON.stringify(quoteData), { ex: 30 });
      }
    }
    await pipeline.exec();
    console.log(`[Pump] Individual quotes cached: ${quotes.size} tickers`);

  } catch (error) {
    console.error('[Pump] Market data error:', error);
  }
}

// ========== 2. 차트 데이터 펌프 (5분마다) ==========
async function pumpChartData() {
  console.log(`[Pump:Chart] Starting chart cache cycle...`);
  let success = 0;
  
  for (const ticker of CHART_TICKERS) {
    try {
      const cacheKey = `gidne_chart_${ticker}_1d`;
      
      // 이미 캐시가 있으면 스킵
      const existing = await redis.exists(cacheKey);
      if (existing) continue;

      const period1 = new Date();
      period1.setMonth(period1.getMonth() - 6);

      const result = await yahooFinance.chart(ticker, { period1, interval: '1d' as any });
      
      const chartData = result.quotes
        .filter((q: any) => q.close !== null && q.close !== undefined)
        .map((q: any) => ({
          time: q.date.toISOString().split('T')[0],
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume || 0,
        }));

      await redis.set(cacheKey, JSON.stringify(chartData), { ex: 300 }); // 5분 TTL
      success++;

      // Rate limit 방지
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[Pump:Chart] Failed for ${ticker}:`, (err as Error).message);
    }
  }
  console.log(`[Pump:Chart] Cached ${success} new charts`);
}

// ========== 3. 캘린더 데이터 펌프 (1시간마다) ==========
async function pumpCalendar() {
  console.log(`[Pump:Calendar] Fetching economic calendar...`);
  try {
    const existing = await redis.exists('gidne_calendar_weekly');
    if (existing) {
      console.log(`[Pump:Calendar] Cache still valid, skipping.`);
      return;
    }

    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const xml = await response.text();
    const eventsPattern = /<event>([\s\S]*?)<\/event>/g;
    const events: any[] = [];
    
    let match;
    while ((match = eventsPattern.exec(xml)) !== null) {
      const eventXml = match[1];
      const extractTag = (tag: string) => {
        const m = eventXml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'));
        return m ? m[1].trim() : '';
      };

      const title = extractTag('title');
      const country = extractTag('country');
      const impact = extractTag('impact');
      const targetCountries = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];

      if ((impact === 'High' || impact === 'Medium') && targetCountries.includes(country)) {
        const mappedCountry = country === 'USD' ? 'US' : country === 'EUR' ? 'EU' : country === 'GBP' ? 'GB' : country === 'JPY' ? 'JP' : country === 'CNY' ? 'CN' : country;
        events.push({
          id: Math.random().toString(36).substring(2, 11),
          title,
          country: mappedCountry,
          date: extractTag('date'),
          time: extractTag('time'),
          impact: impact.toLowerCase(),
          forecast: extractTag('forecast') || '-',
          previous: extractTag('previous') || '-',
        });
      }
    }

    await redis.set('gidne_calendar_weekly', JSON.stringify(events.slice(0, 15)), { ex: 3600 });
    console.log(`[Pump:Calendar] Cached ${events.length} events`);
  } catch (err) {
    console.error(`[Pump:Calendar] Error:`, (err as Error).message);
  }
}

// ========== Main Loop ==========
async function main() {
  console.log('[Pump] 🚀 Data Pump Bot initialized.');

  // 최초 실행 시 차트 + 캘린더도 한번 돌림
  await pumpCalendar();
  await pumpChartData();

  let cycleCount = 0;
  while (true) {
    await pumpMarketData();
    cycleCount++;

    // 차트는 60사이클(약 5분)마다 갱신
    if (cycleCount % 60 === 0) {
      await pumpChartData();
    }
    // 캘린더는 720사이클(약 1시간)마다 갱신
    if (cycleCount % 720 === 0) {
      await pumpCalendar();
    }

    const delay = getPollingInterval();
    console.log(`[Pump] Waiting ${delay / 1000}s until next cycle...`);
    await new Promise(r => setTimeout(r, delay));
  }
}

main();

