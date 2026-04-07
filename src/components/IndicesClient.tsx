import React, { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import MarketPulse from './MarketPulse';
import PriceChart from './PriceChart';
import GlobalMarketMap from './GlobalMarketMap';
import RelativeStrengthBoard from './RelativeStrengthBoard';
import { useFlash } from '../hooks/useFlash';
import type { IndexQuote } from '../lib/types';

type RegionFilter = 'all' | 'americas' | 'europe' | 'asia' | 'emerging';

// Sub-component to manage flash effect per row
function IndexRow({ idx, isSelected, onClick }: { idx: IndexQuote, isSelected: boolean, onClick: () => void }) {
  const flash = useFlash(idx.price);
  const isBull = idx.changePercent >= 0;
  
  return (
    <tr 
      className={`${isSelected ? 'selected' : ''} ${flash}`}
      onClick={onClick}
    >
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{idx.flag}</span>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)'}}>{idx.name}</span>
        </div>
      </td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>
        {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={isBull ? 'text-bull' : 'text-bear'} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        {isBull ? '+' : ''}{idx.changePercent.toFixed(2)}%
      </td>
    </tr>
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
            <div className="region-tabs">
              <button className={regionFilter === 'all' ? 'active' : ''} onClick={() => setRegionFilter('all')}>전체</button>
              <button className={regionFilter === 'americas' ? 'active' : ''} onClick={() => setRegionFilter('americas')}>미주</button>
              <button className={regionFilter === 'europe' ? 'active' : ''} onClick={() => setRegionFilter('europe')}>유럽</button>
              <button className={regionFilter === 'asia' ? 'active' : ''} onClick={() => setRegionFilter('asia')}>아시아</button>
              <button className={regionFilter === 'emerging' ? 'active' : ''} onClick={() => setRegionFilter('emerging')}>신흥국</button>
            </div>
          </div>
          
          <div className="indices-table-container">
            <table className="indices-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>지수명</th>
                  <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                    현재가 {sortConfig.key === 'price' ? (sortConfig.dir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th onClick={() => handleSort('change')} style={{ cursor: 'pointer' }}>
                    변동률 {sortConfig.key === 'change' ? (sortConfig.dir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIndices.map(idx => (
                  <IndexRow 
                    key={idx.symbol}
                    idx={idx}
                    isSelected={selectedIndex === idx.symbol}
                    onClick={() => setSelectedIndex(idx.symbol)}
                  />
                ))}
              </tbody>
            </table>
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
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .panel-header h3 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .region-tabs {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.2);
          padding: 3px;
          border-radius: 6px;
        }
        [data-theme='light'] .region-tabs { background: rgba(0,0,0,0.05); }
        .region-tabs button {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .region-tabs button.active {
          background: var(--accent-primary);
          color: #fff;
          font-weight: 600;
        }

        .indices-table-container {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }
        .indices-table-container::-webkit-scrollbar { width: 4px; }
        .indices-table-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .indices-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .indices-table th {
          text-align: right;
          color: var(--text-muted);
          font-weight: 500;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          background: var(--bg-color, #111111);
          z-index: 2;
        }
        [data-theme='light'] .indices-table th { background: #ffffff; }

        .indices-table td {
          padding: 10px 4px;
          border-bottom: 1px solid var(--border-color);
          text-align: right;
        }
        .indices-table tr {
          cursor: pointer;
          transition: background 0.15s;
        }
        .indices-table tr:hover {
          background: rgba(200, 200, 200, 0.05);
        }
        .indices-table tr.selected {
          background: rgba(200, 155, 60, 0.1);
        }
        
        .indices-table tr.flash-up {
          background-color: rgba(38, 166, 154, 0.25) !important;
          transition: background-color 0s;
        }
        .indices-table tr.flash-down {
          background-color: rgba(239, 83, 80, 0.25) !important;
          transition: background-color 0s;
        }

        [data-theme='light'] .indices-table tr:hover { background: rgba(0,0,0,0.02); }
        [data-theme='light'] .indices-table tr.selected { background: rgba(200, 155, 60, 0.15); }

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
