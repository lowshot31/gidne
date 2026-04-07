import React, { useEffect, useRef, useState, memo } from 'react';
import CustomLightweightChart from './CustomLightweightChart';

interface Props {
  ticker?: string;
  name?: string;
  isDelayed?: boolean;
}

// Yahoo 티커를 TradingView 심볼로 변환
const getTVSymbol = (ticker: string) => {
  // 북미 주요 지수 (안정적인 실시간 렌더링을 위해 선물이나 메이저 CFD 사용)
  if (ticker === '^GSPC') return 'FOREXCOM:SPXUSD'; // S&P 500 CFD
  if (ticker === '^IXIC') return 'FOREXCOM:NSXUSD'; // Nasdaq 100 CFD
  if (ticker === '^DJI') return 'FOREXCOM:DJI'; // Dow CFD
  if (ticker === '^RUT') return 'AMEX:IWM'; // Russell ETF (CFD 차단 우회)
  if (ticker === '^GSPTSE') return 'TSX:TSX'; // TSX

  // 유럽/선진국 지수
  if (ticker === '^FTSE') return 'CAPITALCOM:UK100';
  if (ticker === '^GDAXI') return 'CAPITALCOM:DE40'; // DAX CFD
  if (ticker === '^FCHI') return 'CAPITALCOM:FR40'; // CAC CFD
  if (ticker === '^STOXX50E') return 'OANDA:EU50EUR'; // Euro Stoxx CFD (OANDA가 안정적)
  if (ticker === '^AXJO') return 'OANDA:AU200AUD'; // 호주 ASX 200 CFD

  // 아시아 (ETF 및 주요 CFD로 완전 우회 - TradingView 제약 타파)
  if (ticker === '^KS11') return 'AMEX:EWY'; // KOSPI -> 한국 ETF
  if (ticker === '^N225') return 'OANDA:JP225USD'; // Nikkei CFD (OANDA가 무료 위젯에서 더 안정적)
  if (ticker === '000001.SS') return 'AMEX:ASHR'; // 상하이 -> 와이드모트 ETF
  if (ticker === '^HSI') return 'CAPITALCOM:HK50'; // 항셍 CFD
  if (ticker === '^TWII') return 'AMEX:EWT'; // 대만 가권 -> 대만 ETF

  // 신흥국 주가지수 (완벽 우회)
  if (ticker === '^NSEI') return 'BATS:INDA'; // 인도 니프티50 -> 인도 ETF
  if (ticker === '^VNINDEX.VN') return 'BATS:VNM'; // 베트남 -> VNM ETF
  if (ticker === 'TA35.TA') return 'AMEX:EIS'; // 이스라엘 -> 이스라엘 ETF
  if (ticker === '^BVSP') return 'AMEX:EWZ'; // 브라질 -> 브라질 ETF
  if (ticker === '^MXX') return 'AMEX:EWW'; // 멕시코 -> 멕시코 ETF

  // 매크로 지수 & 채권 금리
  if (ticker === '^VIX') return 'CBOE:VIX';
  if (ticker === '^VVIX') return 'CBOE:VVIX';
  if (ticker === '^SKEW') return 'CBOE:SKEW';
  if (ticker === '^IRX') return 'FRED:DGS3MO';
  if (ticker === '^FVX') return 'FRED:DGS5';
  if (ticker === '^TNX') return 'FRED:DGS10';
  if (ticker === '^TYX') return 'FRED:DGS30';
  if (ticker === 'HYG') return 'AMEX:HYG';
  if (ticker === 'LQD') return 'AMEX:LQD';
  if (ticker === 'TLT') return 'NASDAQ:TLT';

  // 원자재 & 실물 코어 (CME/NYMEX 차단 우회 -> OANDA/CFD 무료 실시간 심볼 적용)
  if (ticker === 'CL=F') return 'OANDA:WTICOUSD'; // WTI 원유
  if (ticker === 'BZ=F') return 'OANDA:BCOUSD';   // 브렌트유
  if (ticker === 'NG=F') return 'OANDA:NATGASUSD';// 천연가스
  if (ticker === 'HG=F') return 'OANDA:XCUUSD';   // 구리
  if (ticker === 'GC=F') return 'OANDA:XAUUSD';   // 금
  if (ticker === 'SI=F') return 'OANDA:XAGUSD';   // 은
  if (ticker === 'ZC=F') return 'CAPITALCOM:CORN';// 옥수수
  
  // 환율 통화
  if (ticker === 'KRW=X') return 'FX_IDC:USDKRW';
  if (ticker === 'JPY=X') return 'FX_IDC:USDJPY';
  if (ticker === 'CNY=X') return 'FX_IDC:USDCNY';
  if (ticker === 'EURUSD=X') return 'FX_IDC:EURUSD';
  if (ticker === 'DX-Y.NYB') return 'CAPITALCOM:DXY'; // ICE 차단 우회

  // 크립토 / 주요 ETF
  if (ticker === 'SPY') return 'AMEX:SPY';
  if (ticker === 'QQQ') return 'NASDAQ:QQQ';
  if (ticker === 'BTC-USD') return 'BINANCE:BTCUSD';
  if (ticker === 'ETH-USD') return 'BINANCE:ETHUSD';
  if (ticker === 'SOL-USD') return 'BINANCE:SOLUSD';
  if (ticker === 'DOGE-USD') return 'BINANCE:DOGEUSD';

  if (/^XL[A-Z]$/.test(ticker)) return `AMEX:${ticker}`;

  return ticker.includes(':') ? ticker : ticker;
};

function PriceChart({ ticker: initialTicker, name: initialName, isDelayed }: Props) {
  const [currentTicker, setCurrentTicker] = useState(initialTicker || '^GSPC');
  const [currentName, setCurrentName] = useState(initialName || 'S&P 500');
  const showTabs = !initialTicker; // 외부에서 티커가 지정되지 않은 메인 화면의 경우에만 탭 표시

  const currentSymbol = getTVSymbol(currentTicker);
  const [visitedSymbols, setVisitedSymbols] = useState<Set<string>>(new Set([currentSymbol]));
  const initializedWidgets = useRef<Set<string>>(new Set());

  // TradingView 위젯 임베딩이 차단되는 CBOE 특정 지수들만 정밀 타격하여 Native 백엔드 차트로 우회
  const isRestrictedSymbol = currentSymbol.startsWith('CBOE:');

  useEffect(() => {
    if (initialTicker) setCurrentTicker(initialTicker);
  }, [initialTicker]);

  useEffect(() => {
    if (initialName) setCurrentName(initialName);
  }, [initialName]);

  useEffect(() => {
    setVisitedSymbols((prev) => {
      if (prev.has(currentSymbol)) return prev;
      const next = new Set(prev);
      next.add(currentSymbol);
      return next;
    });
  }, [currentSymbol]);

  useEffect(() => {
    // 제한된 심볼은 위젯 초기화를 아예 시도하지 않음
    if (isRestrictedSymbol) return;
    if (initializedWidgets.current.has(currentSymbol)) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const initWidget = () => {
      const containerId = `tv_chart_${currentSymbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const containerEl = document.getElementById(containerId);
      
      if (typeof window !== 'undefined' && (window as any).TradingView && containerEl && containerEl.innerHTML === '') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: currentSymbol,
          interval: "D",
          timezone: "Asia/Seoul",
          theme: isLight ? "light" : "dark",
          style: "1",
          locale: "kr",
          enable_publishing: false,
          backgroundColor: isLight ? "#ffffff" : "#161616",
          gridColor: isLight ? "rgba(229, 229, 234, 1)" : "rgba(42, 42, 42, 1)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          allow_symbol_change: false,
          toolbar_bg: isLight ? "#ffffff" : "#161616"
        });
        initializedWidgets.current.add(currentSymbol);
      }
    };

    const triggerWidget = () => {
      debounceTimer = setTimeout(() => {
        initWidget();
      }, 50); // 아주 짧은 지연만 주고 생성
    };

    let tvScriptLoadingPromise: Promise<void> | null = null;
    if (!(window as any).TradingView) {
      const scriptId = 'tradingview-widget-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        tvScriptLoadingPromise = new Promise((resolve) => {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://s3.tradingview.com/tv.js';
          script.type = 'text/javascript';
          script.async = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      } else {
        tvScriptLoadingPromise = Promise.resolve();
      }
      
      tvScriptLoadingPromise.then(() => {
        triggerWidget();
      });
    } else {
      triggerWidget();
    }

    // 테마 변경 감지 시 모든 위젯 초기화해야 하지만 구조상 복잡하므로 
    // 여기서는 일단 보류하거나 새로고침 브라우저 권장.
    
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [currentSymbol, visitedSymbols]);

  return (
    <div className="bento-item h-full price-chart-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', flexWrap: 'wrap' }}>
          {currentName}
          {isDelayed && (
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500', border: '1px solid rgba(255, 165, 0, 0.2)' }}>
              🕒 15분 지연
            </span>
          )}
          
          {isRestrictedSymbol && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>vs S&P 500 (역상관)</span>
              </div>
              <div style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--bull)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '4px' }}>
                ✅ Gidne Native 우회
              </div>
            </div>
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
      
      {/* TradingView 위젯 컨테이너 (Zero-Flash Dynamic Caching) */}
      <div className="tradingview-widget-container" style={{ position: 'relative', flex: 1, minHeight: '350px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
        {/* TradingView 위젯 백그라운드 렌더링 (DOM 언마운트 방지하여 재로딩 지연 제거) */}
        {Array.from(visitedSymbols).map((sym) => {
          if (sym.startsWith('CBOE:')) return null;
          const isActive = sym === currentSymbol && !isRestrictedSymbol;
          return (
            <div 
              key={sym}
              id={`tv_chart_${sym.replace(/[^a-zA-Z0-9]/g, '_')}`}
              style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: isActive ? 1 : 0, 
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 10 : 1,
                transition: 'opacity 0.2s ease-in-out'
              }} 
            />
          );
        })}

        {/* Native 우회 차트 오버레이 영역 (CBOE 전용) */}
        {isRestrictedSymbol && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
             <CustomLightweightChart 
              ticker={currentTicker} 
              name={currentName} 
              hideWrapper={true} 
              compareTicker="SPY"
              compareName="S&P 500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PriceChart);
