// src/pages/api/news.ts
import type { APIRoute } from 'astro';
import { yahooFinance } from '../../lib/yahoo-finance';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);

  // 꼼수번역기 (Google Translate 무료 API 우회)
  const translateToKorean = async (text: string) => {
    try {
      const cleanText = text.replace(/\[.*?SQUAWK.*?\]\s*/i, ''); // FT squawk 태그 제거
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(cleanText)}`);
      const data = await res.json();
      const koText = data[0].map((item: any) => item[0]).join(' ');
      return koText;
    } catch(e) {
      return text;
    }
  };
  // 입력 검증: 최대 100자, 영숫자/공백/하이픈/점/^/=/콤마 허용 (티커 심볼 호환)
  const rawQ = url.searchParams.get('q') || 'markets';
  const q = rawQ.replace(/[^a-zA-Z0-9,\s\-\.\^=]/g, '').slice(0, 100).trim() || 'markets';
  const count = Math.min(Math.max(parseInt(url.searchParams.get('count') || '5', 10), 1), 30);
  const cacheKey = `gidne:news:${q}:${count}`;

  try {
    const redis = getRedis({ locals });
    
    // 1. Redis 캐시 확인 (60초 이내 데이터면 즉시 반환)
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return new Response(typeof cachedData === 'string' ? cachedData : JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let combinedNews: any[] = [];

    // 1. Yahoo Finance 뉴스 (종목별 심층 기사)
    try {
      const queries = q.split(',').map(s => s.trim()).filter(Boolean);
      const uuidSet = new Set();
      
      for (const query of queries) {
        const result = await yahooFinance.search(query, { newsCount: count });
        
        const yfNews = await Promise.all((result.news || []).map(async (item: any) => {
          if (uuidSet.has(item.uuid)) return null;
          uuidSet.add(item.uuid);
          
          const translatedTitle = await translateToKorean(item.title);
          return {
            uuid: item.uuid,
            title: translatedTitle,
            publisher: item.publisher || 'Yahoo Finance',
            link: item.link,
            providerPublishTime: item.providerPublishTime,
            type: 'article'
          };
        }));
        
        combinedNews.push(...yfNews.filter(Boolean));
        // 야후 429 에러 방지를 위해 추가 딜레이
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error('YF News failed:', e);
    }

    // 시간순 내림차순 정렬 (최신순)
    const sortedNews = combinedNews.sort(
      (a: any, b: any) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0)
    );

    // 3. Redis에 캐싱 (TTL 60초)
    const responsePayload = JSON.stringify(sortedNews);
    
    // 비동기 백그라운드로 캐시 저장 (응답 속도 향상)
    redis.set(cacheKey, responsePayload, { ex: 60 }).catch(e => console.error('Redis Set Error:', e));

    return new Response(responsePayload, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[YF News API Failed]:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
