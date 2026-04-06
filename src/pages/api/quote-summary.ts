// src/pages/api/quote-summary.ts
// 펀더멘털 데이터 — Yahoo Finance 공개 HTTP 엔드포인트 직접 호출
import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

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

    const modules = 'assetProfile,financialData,defaultKeyStatistics,summaryDetail,recommendationTrend';
    const yfUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
    const res = await fetch(yfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`Yahoo quoteSummary HTTP ${res.status}`);

    const result = await res.json();
    const summary = result?.quoteSummary?.result?.[0];

    if (!summary) {
      return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404 });
    }

    const data = {
      profile: {
        sector: summary.assetProfile?.sector || '-',
        industry: summary.assetProfile?.industry || '-',
        website: summary.assetProfile?.website || '',
        description: summary.assetProfile?.longBusinessSummary || '기업 설명이 제공되지 않습니다.',
        employees: summary.assetProfile?.fullTimeEmployees || 0,
      },
      financials: {
        targetHigh: summary.financialData?.targetHighPrice?.raw || 0,
        targetLow: summary.financialData?.targetLowPrice?.raw || 0,
        targetMean: summary.financialData?.targetMeanPrice?.raw || 0,
        recommendationKey: summary.financialData?.recommendationKey || 'none',
        numberOfAnalysts: summary.financialData?.numberOfAnalystOpinions?.raw || 0,
        totalRevenue: summary.financialData?.totalRevenue?.raw || 0,
        ebitda: summary.financialData?.ebitda?.raw || 0,
        debtToEquity: summary.financialData?.debtToEquity?.raw || 0,
        profitMargins: summary.financialData?.profitMargins?.raw || 0,
        operatingMargins: summary.financialData?.operatingMargins?.raw || 0,
        returnOnEquity: summary.financialData?.returnOnEquity?.raw || 0,
      },
      statistics: {
        trailingPE: summary.summaryDetail?.trailingPE?.raw || 0,
        forwardPE: summary.summaryDetail?.forwardPE?.raw || 0,
        priceToBook: summary.defaultKeyStatistics?.priceToBook?.raw || 0,
        beta: summary.defaultKeyStatistics?.beta?.raw || summary.summaryDetail?.beta?.raw || 0,
        shortRatio: summary.defaultKeyStatistics?.shortRatio?.raw || 0,
        shortPercentOfFloat: summary.defaultKeyStatistics?.shortPercentOfFloat?.raw || 0,
        dividendYield: summary.summaryDetail?.dividendYield?.raw || 0,
      },
      trends: summary.recommendationTrend?.trend || [],
      filings: []
    };

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
