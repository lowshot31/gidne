import { useState, useEffect, useRef } from 'react';

export interface FinnhubQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
}

/**
 * Finnhub WS 싱글톤 매니저
 * - window 전역에 바인딩하여 HMR(Hot Module Reload) 시에도 동일 인스턴스 유지
 * - 지수 백오프로 재연결 (3s → 6s → 12s → ... → 60s max)
 * - 최대 10회 재시도 후 REST fallback만 사용
 */
class FinnhubWSManager {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private subscribers: Map<string, Set<(quote: FinnhubQuote) => void>> = new Map();
  private cache: Map<string, FinnhubQuote> = new Map();
  private requestedRest: Set<string> = new Set();
  private connecting = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private static MAX_RECONNECT_ATTEMPTS = 10;
  private static BASE_DELAY = 5000;  // 5초 시작 (HMR 레이스 방지)
  private static MAX_DELAY = 60000;

  async getToken() {
    if (this.token) return this.token;
    try {
      const res = await fetch('/api/finnhub-token');
      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
      }
    } catch {}
    return this.token;
  }

  async fetchRest(symbol: string) {
    if (this.requestedRest.has(symbol)) return;
    this.requestedRest.add(symbol);
    
    const tk = await this.getToken();
    if (!tk) {
      this.requestedRest.delete(symbol); // 실패 시 재시도 가능하도록 플래그 해제
      return;
    }
    
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${tk}`);
      if (res.ok) {
        const d = await res.json();
        if (d.c) {
          const q: FinnhubQuote = { 
            symbol, 
            price: d.c, 
            change: d.d ?? 0, 
            changePercent: d.dp ?? 0, 
            prevClose: d.pc ?? 0 
          };
          this.cache.set(symbol, q);
          this.notify(symbol, q);
          return; // 성공 → 플래그 유지 (중복 요청 방지)
        }
      }
      // 응답은 왔지만 데이터가 없음 → 재시도 가능
      this.requestedRest.delete(symbol);
    } catch (e) {
      console.error('[Finnhub REST] Failed', e);
      this.requestedRest.delete(symbol); // 실패 시 재시도 가능
    }
  }

  async subscribe(symbol: string, callback: (q: FinnhubQuote) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.fetchRest(symbol);
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    if (this.cache.has(symbol)) {
      callback(this.cache.get(symbol)!);
    }

    this.connectWs();
  }

  unsubscribe(symbol: string, callback: (q: FinnhubQuote) => void) {
    const set = this.subscribers.get(symbol);
    if (!set) return;
    
    set.delete(callback);
    if (set.size === 0) {
      this.subscribers.delete(symbol);
      this.sendWs({ type: 'unsubscribe', symbol });
    }
  }

  private async connectWs() {
    // 이미 연결 중이거나 연결된 상태면 무시
    if (this.connecting) return;
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      // 이미 열려있으면, 새 심볼만 추가 구독
      for (const symbol of this.subscribers.keys()) {
        this.sendWs({ type: 'subscribe', symbol });
      }
      return;
    }

    if (this.reconnectAttempts >= FinnhubWSManager.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[Finnhub WS] Max reconnect (${FinnhubWSManager.MAX_RECONNECT_ATTEMPTS}) reached. REST only.`);
      return;
    }
    
    const tk = await this.getToken();
    if (!tk) return;

    this.connecting = true;

    // 이전 WS가 아직 닫히는 중일 수 있으니 명시적으로 정리
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${tk}`);
    
    this.ws.onopen = () => {
      this.connecting = false;
      this.reconnectAttempts = 0;
      console.log('[Finnhub WS] Connected');
      for (const symbol of this.subscribers.keys()) {
        this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    };
    
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'trade') {
          data.data.forEach((trade: any) => {
            const sym = trade.s;
            const newPrice = trade.p;
            const old = this.cache.get(sym);
            
            if (old && old.price !== newPrice) {
              const pc = old.prevClose;
              const newChange = newPrice - pc;
              const newDp = pc !== 0 ? (newChange / pc) * 100 : 0;
              const q: FinnhubQuote = { 
                ...old, 
                price: newPrice, 
                change: newChange, 
                changePercent: newDp 
              };
              this.cache.set(sym, q);
              this.notify(sym, q);
            }
          });
        }
      } catch {}
    };

    this.ws.onerror = () => {
      this.connecting = false;
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.connecting = false;

      if (this.subscribers.size > 0 && this.reconnectAttempts < FinnhubWSManager.MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        const delay = Math.min(
          FinnhubWSManager.BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
          FinnhubWSManager.MAX_DELAY
        );
        console.log(`[Finnhub WS] Reconnect in ${delay / 1000}s (${this.reconnectAttempts}/${FinnhubWSManager.MAX_RECONNECT_ATTEMPTS})`);
        
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectWs(), delay);
      }
    };
  }

  private sendWs(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private notify(symbol: string, q: FinnhubQuote) {
    const set = this.subscribers.get(symbol);
    if (set) {
      set.forEach(cb => cb(q));
    }
  }

  // 재연결 카운터 리셋 (수동 리트라이용)
  resetRetries() {
    this.reconnectAttempts = 0;
    this.connectWs();
  }
}

// HMR에 견디는 진짜 싱글톤: window 전역 객체에 바인딩
declare global {
  interface Window {
    __finnhubWSManager?: FinnhubWSManager;
  }
}

function getManager(): FinnhubWSManager {
  if (typeof window === 'undefined') return new FinnhubWSManager();
  if (!window.__finnhubWSManager) {
    window.__finnhubWSManager = new FinnhubWSManager();
  }
  return window.__finnhubWSManager;
}

/**
 * 훅: 컴포넌트 마운트 시 구독, 언마운트 시 해제
 */
export function useFinnhubStream(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, FinnhubQuote>>(new Map());
  const callbackRef = useRef<((q: FinnhubQuote) => void) | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    const manager = getManager();

    const handleUpdate = (q: FinnhubQuote) => {
      setPrices(prev => {
        const next = new Map(prev);
        next.set(q.symbol, q);
        return next;
      });
    };

    callbackRef.current = handleUpdate;
    symbols.forEach(sym => manager.subscribe(sym, handleUpdate));

    return () => {
      symbols.forEach(sym => manager.unsubscribe(sym, handleUpdate));
    };
  }, [symbols.join(',')]);

  return prices;
}
