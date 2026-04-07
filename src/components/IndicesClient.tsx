import React, { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import MarketPulse from './MarketPulse';
import PriceChart from './PriceChart';
import GlobalMarketMap from './GlobalMarketMap';
import RelativeStrengthBoard from './RelativeStrengthBoard';
import SegmentedControl from './SegmentedControl';
import { useFlash } from '../hooks/useFlash';
import type { IndexQuote } from '../lib/types';

type RegionFilter = 'all' | 'americas' | 'europe' | 'asia' | 'emerging';

// Sub-component to manage flash effect per row
function IndexRow({ idx, isSelected, onClick }: { idx: IndexQuote, isSelected: boolean, onClick: () => void }) {
  const flash = useFlash(idx.price);
  const isBull = idx.changePercent >= 0;
  const changeBg = isBull ? 'var(--bull-bg)' : 'var(--bear-bg)';
  
  return (
    <div 
      className={flash}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.5rem',
        cursor: 'pointer',
        background: isSelected ? 'var(--card-bg-hover)' : 'transparent',
        borderRadius: '6px',
        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
        transition: 'all 0.2s ease',
        marginBottom: '2px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{idx.flag}</span>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx.name}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{idx.symbol.replace('^', '')}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: isBull ? 'var(--bull)' : 'var(--bear)',
          background: changeBg,
          padding: '1px 6px',
          borderRadius: '4px',
          marginTop: '2px'
        }}>
          {isBull ? '+' : ''}{idx.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function IndicesClient() {
  const { data, loading, error } = useMarketData();
  const [selectedIndex, setSelectedIndex] = useState('^GSPC');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [sortConfig, setSortConfig] = useState<{key: 'price' | 'change', dir: 'asc'|'desc'}>({ key: 'change', dir: 'desc' });

  // Custom Pulse Logic for Indices (Nasdaq vs S&P 500)
  const getIndicesPulse = () => {
    if (!data?.indices) return { score: 50, emoji: '⚖️', label: 'NEUTRAL', summary: 'Loading market data...', bullishSectors: 0, totalSectors: 0, rsLeader: { name: 'N/A', ticker: 'N/A', changePercent: 0 } };
    const sp = data.indices.find(i => i.symbol === '^GSPC')?.changePercent || 0;
    const nq = data.indices.find(i => i.symbol === '^IXIC')?.changePercent || 0;
    
    let baseScore = 50 + (sp * 15);
    let techPremium = (nq - sp) * 10;
    let score = Math.max(0, Math.min(100, Math.round(baseScore + techPremium)));

    let emoji = '⚖️'; let label = 'NEUTRAL'; let summary = 'S&P 500 and Nasdaq are relatively flat.';
    if (score >= 70) {
      emoji = '🚀'; label = 'STRONG RISK-ON'; 
      summary = nq > sp + 0.2 ? 'Nasdaq is leading the broad market rally, signaling strong risk appetite.' : 'Broad market is rallying strongly across major indices.';
    } else if (score >= 55) {
      emoji = '🟢'; label = 'MODERATE BUY';
      summary = nq > sp + 0.2 ? 'Tech strength is keeping the broader market afloat.' : 'Market is showing stable upward momentum.';
    } else if (score <= 30) {
      emoji = '🩸'; label = 'SEVERE SELLOFF';
      summary = nq < sp - 0.2 ? 'Heavy tech selling is dragging down the entire market.' : 'Broad based selloff across tech and value equities.';
    } else if (score <= 45) {
      emoji = '🔴'; label = 'RISK-OFF';
      summary = nq < sp - 0.2 ? 'Value rotation in progress: Tech is lagging behind the S&P 500.' : 'Market is facing downward pressure overall.';
    } else {
      if (sp > 0.1 && nq < -0.1) summary = 'Mixed market: Value indices hold positive while tech struggles.';
      else if (sp < -0.1 && nq > 0.1) summary = 'Mixed market: Tech outperforms despite broader market weakness.';
    }
    return { 
      score, emoji, label, summary, 
      bullishSectors: 0, totalSectors: 0, rsLeader: { name: 'N/A', ticker: 'N/A', changePercent: 0 } 
    };
  };

  if (loading || !data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Indices...</div>;
  if (error) return <div className="text-bear" style={{ padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;

  let filteredIndices = [...(data.indices || [])];
  if (regionFilter !== 'all') {
    filteredIndices = filteredIndices.filter(idx => idx.region === regionFilter);
  }

  filteredIndices.sort((a, b) => {
    const valA = sortConfig.key === 'change' ? a.changePercent : a.price;
    const valB = sortConfig.key === 'change' ? b.changePercent : b.price;
    return sortConfig.dir === 'desc' ? valB - valA : valA - valB;
  });

  const selectedQuote = data.indices?.find(i => i.symbol === selectedIndex) || data.indices?.[0];

  const handleSort = (key: 'price' | 'change') => {
    if (sortConfig.key === key) {
      setSortConfig({ key, dir: sortConfig.dir === 'desc' ? 'asc' : 'desc' });
    } else {
      setSortConfig({ key, dir: 'desc' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingBottom: '2rem' }}>
      
      {/* ZONE 1: Global Market Map & Hero */}
      <GlobalMarketMap 
        indices={data.indices || []} 
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
      />

      <div className="indices-bottom-layout">
        
        {/* LEFT COLUMN: Data Table (Zone 2) */}
        <div className="indices-panel glass-panel">
          <div className="panel-header">
            <h3>글로벌 인덱스 보드</h3>
            <SegmentedControl 
              tabs={[
                { id: 'all', label: '🌏 전체' },
                { id: 'americas', label: '🇺🇸 미주' },
                { id: 'europe', label: '🇪🇺 유럽' },
                { id: 'asia', label: '🇰🇷 아시아' },
                { id: 'emerging', label: '🌍 신흥국' }
              ]}
              activeTab={regionFilter}
              onTabChange={(id) => setRegionFilter(id as RegionFilter)}
              size="sm"
            />
          </div>
          
          <div className="indices-list-container" style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>지수명</span>
              <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
                <span onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>현재가 {sortConfig.key === 'price' ? (sortConfig.dir === 'desc' ? '▼' : '▲') : ''}</span>
                <span onClick={() => handleSort('change')} style={{ cursor: 'pointer' }}>변동률 {sortConfig.key === 'change' ? (sortConfig.dir === 'desc' ? '▼' : '▲') : ''}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredIndices.map(idx => (
                <IndexRow 
                  key={idx.symbol}
                  idx={idx}
                  isSelected={selectedIndex === idx.symbol}
                  onClick={() => setSelectedIndex(idx.symbol)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chart (Zone 3) & Auxiliary (Zone 4) */}
        <div className="indices-right-col">
          <div className="main-chart-wrapper glass-panel">
            {selectedQuote && (
              <PriceChart 
                ticker={selectedQuote.symbol} 
                name={`${selectedQuote.flag} ${selectedQuote.name}`} 
              />
            )}
          </div>
          <div className="aux-panel">
             <RelativeStrengthBoard indices={data.indices || []} />
          </div>
        </div>
      </div>

      <style>{`
        .glass-panel {
          background: rgba(200, 200, 200, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }
        [data-theme='light'] .glass-panel {
          background: #ffffff;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .indices-bottom-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 1.2rem;
          height: 600px;
        }

        @media (max-width: 1024px) {
          .indices-bottom-layout {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .indices-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .panel-header h3 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .indices-list-container {
          padding-right: 0.5rem;
        }
        .indices-list-container::-webkit-scrollbar { width: 4px; }
        .indices-list-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }


        .indices-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          height: 100%;
        }

        .main-chart-wrapper {
          flex: 1;
          min-height: 480px;
          padding: 0;
          overflow: hidden;
        }
        .main-chart-wrapper > div {
          height: 100% !important;
          border: none !important;
        }

        .aux-panel {
          flex-shrink: 0;
          height: auto;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .aux-panel > * {
          flex: 1;
        }

        @media (max-width: 768px) {
          .aux-panel {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
