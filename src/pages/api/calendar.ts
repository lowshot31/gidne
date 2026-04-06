import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 'i')) || 
                xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

// 주요 경제 이벤트 한국어 번역 사전
const EVENT_KO: Record<string, string> = {
  // 🇺🇸 미국
  'Non-Farm Employment Change': '비농업 고용 변화',
  'Nonfarm Payrolls': '비농업 고용자수',
  'Unemployment Rate': '실업률',
  'CPI m/m': '소비자물가지수 (월간)',
  'CPI y/y': '소비자물가지수 (연간)',
  'Core CPI m/m': '근원 소비자물가지수 (월간)',
  'Core CPI y/y': '근원 소비자물가지수 (연간)',
  'PPI m/m': '생산자물가지수 (월간)',
  'PPI y/y': '생산자물가지수 (연간)',
  'Core PPI m/m': '근원 생산자물가지수 (월간)',
  'Federal Funds Rate': '연방기금금리',
  'FOMC Statement': 'FOMC 성명서',
  'FOMC Meeting Minutes': 'FOMC 회의록',
  'FOMC Press Conference': 'FOMC 기자회견',
  'FOMC Member Speaks': 'FOMC 위원 발언',
  'Fed Chair Powell Speaks': '파월 연준의장 발언',
  'GDP q/q': 'GDP 성장률 (분기)',
  'Advance GDP q/q': 'GDP 속보치 (분기)',
  'Preliminary GDP q/q': 'GDP 잠정치 (분기)',
  'Final GDP q/q': 'GDP 확정치 (분기)',
  'Retail Sales m/m': '소매판매 (월간)',
  'Core Retail Sales m/m': '근원 소매판매 (월간)',
  'ISM Manufacturing PMI': 'ISM 제조업 PMI',
  'ISM Services PMI': 'ISM 서비스업 PMI',
  'ADP Non-Farm Employment Change': 'ADP 비농업 고용 변화',
  'Unemployment Claims': '신규 실업수당청구건수',
  'Initial Jobless Claims': '신규 실업수당청구건수',
  'Existing Home Sales': '기존주택판매',
  'New Home Sales': '신규주택판매',
  'Building Permits': '건축허가건수',
  'Consumer Confidence': '소비자신뢰지수',
  'CB Consumer Confidence': 'CB 소비자신뢰지수',
  'Durable Goods Orders m/m': '내구재 주문 (월간)',
  'Core Durable Goods Orders m/m': '근원 내구재 주문 (월간)',
  'Industrial Production m/m': '산업생산 (월간)',
  'Crude Oil Inventories': '원유 재고',
  'Natural Gas Storage': '천연가스 재고',
  'Trade Balance': '무역수지',
  'Current Account': '경상수지',
  'PCE Price Index m/m': 'PCE 물가지수 (월간)',
  'Core PCE Price Index m/m': '근원 PCE 물가지수 (월간)',
  'Core PCE Price Index y/y': '근원 PCE 물가지수 (연간)',
  'Personal Spending m/m': '개인소비지출 (월간)',
  'Personal Income m/m': '개인소득 (월간)',
  'Michigan Consumer Sentiment': '미시간 소비자심리지수',
  'Prelim UoM Consumer Sentiment': '미시간 소비자심리 예비치',
  'Revised UoM Consumer Sentiment': '미시간 소비자심리 수정치',
  'Empire State Manufacturing Index': '엠파이어스테이트 제조지수',
  'Philly Fed Manufacturing Index': '필라델피아 연은 제조지수',
  'Treasury Currency Report': '재무부 환율 보고서',
  'Housing Starts': '주택착공건수',

  // 🇪🇺 유로존
  'Main Refinancing Rate': 'ECB 기준금리',
  'ECB Press Conference': 'ECB 기자회견',
  'ECB Monetary Policy Statement': 'ECB 통화정책 성명',
  'Flash Manufacturing PMI': '제조업 PMI 속보치',
  'Flash Services PMI': '서비스업 PMI 속보치',
  'Final Manufacturing PMI': '제조업 PMI 확정치',
  'Final Services PMI': '서비스업 PMI 확정치',
  'German Flash Manufacturing PMI': '독일 제조업 PMI 속보치',
  'German Prelim GDP q/q': '독일 GDP 잠정치 (분기)',
  'German Ifo Business Climate': '독일 Ifo 기업경기지수',
  'German ZEW Economic Sentiment': '독일 ZEW 경기기대지수',
  'French Flash Manufacturing PMI': '프랑스 제조업 PMI 속보치',

  // 🇬🇧 영국
  'Official Bank Rate': '영란은행 기준금리',
  'BOE Monetary Policy Summary': 'BOE 통화정책 요약',
  'MPC Meeting Minutes': 'MPC 회의록',
  'Claimant Count Change': '실업급여 청구변동',

  // 🇯🇵 일본
  'BOJ Policy Rate': '일본은행 정책금리',
  'BOJ Press Conference': '일본은행 기자회견',
  'BOJ Monetary Policy Statement': '일본은행 통화정책 성명',
  'Tankan Manufacturing Index': '단칸 제조업 지수',
  'Tankan Non-Manufacturing Index': '단칸 비제조업 지수',
  'National Core CPI y/y': '전국 근원 CPI (연간)',
  'Tokyo Core CPI y/y': '도쿄 근원 CPI (연간)',

  // 🇨🇳 중국
  'Manufacturing PMI': '제조업 PMI',
  'Non-Manufacturing PMI': '비제조업 PMI',
  'Caixin Manufacturing PMI': '차이신 제조업 PMI',
  'Caixin Services PMI': '차이신 서비스업 PMI',
  'Chinese GDP q/y': '중국 GDP (전년 대비)',
};

function translateTitle(title: string): string {
  // 1. 정확히 일치하는 경우
  if (EVENT_KO[title]) return EVENT_KO[title];
  // 2. 부분 매칭 (ex: "Prelim GDP q/q" → "GDP 잠정치")
  for (const [en, ko] of Object.entries(EVENT_KO)) {
    if (title.includes(en)) return ko;
  }
  return title; // 매칭 안 되면 원문 유지
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
          title: translateTitle(title),
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
