import { useState, useEffect, useRef } from 'react';

export interface CryptoPrice {
  symbol: string;    // 'BTCUSDT'
  price: number;
  change24h: number; // 24시간 변동률 (%)
  volume24h: number;
  high24h: number;
  low24h: number;
}

/**
 * Binance WebSocket을 통해 실시간 크립토 가격을 스트리밍합니다.
 * 연결 끊김 시 자동 재연결합니다.
 * 
 * @param symbols Binance 심볼 배열 (예: ['btcusdt', 'ethusdt'])
 */
export function useBinanceStream(symbols: string[] = ['btcusdt', 'ethusdt', 'solusdt']) {
  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      // 복수 심볼을 하나의 WebSocket으로 구독 (combined stream)
      const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
      const url = `wss://stream.binance.com:9443/ws/${streams}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Binance WS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 24hr ticker 데이터 파싱
          // 참고: https://binance-docs.github.io/apidocs/spot/en/#individual-symbol-ticker-streams
          if (data.e === '24hrTicker') {
            const crypto: CryptoPrice = {
              symbol: data.s, // 'BTCUSDT'
              price: parseFloat(data.c),           // 현재가
              change24h: parseFloat(data.P),       // 24h 변동률 (%)
              volume24h: parseFloat(data.v),       // 24h 거래량 (base asset)
              high24h: parseFloat(data.h),         // 24h 최고가
              low24h: parseFloat(data.l),          // 24h 최저가
            };

            if (mountedRef.current) {
              setPrices(prev => {
                const next = new Map(prev);
                next.set(crypto.symbol, crypto);
                return next;
              });
            }
          }
        } catch {
          // 파싱 실패 무시
        }
      };

      ws.onerror = (err) => {
        console.error('[Binance WS] Error:', err);
      };

      ws.onclose = () => {
        console.log('[Binance WS] Disconnected, reconnecting in 3s...');
        if (mountedRef.current) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [symbols.join(',')]);

  return prices;
}
