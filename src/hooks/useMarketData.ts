import { useState, useEffect } from 'react';
import type { MarketDataResponse } from '../lib/types';

export function useMarketData() {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market-data?_t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to fetch market data');
        const json = await res.json();
        setData(json);
        setError(null);

        // API에서 알려준 polling interval(30초 또는 5분)로 다음 폴링 스케줄링
        timeoutId = setTimeout(fetchData, json.meta.pollingInterval);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // 에러 시 15초 후 재시도
        timeoutId = setTimeout(fetchData, 15000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => clearTimeout(timeoutId);
  }, []);

  return { data, loading, error };
}
