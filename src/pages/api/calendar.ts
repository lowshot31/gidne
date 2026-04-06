import type { APIRoute } from 'astro';
import { cache } from '../../lib/cache';

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 'i')) || 
                xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

export const GET: APIRoute = async () => {
  const CACHE_KEY = 'economic_calendar_weekly';
  const cached = cache.get(CACHE_KEY);

  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ForexFactory 엔진 (faireconomy.media)
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
    const events = [];
    
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
      // 달력 UI에서 국가 코드를 매핑합니다.
      const mappedCountry = country === 'USD' ? 'US' : country === 'EUR' ? 'EU' : country === 'GBP' ? 'GB' : country === 'JPY' ? 'JP' : country === 'CNY' ? 'CN' : country;

      if ((impact === 'High' || impact === 'Medium') && targetCountries.includes(country)) {
        events.push({
          id: Math.random().toString(36).substr(2, 9),
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

    cache.set(CACHE_KEY, sortedEvents, 3600 * 1000); // 1시간 캐시하여 429 IP 밴을 절대적으로 방지

    return new Response(JSON.stringify(sortedEvents), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[API] /api/calendar error:', error);
    // 429 또는 403 에러 시 빈 배열을 반환해 클라이언트가 Demo Data를 그리도록 유도
    return new Response(JSON.stringify([]), { status: 200 });
  }
};
