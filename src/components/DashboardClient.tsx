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
import MacroRow from './MacroRow';
import CryptoLive from './CryptoLive';
import MarketBreadth from './MarketBreadth';
import Watchlist from './Watchlist';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'pulse', x: 0, y: 0, w: 12, h: 3, minW: 2, minH: 3 },
    { i: 'macro', x: 0, y: 3, w: 3, h: 7, minW: 2, minH: 4 },
    { i: 'chart', x: 3, y: 3, w: 6, h: 7, minW: 2, minH: 4 },
    { i: 'rs', x: 9, y: 3, w: 3, h: 7, minW: 2, minH: 6 },
    { i: 'crypto', x: 0, y: 10, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'sector', x: 3, y: 10, w: 6, h: 7, minW: 2, minH: 4 },
    { i: 'breadth', x: 9, y: 10, w: 3, h: 5, minW: 2, minH: 3 },
    { i: 'watchlist', x: 0, y: 14, w: 3, h: 5, minW: 2, minH: 3 },
  ]
};

// 레이아웃 버전: DEFAULT_LAYOUTS가 변경될 때마다 이 숫자를 올려야 함
const LAYOUT_VERSION = 5;

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
      try { setLayouts(JSON.parse(savedLayout)); } catch(e) {}
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

  if (error) {
    return (
      <div className="bento-item bg-bear text-primary" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>데이터 로딩 실패</h2>
        <p>{error}</p>
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
          <div className="drag-handle" style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <MarketPulse data={data.marketPulse} />
        </div>
        
        <div key="macro" className="widget-wrapper macro-focus-card bento-item">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <h3 className="text-secondary mb-md">MACRO FOCUS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
            {data.macro.map(m => (
              <MacroRow key={m.ticker} ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.5', margin: 0 }}>
              {new Date(data.meta.lastUpdated).toLocaleTimeString()} · {data.meta.isMarketOpen ? '장중 30s' : '장외 5m'}
            </p>
          </div>
        </div>

        <div key="sector" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <SectorBar sectors={data.sectors} />
        </div>

        <div key="rs" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <RSLeaderboard sectors={data.sectors} />
        </div>

        <div key="crypto" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <CryptoLive />
        </div>

        <div key="chart" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <PriceChart ticker="SPY" name="S&P 500" />
        </div>

        <div key="breadth" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <MarketBreadth sectors={data.sectors} macro={data.macro} />
        </div>

        <div key="watchlist" className="widget-wrapper">
          <div className="drag-handle" style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10 }}>≡</div>
          <Watchlist />
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
          cursor: grab;
          color: var(--text-muted);
          opacity: 0;
          transition: opacity 0.2s;
          padding: 4px;
          line-height: 1;
        }
        .drag-handle:active {
          cursor: grabbing;
        }
        .widget-wrapper:hover .drag-handle {
          opacity: 1;
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
          background: rgba(30, 30, 40, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 999px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.8rem;
          font-family: var(--font-sans);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          transition: all 0.25s ease;
        }
        .fab-reset:hover {
          background: rgba(40, 40, 55, 0.95);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.5);
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
