import type { APIRoute } from 'astro';
import YahooFinance from 'yahoo-finance2';
import { getRedis } from '../../lib/redis';

const yahooFinance = new YahooFinance();

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || ticker.length > 20) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), { status: 400 });
  }

  const redis = getRedis(context);
  const cacheKey = `gidne_summary_${ticker}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      });
    }

    const summaryResult = await yahooFinance.quoteSummary(ticker, {
      modules: [
        'assetProfile',
        'financialData',
        'defaultKeyStatistics',
        'summaryDetail',
        'recommendationTrend',
        'secFilings'
      ],
    });

    if (!summaryResult) {
      return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404 });
    }

    const summary: any = summaryResult;

    const data = {
      profile: {
        sector: summary.assetProfile?.sector || '-',
        industry: summary.assetProfile?.industry || '-',
        website: summary.assetProfile?.website || '',
        description: summary.assetProfile?.longBusinessSummary || '기업 설명이 제공되지 않습니다.',
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
        forwardPE: summary.summaryDetail?.forwardPE || 0,
        priceToBook: summary.defaultKeyStatistics?.priceToBook || 0,
        beta: summary.defaultKeyStatistics?.beta || summary.summaryDetail?.beta || 0,
        shortRatio: summary.defaultKeyStatistics?.shortRatio || 0,
        shortPercentOfFloat: summary.defaultKeyStatistics?.shortPercentOfFloat || 0,
        dividendYield: summary.summaryDetail?.dividendYield || 0,
      },
      trends: summary.recommendationTrend?.trend || [],
      filings: summary.secFilings?.filings || []
    };

    // 펀더멘털은 1시간 캐시
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (error: any) {
    console.error(`[quote-summary] error for ${ticker}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quote summary', details: error?.message }), { status: 500 });
  }
};

