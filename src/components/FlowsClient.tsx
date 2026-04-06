import React, { useState } from 'react';
import CryptoLive from './CryptoLive';
import PriceChart from './PriceChart';
import CryptoInsights from './CryptoInsights';
import ExpectedMoveWidget from './ExpectedMoveWidget';

// -- Crypto Flows --
const CryptoFlows = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <CryptoInsights />
      
      <div className="bento-item" style={{ width: '100%', boxSizing: 'border-box' }}>
        <h3 className="text-secondary mb-md">코인 시장 눈치게임 👑</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          비트코인이 혼자 독주하는지, 아니면 알트코인까지 다 같이 오르는 축제인지 확인해보세요. 테더(USDT) 도미넌스가 치솟는다면 사람들이 겁을 먹고 현금을 꽉 쥐고 있다는 뜻입니다!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          <PriceChart ticker="CRYPTOCAP:TOTAL3" name="알트코인 전체 시가총액 (오르면 알트 불장!)" />
          <PriceChart ticker="CRYPTOCAP:BTC.D" name="비트코인 지배력 (비트 혼자 오르는지 확인)" />
          <PriceChart ticker="CRYPTOCAP:USDT.D" name="스테이블코인 대기자금 (오르면 사람들 쫄아서 관망 중)" />
        </div>
      </div>

      <div className="bento-item" style={{ width: '100%', boxSizing: 'border-box' }}>
        <h3 className="text-secondary mb-md">CRYPTO LIVE TICKERS</h3>
        <CryptoLive />
      </div>
    </div>
  );
};

// -- Equities Flows --
const EquitiesFlows = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 거시 시장 옵션 마켓 메이커 타겟 (Expected Move) */}
      <div className="bento-item" style={{ width: '100%', boxSizing: 'border-box', background: 'linear-gradient(145deg, rgba(200, 155, 60, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
        <h3 className="text-secondary mb-md">거시 시장 단기 예상 변동폭 (Options Implied) 🎯</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          시장 메이커(MM)들의 실시간 스트래들 프라이싱과 내재변동성을 기반으로 산출된 오늘/이번 주/이번 달 미국 증시(S&P 500, 나스닥)의 통계적 허용치(Expected Move)입니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          <ExpectedMoveWidget ticker="SPY" />
          <ExpectedMoveWidget ticker="QQQ" />
        </div>
      </div>

      <div className="bento-item" style={{ width: '100%', boxSizing: 'border-box' }}>
        <h3 className="text-secondary mb-md">스마트 머니와 고래들의 속마음 🐳</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          일반 개미가 아닌, 시장을 쥐락펴락하는 거대 자본(스마트 머니)의 방향을 훔쳐봅니다. 풋/콜 비율이 비정상적으로 높다면 모두가 겁에 질렸다는 뜻이니, 오히려 기회일 수도 있어요!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          <PriceChart ticker="USI:PCC" name="하락 배팅 비율 (풋/콜 1 이상이면 극도 공포)" isDelayed={true} />
          <PriceChart ticker="AMEX:HYG" name="고래들의 공격 투자 동향 (이게 오르면 불장🔥)" />
          <PriceChart ticker="NASDAQ:TLT" name="고래들의 방어 투자 동향 (이게 오르면 공포장🥶)" />
        </div>
      </div>
      
      <div className="bento-item" style={{ width: '100%', boxSizing: 'border-box' }}>
        <h3 className="text-secondary mb-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          S&P 500 돈의 파도 (히트맵) 🗺️
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500', border: '1px solid rgba(255, 165, 0, 0.2)', fontWeight: 'normal' }}>
            🕒 15분 지연
          </span>
        </h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          오늘 미국 주식 시가총액 상위 500개 기업 중, 도대체 어떤 동네(섹터)에 돈이 눈먼 듯 쏟아져 들어오고 있는지 한눈에 쫙 펼쳐드립니다. (녹색이 돈이 몰린 곳이에요!)
        </p>
        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <StockHeatmapWidget />
        </div>
      </div>
    </div>
  );
};

// -- Stock Heatmap Widget Component --
const StockHeatmapWidget = () => {
  const container = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!container.current) return;
    
    // 이전 스크립트 찌꺼기가 남지 않도록 초기화 (React strict mode 및 탭 전환 대비)
    container.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "exchanges": [],
      "dataSource": "SPX500",
      "grouping": "sector",
      "blockSize": "market_cap_basic",
      "blockColor": "change",
      "locale": "kr",
      "symbolUrl": "",
      "colorTheme": "dark",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" style={{ height: '100%', width: '100%' }}>
      <div className="tradingview-widget-container__widget" ref={container} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default function FlowsClient() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'equities'>('crypto');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      {/* 탭 토글 UI */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          background: 'rgba(20,20,30,0.6)', 
          backdropFilter: 'blur(10px)',
          padding: '0.25rem', 
          borderRadius: '999px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
           <button 
            onClick={() => setActiveTab('equities')}
            style={{ 
              padding: '0.6rem 2rem', 
              borderRadius: '999px', 
              background: activeTab === 'equities' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'equities' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
             }}>
             📈 주식 및 기관 매크로
          </button>
          <button 
            onClick={() => setActiveTab('crypto')}
            style={{ 
              padding: '0.6rem 2rem', 
              borderRadius: '999px', 
              background: activeTab === 'crypto' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'crypto' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
             }}>
             💎 가상자산 및 선물
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 영역 */}
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {activeTab === 'crypto' ? <CryptoFlows /> : <EquitiesFlows />}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
