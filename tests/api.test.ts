import { describe, it, expect, vi, beforeEach } from 'vitest';

// ────────────────────────────────────────────────────────────────
// yahoo-finance2 전체 mock — Vitest는 import 시점에 hoisting 하므로
// vi.mock() 선언이 실제 import보다 항상 먼저 실행됨
// ────────────────────────────────────────────────────────────────
vi.mock('yahoo-finance2', () => {
  const mockQuote = vi.fn().mockResolvedValue({
    symbol: 'AAPL',
    shortName: 'Apple Inc.',
    regularMarketPrice: 254.58,
    regularMarketChange: -1.05,
    regularMarketChangePercent: -0.41,
    regularMarketPreviousClose: 255.63,
    regularMarketOpen: 254.14,
    regularMarketDayHigh: 255.72,
    regularMarketDayLow: 250.65,
    regularMarketVolume: 13_800_000,
    averageDailyVolume3Month: 48_100_000,
    marketCap: 3_740_000_000_000,
    fiftyTwoWeekHigh: 288.62,
    fiftyTwoWeekLow: 169.21,
    fullExchangeName: 'NasdaqGS',
    quoteType: 'EQUITY',
  });

  const mockSearch = vi.fn().mockResolvedValue({
    quotes: [
      { symbol: 'TSLA', shortname: 'Tesla, Inc.', quoteType: 'EQUITY', exchange: 'NMS' },
      { symbol: 'TSM', shortname: 'Taiwan Semiconductor', quoteType: 'EQUITY', exchange: 'NYSE' },
    ],
  });

  // yahoo-finance2 v3는 new 로 인스턴스화 → function 키워드 필수 (화살표 함수는 new 불가)
  const MockYahooFinance = function (this: any) {
    this.quote = mockQuote;
    this.search = mockSearch;
  };

  return { default: MockYahooFinance };
});

// mock 선언 이후에 실제 모듈 import (hoisting 덕분에 mock이 먼저 적용됨)
import { cache } from '../src/lib/cache';
import { GET as getQuote } from '../src/pages/api/quote';
import { GET as getSearch } from '../src/pages/api/search';

// ────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────

describe('Security — 입력 검증 (DoS Protection)', () => {
  beforeEach(() => cache.clear());

  describe('GET /api/quote', () => {
    it('ticker가 없으면 400을 반환한다', async () => {
      const req = new Request('http://localhost/api/quote');
      const res = await getQuote({ request: req } as any);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid ticker');
    });

    it('ticker가 20자 초과면 400을 반환한다 (DoS 방어)', async () => {
      const longTicker = 'X'.repeat(21);
      const req = new Request(`http://localhost/api/quote?ticker=${longTicker}`);
      const res = await getQuote({ request: req } as any);
      expect(res.status).toBe(400);
    });

    it('유효한 ticker(AAPL)에 200과 데이터를 반환한다', async () => {
      const req = new Request('http://localhost/api/quote?ticker=AAPL');
      const res = await getQuote({ request: req } as any);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.symbol).toBe('AAPL');
      expect(body.price).toBe(254.58);
      expect(body.exchange).toBe('NasdaqGS');
    });

    it('같은 ticker를 두 번 호출하면 두 번째는 캐시에서 반환된다', async () => {
      const req = () => new Request('http://localhost/api/quote?ticker=AAPL');
      await getQuote({ request: req() } as any);
      await getQuote({ request: req() } as any);
      // 캐시에 저장되어 있어야 함
      expect(cache.get('quote_detail_AAPL')).toBeDefined();
    });
  });

  describe('GET /api/search', () => {
    it('빈 쿼리에 빈 배열을 반환한다', async () => {
      const req = new Request('http://localhost/api/search?q=');
      const res = await getSearch({ request: req } as any);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('쿼리가 30자 초과면 빈 배열을 반환한다 (DoS 방어)', async () => {
      const longQuery = 'A'.repeat(31);
      const req = new Request(`http://localhost/api/search?q=${longQuery}`);
      const res = await getSearch({ request: req } as any);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('"Tesla" 검색 시 TSLA를 포함한 결과를 반환한다', async () => {
      const req = new Request('http://localhost/api/search?q=Tesla');
      const res = await getSearch({ request: req } as any);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((item: any) => item.symbol === 'TSLA')).toBe(true);
    });
  });
});

describe('Security — Cache DoS 방어 (MAX_SIZE=1000)', () => {
  beforeEach(() => cache.clear());

  it('1005개 항목 추가 시 앞 5개는 eviction된다', () => {
    for (let i = 0; i < 1005; i++) {
      cache.set(`key_${i}`, i, 60_000);
    }
    // 처음 5개는 사이즈 초과로 제거됨
    for (let i = 0; i < 5; i++) {
      expect(cache.get(`key_${i}`)).toBeUndefined();
    }
    // 마지막에 추가된 항목은 살아있어야 함
    expect(cache.get('key_1004')).toBe(1004);
  });

  it('TTL이 만료된 항목은 get 시 undefined를 반환한다', async () => {
    cache.set('expires_soon', 'value', 1); // 1ms TTL
    await new Promise(r => setTimeout(r, 10));
    expect(cache.get('expires_soon')).toBeUndefined();
  });
});
