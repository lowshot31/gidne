import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 'i')) || 
                xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

export const GET: APIRoute = async (context) => {
  const redis = getRedis(context);
  const CACHE_KEY = 'gidne_calendar_weekly';

  try {
    // [Step 1] Redis 캐시 우선 조회
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600',
        },
      });
    }

    // [Step 2] 캐시 미스 시 외부 API 호출
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
        throw new Error(`FairEconomy API Error: ${response.status}`);
    }
    
    const xml = await response.text();
    const eventsPattern = /<event>([\s\S]*?)<\/event>/g;
    const events: any[] = [];
    
    let match;
    while ((match = eventsPattern.exec(xml)) !== null) {
      const eventXml = match[1];
      const title = extractTag(eventXml, 'title');
      const country = extractTag(eventXml, 'country');
      const date = extractTag(eventXml, 'date');
      const time = extractTag(eventXml, 'time');
      const impact = extractTag(eventXml, 'impact');
      const forecast = extractTag(eventXml, 'forecast');
      const previous = extractTag(eventXml, 'previous');

      const targetCountries = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
      const mappedCountry = country === 'USD' ? 'US' : country === 'EUR' ? 'EU' : country === 'GBP' ? 'GB' : country === 'JPY' ? 'JP' : country === 'CNY' ? 'CN' : country;

      if ((impact === 'High' || impact === 'Medium') && targetCountries.includes(country)) {
        events.push({
          id: Math.random().toString(36).substring(2, 11),
          title,
          country: mappedCountry,
          date,
          time,
          impact: impact.toLowerCase(),
          forecast: forecast || '-',
          previous: previous || '-'
        });
      }
    }

    const sortedEvents = events.slice(0, 15);

    // [Step 3] Redis에 1시간(3600초) TTL로 캐싱
    await redis.set(CACHE_KEY, JSON.stringify(sortedEvents), { ex: 3600 });

    return new Response(JSON.stringify(sortedEvents), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (error) {
    console.error('[API] /api/calendar error:', error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
};
