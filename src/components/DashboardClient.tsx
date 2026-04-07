import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useMarketData } from '../hooks/useMarketData';
import MarketPulse from './MarketPulse';
import SectorBar from './SectorBar';
import RSLeaderboard from './RSLeaderboard';
import SkeletonCard from './SkeletonCard';
import PriceChart from './PriceChart';
import MacroFocusWidget from './MacroFocusWidget';
import CryptoLive from './CryptoLive';
import MarketBreadth from './MarketBreadth';
import Watchlist from './Watchlist';
import EconomicCalendar from './EconomicCalendar';
import WatchlistNews from './WatchlistNews';
import EODBriefing from './EODBriefing';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'pulse', x: 0, y: 0, w: 12, h: 3, minW: 2, minH: 3 },
    { i: 'macro', x: 0, y: 3, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'chart', x: 3, y: 3, w: 6, h: 7, minW: 2, minH: 4 },
    { i: 'rs', x: 9, y: 3, w: 3, h: 6, minW: 2, minH: 5 },
    { i: 'watchlist', x: 0, y: 9, w: 3, h: 5, minW: 2, minH: 3 },
    { i: 'sector', x: 3, y: 10, w: 6, h: 6, minW: 2, minH: 4 },
    { i: 'breadth', x: 9, y: 9, w: 3, h: 5, minW: 2, minH: 3 },
    { i: 'crypto', x: 0, y: 14, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'news', x: 3, y: 16, w: 3, h: 6, minW: 3, minH: 4 },
    { i: 'eod', x: 6, y: 16, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'calendar', x: 9, y: 14, w: 3, h: 5, minW: 2, minH: 4 },
  ],
  md: [
    { i: 'pulse', x: 0, y: 0, w: 10, h: 3, minW: 2, minH: 3 },
    { i: 'chart', x: 0, y: 3, w: 10, h: 7, minW: 2, minH: 4 },
    { i: 'macro', x: 0, y: 10, w: 5, h: 7, minW: 2, minH: 4 },
    { i: 'rs', x: 5, y: 10, w: 5, h: 7, minW: 2, minH: 6 },
    { i: 'sector', x: 0, y: 17, w: 10, h: 7, minW: 2, minH: 4 },
    { i: 'watchlist', x: 0, y: 24, w: 10, h: 6, minW: 2, minH: 3 },
    { i: 'crypto', x: 0, y: 30, w: 5, h: 6, minW: 2, minH: 3 },
    { i: 'breadth', x: 5, y: 30, w: 5, h: 5, minW: 2, minH: 3 },
    { i: 'calendar', x: 5, y: 35, w: 5, h: 6, minW: 2, minH: 4 },
    { i: 'news', x: 0, y: 36, w: 5, h: 6, minW: 2, minH: 3 },
    { i: 'eod', x: 5, y: 36, w: 5, h: 6, minW: 2, minH: 3 },
  ],
  sm: [
    { i: 'pulse', x: 0, y: 0, w: 6, h: 3 },
    { i: 'chart', x: 0, y: 3, w: 6, h: 7 },
    { i: 'rs', x: 0, y: 10, w: 6, h: 7 },
    { i: 'macro', x: 0, y: 17, w: 6, h: 7 },
    { i: 'sector', x: 0, y: 24, w: 6, h: 8 },
    { i: 'watchlist', x: 0, y: 32, w: 6, h: 6 },
    { i: 'breadth', x: 0, y: 38, w: 6, h: 5 },
    { i: 'crypto', x: 0, y: 43, w: 6, h: 6 },
    { i: 'calendar', x: 0, y: 49, w: 6, h: 6 },
    { i: 'news', x: 0, y: 55, w: 6, h: 6 },
    { i: 'eod', x: 0, y: 61, w: 6, h: 6 },
  ]
};

// 레이아웃 버전: DEFAULT_LAYOUTS가 변경될 때마다 이 숫자를 올려야 함
const LAYOUT_VERSION = 14;

export default function DashboardClient() {
  const { data, loading, error } = useMarketData();
  const [layouts, setLayouts] = useState<any>(DEFAULT_LAYOUTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem('gidne_layout_version');
    const savedLayout = localStorage.getItem('gidne_layout');

    // 레이아웃 버전이 다르면 자동 초기화
    if (savedVersion !== String(LAYOUT_VERSION)) {
      localStorage.removeItem('gidne_layout');
      localStorage.setItem('gidne_layout_version', String(LAYOUT_VERSION));
      setLayouts(DEFAULT_LAYOUTS);
    } else if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed && typeof parsed === 'object') {
          setLayouts(parsed);
        } else {
          localStorage.removeItem('gidne_layout');
          setLayouts(DEFAULT_LAYOUTS);
        }
      } catch(e) {
        console.warn('Layout localStorage corrupted, resetting.');
        localStorage.removeItem('gidne_layout');
        setLayouts(DEFAULT_LAYOUTS);
      }
    }
    setMounted(true);
  }, []);

  const handleLayoutChange = (layout: Layout, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('gidne_layout', JSON.stringify(allLayouts));
  };

  if (!mounted) return null; // hydration 에러 방지

  if (loading || !data) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
        Loading Dashboard Widgets...
      </div>
    );
  }

  if (error || (!data && !loading)) {
    return (
      <div style={{ paddingBottom: '2rem' }}>
        <div className="bento-item" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 4s linear infinite', opacity: 0.5 }}>⏳</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontWeight: 700, letterSpacing: '0.05em' }}>시황 데이터 집계 중</h2>
          <p className="text-muted" style={{ maxWidth: '400px', margin: 0, lineHeight: '1.6' }}>
            백그라운드에서 실시간 데이터를 Redis에 캐싱하고 있습니다.<br/>
            잠시만 기다려주시면 자동으로 새로고침됩니다.
            {error && <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--bear)' }}>({error})</span>}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '1rem', background: 'var(--accent-primary)', color: 'white', 
              border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', 
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
            }}
          >
            수동 새로고침
          </button>
        </div>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const resetLayout = () => {
    localStorage.removeItem('gidne_layout');
    setLayouts(DEFAULT_LAYOUTS);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
      >
        <div key="pulse" className="widget-wrapper">
          <div className="drag-handle"></div>
          <MarketPulse data={data.marketPulse} />
        </div>
        
        <div key="macro" className="widget-wrapper macro-focus-card bento-item" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="drag-handle"></div>
          <MacroFocusWidget presetData={data.macro} />
          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.5', margin: 0 }}>
              {new Date(data.meta.lastUpdated).toLocaleTimeString()} · {data.meta.isMarketOpen ? '장중 30s' : '장외 5m'}
            </p>
          </div>
        </div>

        <div key="sector" className="widget-wrapper">
          <div className="drag-handle"></div>
          <SectorBar sectors={data.sectors} />
        </div>

        <div key="rs" className="widget-wrapper">
          <div className="drag-handle"></div>
          <RSLeaderboard sectors={data.sectors} />
        </div>

        <div key="crypto" className="widget-wrapper">
          <div className="drag-handle"></div>
          <CryptoLive />
        </div>

        <div key="chart" className="widget-wrapper">
          <div className="drag-handle"></div>
          <PriceChart />
        </div>

        <div key="breadth" className="widget-wrapper">
          <div className="drag-handle"></div>
          <MarketBreadth sectors={data.sectors} macro={data.macro} />
        </div>

        <div key="watchlist" className="widget-wrapper">
          <div className="drag-handle"></div>
          <Watchlist />
        </div>

        <div key="calendar" className="widget-wrapper">
          <div className="drag-handle"></div>
          <EconomicCalendar />
        </div>

        <div key="news" className="widget-wrapper">
          <div className="drag-handle"></div>
          <WatchlistNews />
        </div>

        <div key="eod" className="widget-wrapper">
          <div className="drag-handle"></div>
          <EODBriefing sectors={data.sectors} macro={data.macro} holdings={data.holdings} indices={data.indices} />
        </div>
      </ResponsiveGridLayout>

      {/* FAB: 레이아웃 초기화 */}
      <button className="fab-reset" onClick={resetLayout} title="레이아웃 초기화">
        <span className="fab-icon">↻</span>
        <span className="fab-label">레이아웃 초기화</span>
      </button>

      <style>{`
        .widget-wrapper {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .widget-wrapper:not(.bento-item) > div:not(.drag-handle) {
          height: 100%;
        }
        .drag-handle {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 6px;
          background-color: var(--text-muted);
          border-radius: 999px;
          cursor: grab;
          opacity: 0;
          transition: opacity 0.2s ease, background-color 0.2s ease;
          z-index: 50;
        }
        .drag-handle:active {
          cursor: grabbing;
          background-color: var(--accent-primary);
        }
        .widget-wrapper:hover .drag-handle {
          opacity: 0.4;
        }
        .drag-handle:hover {
          opacity: 0.8;
          background-color: var(--accent-primary);
        }

        /* FAB — 챗봇 스타일 플로팅 버튼 */
        .fab-reset {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 999px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.8rem;
          font-family: var(--font-body);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.25s ease;
        }
        .fab-reset:hover {
          background: var(--card-bg-hover);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.25);
        }
        .fab-icon {
          font-size: 1.1rem;
          line-height: 1;
        }
        .fab-label {
          white-space: nowrap;
        }

        .mb-md { margin-bottom: var(--gap-sm); }
        .text-secondary { color: var(--text-secondary); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
