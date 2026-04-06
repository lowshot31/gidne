// src/lib/watchlist.ts
// LocalStorage 기반 개인 워치리스트 관리

const STORAGE_KEY = 'gidne-watchlist';

export interface WatchlistItem {
  ticker: string;
  addedAt: string; // ISO date
}

/**
 * 워치리스트 전체 조회
 */
export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // 데이터 무결성 검증 추가
    if (!Array.isArray(parsed)) {
      console.warn('Watchlist localStorage data tampered, resetting.');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    return parsed.filter(item => item && typeof item.ticker === 'string');
  } catch {
    console.warn('Watchlist localStorage parse error, resetting.');
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * 워치리스트에 종목 추가
 */
export function addToWatchlist(ticker: string): WatchlistItem[] {
  const list = getWatchlist();
  const normalized = ticker.toUpperCase().trim();
  if (!normalized) return list;
  if (list.some(item => item.ticker === normalized)) return list; // 중복 방지
  
  const updated = [...list, { ticker: normalized, addedAt: new Date().toISOString() }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * 워치리스트에서 종목 제거
 */
export function removeFromWatchlist(ticker: string): WatchlistItem[] {
  const list = getWatchlist().filter(item => item.ticker !== ticker.toUpperCase().trim());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

/**
 * 워치리스트 티커 목록만 반환 (API 호출용)
 */
export function getWatchlistTickers(): string[] {
  return getWatchlist().map(item => item.ticker);
}
