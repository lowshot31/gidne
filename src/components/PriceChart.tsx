import React, { useEffect, useRef, memo } from 'react';

interface Props {
  ticker?: string;
  name?: string;
}

// Yahoo 티커를 TradingView 심볼로 변환
// 주의: 거래소를 명시하지 않으면 Cboe One(15분 딜레이)로 연결될 수 있음
const getTVSymbol = (ticker: string) => {
  // 지수
  if (ticker === '^GSPC') return 'SP:SPX';
  if (ticker === '^IXIC') return 'NASDAQ:IXIC';
  if (ticker === '^KS11') return 'KRX:KOSPI';
  if (ticker === '^N225') return 'TVC:NI225';
  if (ticker === '^VIX') return 'CBOE:VIX';
  if (ticker === '^VVIX') return 'CBOE:VVIX';
  if (ticker === '^TNX') return 'TVC:US10Y';
  if (ticker === '^FVX') return 'TVC:US05Y';
  // ETF — TradingView 무료 위젯 한계:
  // SPY(Cboe One) = 15분 딜레이, ES1!(CME) = 10분 딜레이
  // FOREXCOM:SPX500 (CFD) = 실시간 무료
  if (ticker === 'SPY') return 'FOREXCOM:SPX500';
  if (ticker === 'QQQ') return 'FOREXCOM:NSXUSD';
  // 선물/원자재
  if (ticker === 'BTC-USD') return 'BINANCE:BTCUSD';
  if (ticker === 'GC=F') return 'COMEX:GC1!';
  if (ticker === 'CL=F') return 'NYMEX:CL1!';
  // 환율/달러
  if (ticker === 'KRW=X') return 'FX:USDKRW';
  if (ticker === 'DX-Y.NYB') return 'TVC:DXY';
  // 섹터 ETF — AMEX 실시간
  if (/^XL[A-Z]$/.test(ticker)) return `AMEX:${ticker}`;
  // 기본: NASDAQ 먼저 시도 (대부분 실시간)
  return ticker.includes(':') ? ticker : ticker;
};

function PriceChart({ ticker = 'SPY', name = 'S&P 500' }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const symbol = getTVSymbol(ticker);
    const containerId = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    if (container.current) {
      container.current.id = containerId;
    }

    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    // 위젯 초기화 함수
    const initWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView && container.current) {
        // 기존 내용 지우기
        container.current.innerHTML = '';
        
        // 다크/라이트 모드 판단
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
          backgroundColor: isLight ? "rgba(255, 255, 255, 1)" : "rgba(22, 22, 22, 1)",
          gridColor: isLight ? "rgba(229, 229, 234, 1)" : "rgba(42, 42, 42, 1)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          toolbar_bg: isLight ? "#f1f3f6" : "#2a2a2a"
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      // 스크립트가 이미 로드되어 있으면 바로 위젯 렌더링
      // 단, 로드 중일 수도 있으므로 약간의 지연 처리
      if ((window as any).TradingView) {
        initWidget();
      } else {
        script.addEventListener('load', initWidget);
      }
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
      if (!script) return;
      script.removeEventListener('load', initWidget);
    };
  }, [ticker]);

  return (
    <div className="bento-item h-full price-chart-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="text-secondary" style={{ margin: 0 }}>ADVANCED CHART ({name})</h3>
      </div>
      
      {/* TradingView 위젯 컨테이너 */}
      <div className="tradingview-widget-container" style={{ flex: 1, minHeight: '350px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
        <div ref={container} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}

export default memo(PriceChart);

