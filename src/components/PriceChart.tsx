import React, { useEffect, useRef, useState, memo } from 'react';

interface Props {
  ticker?: string;
  name?: string;
  isDelayed?: boolean;
}

// Yahoo 티커를 TradingView 심볼로 변환
// 주의: 거래소를 명시하지 않으면 Cboe One(15분 딜레이)로 연결될 수 있음
const getTVSymbol = (ticker: string) => {
  // 지수 (위젯 허용 안 되는 지수들은 CFD나 ETF로 우회)
  if (ticker === '^GSPC') return 'FOREXCOM:SPX500';
  if (ticker === '^IXIC') return 'FOREXCOM:NSXUSD';
  if (ticker === '^KS11') return 'AMEX:EWY'; // KOSPI 위젯 제한 -> 한국 ETF
  if (ticker === '^N225') return 'OANDA:JP225USD';
  if (ticker === '^VIX') return 'FRED:VIXCLS'; // FRED 공공재 데이터 (무료 위젯 100% 허용)
  if (ticker === '^VVIX') return 'CBOE:VVIX';
  if (ticker === '^TNX') return 'FRED:DGS10'; // FRED 10-Year Yield
  if (ticker === '^FVX') return 'FRED:DGS5'; // FRED 5-Year Yield
  // ETF — TradingView 무료 위젯 한계:
  // SPY(Cboe One) = 15분 딜레이, ES1!(CME) = 10분 딜레이
  // FOREXCOM:SPX500 (CFD) = 실시간 무료
  if (ticker === 'SPY') return 'FOREXCOM:SPX500';
  if (ticker === 'QQQ') return 'FOREXCOM:NSXUSD';
  // 선물/원자재/크립토
  if (ticker === 'BTC-USD') return 'BINANCE:BTCUSD';
  if (ticker === 'ETH-USD') return 'BINANCE:ETHUSD';
  if (ticker === 'SOL-USD') return 'BINANCE:SOLUSD';
  if (ticker === 'DOGE-USD') return 'BINANCE:DOGEUSD';
  if (ticker === 'GC=F') return 'OANDA:XAUUSD';
  if (ticker === 'CL=F') return 'NYMEX:CL1!';
  // 환율/달러
  if (ticker === 'KRW=X') return 'FX:USDKRW';
  if (ticker === 'DX-Y.NYB') return 'CAPITALCOM:DXY';
  // 섹터 ETF — AMEX 실시간
  if (/^XL[A-Z]$/.test(ticker)) return `AMEX:${ticker}`;
  // 기본: NASDAQ 먼저 시도 (대부분 실시간)
  return ticker.includes(':') ? ticker : ticker;
};

function PriceChart({ ticker: initialTicker, name: initialName, isDelayed }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [currentTicker, setCurrentTicker] = useState(initialTicker || 'SPY');
  const [currentName, setCurrentName] = useState(initialName || 'S&P 500');
  const showTabs = !initialTicker; // 외부에서 티커가 지정되지 않은 메인 화면의 경우에만 탭 표시

  const [containerId] = useState(() => {
    const symbol = getTVSymbol(initialTicker || 'SPY');
    return `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).substring(7)}`;
  });

  useEffect(() => {
    const symbol = getTVSymbol(currentTicker);
    
    if (container.current) {
      container.current.id = containerId;
    }

    let tvScriptLoadingPromise: Promise<void> | null = null;

    const initWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView && container.current) {
        container.current.innerHTML = '';
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Asia/Seoul",
          theme: isLight ? "light" : "dark",
          style: "1",
          locale: "kr",
          enable_publishing: false,
          backgroundColor: isLight ? "#ffffff" : "#161616",
          gridColor: isLight ? "rgba(229, 229, 234, 1)" : "rgba(42, 42, 42, 1)",
          hide_top_toolbar: false, // 1분/3분/1시간 탭 복구
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          allow_symbol_change: false,
          toolbar_bg: isLight ? "#ffffff" : "#161616"
        });
      }
    };

    if (!(window as any).TradingView) {
      if (!tvScriptLoadingPromise) {
        tvScriptLoadingPromise = new Promise((resolve) => {
          const script = document.createElement('script');
          script.id = 'tradingview-widget-script';
          script.src = 'https://s3.tradingview.com/tv.js';
          script.type = 'text/javascript';
          script.async = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      tvScriptLoadingPromise.then(() => {
        initWidget();
      });
    } else {
      initWidget();
    }

    // 테마 변경 감지 (MutationObserver)를 통해 차트 테마 실시간 업데이트
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          initWidget();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [currentTicker]);

  return (
    <div className="bento-item h-full price-chart-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          {currentName}
          {isDelayed && (
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500', border: '1px solid rgba(255, 165, 0, 0.2)' }}>
              🕒 15분 지연
            </span>
          )}
        </h3>
        {showTabs && (
          <div className="chart-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              className={`chart-tab ${currentTicker === 'SPY' ? 'active' : ''}`}
              onClick={() => { setCurrentTicker('SPY'); setCurrentName('S&P 500'); }}
            >
              S&P 500
            </button>
            <button 
              className={`chart-tab ${currentTicker === 'QQQ' ? 'active' : ''}`}
              onClick={() => { setCurrentTicker('QQQ'); setCurrentName('NASDAQ'); }}
            >
              NASDAQ
            </button>
          </div>
        )}
      </div>
      <style>{`
        .chart-tab {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          padding: 0.15rem 0.5rem;
          font-size: 0.75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .chart-tab:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }
        .chart-tab.active {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }
      `}</style>
      
      {/* TradingView 위젯 컨테이너 */}
      <div className="tradingview-widget-container" style={{ flex: 1, minHeight: '350px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
        <div ref={container} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}

export default memo(PriceChart);

