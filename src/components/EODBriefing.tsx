import React, { useState, useEffect } from 'react';
import type { SectorData, MacroData, TickerQuote } from '../lib/types';
import { SECTOR_HOLDINGS, MACRO_SECTOR_DRIVERS } from '../lib/tickers';
import { getWatchlistTickers } from '../lib/watchlist';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface HoldingQuote {
  ticker: string;
  name: string;
  changePercent: number;
  rs: number; // vs benchmark
}

interface SectorBriefing {
  sector: SectorData;
  change: number; 
  holdings: HoldingQuote[];
  driver: string | null; 
}

interface Props {
  sectors: SectorData[];
  macro: MacroData[];
  holdings?: Record<string, TickerQuote[]>;
  indices?: TickerQuote[];
}

type TimeFrame = '1D' | '1W' | '1M';

export default function EODBriefing({ sectors, macro, holdings, indices }: Props) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [copied, setCopied] = useState(false);
  const [wlTickers, setWlTickers] = useState<string[]>([]);
  const [returnsCache, setReturnsCache] = useState<Record<string, {change1W: number, change1M: number}>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showWlExpand, setShowWlExpand] = useState(false);

  useEffect(() => {
    const loadWl = () => setWlTickers(getWatchlistTickers());
    loadWl();
    window.addEventListener('gidne_watchlist_updated', loadWl);
    return () => window.removeEventListener('gidne_watchlist_updated', loadWl);
  }, []);

  const { data: wlQuotes = {} } = useSWR<Record<string, {name: string, changePercent: number}>>(
    wlTickers.length > 0 ? `/api/quotes?tickers=${wlTickers.map(encodeURIComponent).join(',')}` : null,
    fetcher,
    { refreshInterval: 10000, dedupingInterval: 2000 }
  );

  useEffect(() => {
    let pollingTimer: ReturnType<typeof setTimeout>;

    const fetchReturns = () => {
      const allNeeded = Array.from(new Set([
        '^GSPC', '^IXIC', 
        ...sectors.map(s => s.ticker), 
        ...macro.map(m => m.ticker),
        ...(holdings ? Object.values(holdings).flat().map(h => h.symbol) : []),
        ...wlTickers
      ]));
      
      const missing = allNeeded.filter(t => {
        const cached = returnsCache[t];
        // 캐시가 없거나, 아직 펌프가 처리 중이라서 API가 임시로 0,0을 보낸 상태일 경우 (change1W 0 && change1M 0은 매우 희박하므로 로딩 상태로 간주)
        if (!cached) return true;
        if (cached.change1W === 0 && cached.change1M === 0) return true;
        return false;
      });

      if (missing.length > 0) {
        setIsLoading(true);
        fetch(`/api/returns?tickers=${missing.map(encodeURIComponent).join(',')}`)
          .then(r => r.ok ? r.json() as Promise<Record<string, {change1W: number, change1M: number}>> : {})
          .then((data: any) => {
            setReturnsCache(prev => ({ ...prev, ...data }));
            
            // 아직 data에 진짜 값이 안 들어온 항목이 있다면 (큐에서 대기 중), 5초 뒤에 다시 찔러봄!
            const stillMissing = missing.some(t => !data[t] || (data[t].change1W === 0 && data[t].change1M === 0));
            if (stillMissing) {
              pollingTimer = setTimeout(fetchReturns, 5000);
            } else {
              setIsLoading(false);
            }
          })
          .catch(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    };

    fetchReturns();

    return () => clearTimeout(pollingTimer);
  }, [timeframe, wlTickers, sectors, macro, holdings]);

  const getChange = (ticker: string, default1D: number) => {
    if (timeframe === '1D') return default1D;
    const ret = returnsCache[ticker];
    if (!ret) return 0;
    return timeframe === '1W' ? ret.change1W : ret.change1M;
  };

  // 벤치마크 (S&P 500 & NASDAQ)
  const spy1D = indices?.find(m => m.symbol === '^GSPC')?.changePercent ?? 0;
  const benchmarkChange = getChange('^GSPC', spy1D);

  const nasdaq1D = indices?.find(m => m.symbol === '^IXIC')?.changePercent ?? 0;
  const nasdaqChange = getChange('^IXIC', nasdaq1D);

  // 섹터별 분할 및 계산
  let calculatedSectors = sectors.map(sector => {
    const sChange = getChange(sector.ticker, sector.changePercent);
    const sRs = sChange - benchmarkChange;

    const holdingsConfig = SECTOR_HOLDINGS[sector.ticker] || [];
    const actualHoldings = holdings ? holdings[sector.ticker] : undefined;
    
    const holdingQuotes: HoldingQuote[] = holdingsConfig.map(h => {
      const actualH = actualHoldings?.find(x => (x as any).symbol === h.ticker);
      const hChange1D = actualH ? actualH.changePercent : sector.changePercent;
      const hChange = getChange(h.ticker, hChange1D);
      return {
        ticker: h.ticker,
        name: h.name,
        changePercent: hChange,
        rs: hChange - benchmarkChange,
      };
    });
    // 개별 종목도 해당 기간 RS 기준으로 정렬
    holdingQuotes.sort((a, b) => b.rs - a.rs);

    // 매크로 드라이버 (단기 1D일때 위주로 매칭, 1W/1M은 수익률을 기반으로 재계산)
    const drivers = MACRO_SECTOR_DRIVERS[sector.ticker] || [];
    let driverText: string | null = null;
    for (const d of drivers) {
      const macroItem = macro.find(m => m.ticker === d.macro);
      if (macroItem) {
        const mChange = getChange(macroItem.ticker, macroItem.changePercent);
        if (Math.abs(mChange) > 0.3) {
          const sign = mChange >= 0 ? '+' : '';
          const verb = d.direction === 'same'
            ? (mChange >= 0 ? '상승' : '하락')
            : (mChange >= 0 ? '상승(역풍)' : '하락(수혜)');
          driverText = `← ${d.label} ${sign}${mChange.toFixed(1)}% ${verb}`;
          break;
        }
      }
    }

    return { 
      sector, 
      change: sChange, 
      rs: sRs, 
      holdings: holdingQuotes, 
      driver: driverText 
    };
  });

  calculatedSectors.sort((a, b) => (b as any).rs - (a as any).rs);
  
  const topSectors = calculatedSectors.slice(0, 3);
  const bottomSectors = calculatedSectors.slice(-2).reverse();
  const bullishCount = calculatedSectors.filter(s => s.change > 0).length;

  // 워치리스트 Top Movers 계산
  let watchlistMovers: {ticker: string, name: string, change: number | null}[] = wlTickers.map(t => {
    const isLoaded = t in wlQuotes;
    const q = wlQuotes[t] || { changePercent: 0, name: t };
    return {
      ticker: t,
      name: q.name,
      change: isLoaded ? getChange(t, q.changePercent) : null
    };
  });
  
  // 로딩 안 된 상태(null)는 리스트 하단으로
  watchlistMovers.sort((a, b) => {
    if (a.change === null && b.change === null) return 0;
    if (a.change === null) return 1;
    if (b.change === null) return -1;
    return b.change - a.change;
  });

  const displayMovers = showWlExpand || watchlistMovers.length <= 4
    ? watchlistMovers
    : [...watchlistMovers.slice(0, 3), watchlistMovers[watchlistMovers.length - 1]];

  const handleCopy = () => {
    let cp = `[${timeframe} Alpha Briefing]\n\n`;
    
    if (watchlistMovers.length > 0) {
      cp += `⭐ 내 관심종목\n`;
      displayMovers.forEach(m => {
        cp += `- ${m.ticker}: ${m.change !== null ? (m.change > 0 ? '+' : '') + m.change.toFixed(2) + '%' : '로딩중'}\n`;
      });
      cp += `\n`;
    }

    cp += `📊 섹터 순위\n`;
    calculatedSectors.forEach((s, idx) => {
      cp += `${idx+1}. ${s.sector.name} (${s.sector.ticker}) ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%\n`;
      if (s.driver && idx < 4) cp += `  ${s.driver}\n`; // 상위권 4개만 드라이버 복사
    });

    navigator.clipboard.writeText(cp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bento-item eod-briefing" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {/* Header */}
      <div className="eod-header">
        <h3 className="text-secondary" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🌇</span> ALPHA BRIEFING
          {isLoading && <span style={{fontSize: '0.7rem', color: 'var(--accent-primary)'}}>...</span>}
        </h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button 
            onClick={handleCopy}
            style={{ 
              background: 'transparent', border: '1px solid var(--border-color)', 
              color: copied ? 'var(--bull)' : 'var(--text-muted)', 
              fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' 
            }}
          >
            {copied ? '복사됨!' : '복사'}
          </button>
          <div className="eod-tf-tabs">
            {(['1D', '1W', '1M'] as TimeFrame[]).map(tf => (
              <button key={tf} className={timeframe === tf ? 'active' : ''} onClick={() => setTimeframe(tf)}>
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market Summary */}
      <div className="eod-summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eod-benchmark">
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>S&P 500 ({timeframe})</span>
            <span className={benchmarkChange >= 0 ? 'text-bull' : 'text-bear'} style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, display: 'block' }}>
              {benchmarkChange >= 0 ? '+' : ''}{benchmarkChange.toFixed(2)}%
            </span>
          </div>
          <div className="eod-benchmark" style={{ textAlign: 'right' }}>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>NASDAQ ({timeframe})</span>
            <span className={nasdaqChange >= 0 ? 'text-bull' : 'text-bear'} style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, display: 'block' }}>
              {nasdaqChange >= 0 ? '+' : ''}{nasdaqChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="eod-stat-row" style={{ marginTop: '4px' }}>
          <span className="text-muted">{bullishCount}/{sectors.length} 섹터 상승</span>
          <span className="text-muted">RS 리더: <strong className="text-bull">{topSectors[0]?.sector.ticker}</strong></span>
        </div>
      </div>

      <div className="eod-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {/* 내 관심종목 Top Movers (제일 위로) */}
        {watchlistMovers.length > 0 && (
          <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)' }}>
            <div className="eod-section-label text-secondary" style={{display:'flex', justifyContent:'space-between'}}>
              <span>⭐ 내 워치리스트 Movers</span>
              <button 
                onClick={() => setShowWlExpand(!showWlExpand)}
                style={{background:'none', border:'none', color:'var(--accent-primary)', fontSize:'0.7rem', cursor:'pointer'}}
              >
                {showWlExpand ? '접기 ▲' : '더보기 ▼'}
              </button>
            </div>
            <div className="eod-holdings" style={{ paddingLeft: 0 }}>
              {displayMovers.map((m, idx) => {
                const isGainer = (m.change ?? 0) >= 0;
                return (
                  <a key={m.ticker+idx} href={`/chart/${encodeURIComponent(m.ticker)}`} className="eod-holding-row" style={{border: `1px solid ${isGainer ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'}`, background: isGainer ? 'rgba(34,197,94,0.05)' : 'rgba(239,83,80,0.05)'}}>
                    <span>{m.ticker} {m.change === null 
                      ? <span className="eod-shimmer-pill" /> 
                      : <span className={isGainer ? 'text-bull' : 'text-bear'} style={{marginLeft:'2px', fontSize:'0.7rem', fontWeight: 600}}>
                          {isGainer ? '+' : ''}{m.change.toFixed(1)}%
                        </span>
                    }</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 모든 섹터 랭킹 */}
        <div className="eod-section-label text-secondary" style={{ marginBottom: '0.4rem' }}>📊 전체 섹터 랭킹</div>
        {calculatedSectors.map((sb, i) => {
          const isTop = i < 3;
          const isBottom = i >= calculatedSectors.length - 2;
          const cardClass = isTop ? 'eod-sector-card' : isBottom ? 'eod-sector-card eod-weak' : 'eod-sector-card eod-neutral';
          const rankClass = isTop ? 'eod-rank' : isBottom ? 'eod-rank eod-rank-weak' : 'eod-rank eod-rank-neutral';
          
          return (
            <div key={sb.sector.ticker} className={cardClass}>
              <div className="eod-sector-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={rankClass}>{i + 1}</span>
                  <strong>{sb.sector.ticker}</strong>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{sb.sector.name}</span>
                </div>
                <span className={sb.change >= 0 ? 'text-bull' : 'text-bear'} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {sb.change >= 0 ? '+' : ''}{sb.change.toFixed(2)}%
                </span>
              </div>
              
              {/* 상위 4개 섹터 또는 드라이버가 있는 하위 섹터에만 상세 내역 표시 */}
              {(i < 4 || isBottom) && (
                <>
                  {sb.driver && <div className="eod-driver">{sb.driver}</div>}
                  {isTop && (
                    <div className="eod-holdings">
                      {sb.holdings.slice(0, 3).map(h => (
                        <a key={h.ticker} href={`/chart/${encodeURIComponent(h.ticker)}`} className="eod-holding-row">
                          <span>{h.ticker} <span className={h.changePercent >= 0 ? 'text-bull' : 'text-bear'} style={{marginLeft:'2px', fontSize:'0.7rem'}}>{h.changePercent>=0?'+':''}{h.changePercent.toFixed(1)}%</span></span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .eod-briefing { gap: 0.6rem; }
        .eod-header { display: flex; justify-content: space-between; align-items: center; }
        .eod-tf-tabs {
          display: flex; gap: 2px; background: var(--overlay); padding: 2px;
          border-radius: 6px; border: 1px solid var(--border-color);
        }
        .eod-tf-tabs button {
          background: transparent; border: none; color: var(--text-muted);
          font-size: 0.6rem; font-family: var(--font-mono); padding: 3px 7px;
          border-radius: 4px; cursor: pointer; transition: all 0.2s;
        }
        .eod-tf-tabs button:hover { color: var(--text-primary); }
        .eod-tf-tabs button.active { background: var(--accent-primary); color: #fff; font-weight: 600; }
        
        .eod-summary {
          background: var(--overlay); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 0.6rem 0.8rem;
          display: flex; flex-direction: column; gap: 4px;
        }
        .eod-benchmark { display: flex; justify-content: space-between; align-items: center; }
        .eod-stat-row { display: flex; justify-content: space-between; font-size: 0.7rem; }

        .eod-scroll::-webkit-scrollbar { width: 4px; }
        .eod-scroll::-webkit-scrollbar-thumb { background: var(--overlay-hover); border-radius: 4px; }

        .eod-section-label {
          font-size: 0.7rem; font-weight: 700; padding: 4px 0;
          font-family: var(--font-mono); letter-spacing: 0.5px;
        }

        .eod-sector-card {
          border: 1px solid var(--border-color); border-radius: var(--radius-md);
          padding: 0.5rem 0.6rem; margin-bottom: 0.4rem; transition: all 0.2s;
          background: rgba(34, 197, 94, 0.03);
        }
        .eod-weak { background: rgba(239, 83, 80, 0.03); }
        .eod-neutral { background: transparent; border: 1px dashed var(--border-color); }
        .eod-sector-card:hover { border-style: solid; border-color: var(--accent-primary); }
        [data-theme='light'] .eod-sector-card { background: rgba(34,197,94,0.04); }
        [data-theme='light'] .eod-weak { background: rgba(239,83,80,0.04); }
        [data-theme='light'] .eod-neutral { background: transparent; }

        .eod-sector-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
        .eod-rank {
          background: var(--bull); color: #000; font-size: 0.6rem; font-weight: 800;
          width: 18px; height: 18px; display: flex; align-items: center;
          justify-content: center; border-radius: 50%; flex-shrink: 0;
        }
        .eod-rank-weak { background: var(--bear); color: #fff; }
        .eod-rank-neutral { background: var(--border-color); color: var(--text-secondary); }

        .eod-driver {
          font-size: 0.68rem; color: var(--accent-primary); margin: 3px 0 2px 24px;
          font-family: var(--font-mono); opacity: 0.9;
        }

        .eod-holdings {
          display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-left: 24px;
        }
        .eod-holding-row {
          font-size: 0.72rem; color: var(--text-secondary); text-decoration: none;
          padding: 2px 6px; border-radius: 4px; transition: all 0.15s;
          border: 1px solid transparent;
        }
        .eod-holding-row:hover {
          background: var(--accent-subtle, rgba(200,155,60,0.12));
          border-color: var(--accent-primary); color: var(--text-primary);
        }

        .eod-shimmer-pill {
          display: inline-block;
          width: 36px;
          height: 12px;
          border-radius: 4px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          vertical-align: middle;
          margin-left: 4px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
