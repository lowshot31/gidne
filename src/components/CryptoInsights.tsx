import React, { useEffect, useState } from 'react';

interface CryptoFlowData {
  upbitPrice: number;
  usdKrwRate: number;
  btcGlobalPrice: number;
  kimp: number;
  binanceFundingRate: number;
  longShortRatio: number;
}

export default function CryptoInsights() {
  const [data, setData] = useState<CryptoFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const res = await fetch('/api/crypto-flows');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Flows fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlows();
    const interval = setInterval(fetchFlows, 10000); // 10초마다 폴링
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return <div className="bento-item text-center p-xl">Loading Crypto Insights...</div>;
  if (!data) return null;

  return (
    <div className="bento-item" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <div style={{ background: 'var(--bg-modifier-hover)', padding: '1rem', borderRadius: '8px' }} title="한국 거래소와 글로벌 거래소의 가격 차이입니다. 0%보다 높으면 국내 수요가 강함(과열)을, 낮으면 역프리미엄(저평가)을 의미합니다.">
        <div className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          🔥 김치 프리미엄 (KIMP)
          <span style={{ cursor: 'help', opacity: 0.5, fontSize: '0.75rem' }}>?</span>
        </div>
        <div className="flex items-center gap-xs">
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }} className={data.kimp > 2 ? 'text-bear' : data.kimp < 0 ? 'text-bull' : ''}>
            {data.kimp > 0 ? '+' : ''}{data.kimp.toFixed(2)}%
          </span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Upbit: ₩{data.upbitPrice.toLocaleString('ko-KR')}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          환율: ₩{data.usdKrwRate.toFixed(2)} / USD
        </div>
      </div>

      <div style={{ background: 'var(--bg-modifier-hover)', padding: '1rem', borderRadius: '8px' }} title="초과된 포지션이 반대 포지션에게 지불하는 비용입니다. 양수면 롱(매수) 포지션이 많아 과열 상태이며 숏스퀴즈 위험이 있습니다.">
        <div className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          🌡️ 선물 펀딩비 (Binance)
          <span style={{ cursor: 'help', opacity: 0.5, fontSize: '0.75rem' }}>?</span>
        </div>
        <div className="flex items-center gap-xs">
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }} className={data.binanceFundingRate > 0.05 ? 'text-bear' : 'text-bull'}>
            {data.binanceFundingRate > 0 ? '+' : ''}{data.binanceFundingRate.toFixed(4)}%
          </span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {data.binanceFundingRate > 0.05 ? '⚠️ 롱 오버헤팅 주의' : '정상 수준'}
        </div>
      </div>

      <div style={{ background: 'var(--bg-modifier-hover)', padding: '1rem', borderRadius: '8px' }} title="상위 트레이더들의 매수(Long)와 공매도(Short) 비율입니다. 1.0보다 크면 상승을 기대하는 세력이 더 많다는 뜻입니다.">
        <div className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          ⚖️ 롱/숏 비율 (Top Trader)
          <span style={{ cursor: 'help', opacity: 0.5, fontSize: '0.75rem' }}>?</span>
        </div>
        <div className="flex items-center gap-xs">
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {data.longShortRatio.toFixed(2)}
          </span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {data.longShortRatio > 1.2 ? '롱 편향 (조정 가능성)' : data.longShortRatio < 0.8 ? '숏 편향' : '중립 상태'}
        </div>
      </div>
    </div>
  );
}
