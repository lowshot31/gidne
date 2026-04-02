// src/lib/cache.ts
// TTL 기반 in-memory 캐시
// 서버사이드 전용 — Astro API Routes에서 사용

interface CacheEntry<T> {
  data: T;
  expiry: number; // unix timestamp (ms)
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * 캐시에서 값을 가져옵니다.
   * TTL이 만료되었으면 undefined를 반환합니다.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * 값을 캐시에 저장합니다.
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param ttlMs TTL(밀리초). 기본값 30초.
   */
  set<T>(key: string, data: T, ttlMs: number = 30_000): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * 캐시에서 값을 가져오되, 없으면 fetcher를 호출하고 결과를 캐시합니다.
   * Stale-while-revalidate 패턴.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 30_000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /** 특정 키 삭제 */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** 전체 캐시 초기화 */
  clear(): void {
    this.store.clear();
  }

  /** 만료된 항목 정리 */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스 — 서버 프로세스 내에서 공유
export const cache = new MemoryCache();

// TTL 상수
export const TTL = {
  QUOTE: 30_000,     // 시세: 30초
  MACRO: 3_600_000,  // 매크로: 1시간
  RS_RANK: 86_400_000, // RS 순위(어제 데이터): 24시간
} as const;
