import React, { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import MacroRow from './MacroRow';
import PriceChart from './PriceChart';
import MarketRegimeWidget from './MarketRegimeWidget';
import EconomicCalendar from './EconomicCalendar';
import Watchlist from './Watchlist';

export default function MacroClient() {
  const { data, loading, error } = useMarketData();
  const [activeTab, setActiveTab] = useState<'HOT' | 'RATES' | 'CURRENCY' | 'COMMODITY' | 'CUSTOM'>('HOT');
  const [selectedTicker, setSelectedTicker] = useState('^TNX');

  if (loading || !data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Macro...</div>;
  if (error) return <div className="text-bear" style={{ padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;

  let listData: any[] = [];
  if (activeTab === 'HOT') {
     listData = data.macro.filter(m => m.category === 'volatility' || m.ticker === 'DX-Y.NYB');
  } else if (activeTab === 'RATES') {
     listData = data.macro.filter(m => m.category === 'rates');
  } else if (activeTab === 'COMMODITY') {
     listData = data.macro.filter(m => m.category === 'commodity');
  } else if (activeTab === 'CURRENCY') {
     listData = data.macro.filter(m => m.category === 'currency');
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingBottom: '2rem' }}>
      
      {/* ── Left Column: Regime + List ── */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <MarketRegimeWidget />
        
        <div className="bento-item" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', padding: '0 1rem', flexShrink: 0 }}>
            {[
              { id: 'HOT', label: '🔥 필수 감시' },
              { id: 'RATES', label: '🏦 금리/채권' },
              { id: 'CURRENCY', label: '💵 외환' },
              { id: 'COMMODITY', label: '🛢️ 원자재' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'none', border: 'none', padding: '1rem 0.75rem', cursor: 'pointer',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {listData.map(m => {
                  const isSelected = selectedTicker === m.ticker;
                  return (
                    <div 
                      key={m.ticker} 
                      onClick={() => setSelectedTicker(m.ticker)} 
                      style={{ 
                        cursor: 'pointer', 
                        background: isSelected ? 'rgba(200, 155, 60, 0.1)' : 'transparent', 
                        borderRadius: '4px', 
                        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        padding: '0.25rem 0',
                        transition: 'all 0.2s'
                      }}
                    >
                      <MacroRow ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
                    </div>
                  );
                })}
              </div>
          </div>
        </div>
      </div>

      {/* ── Right Column: Chart + Calendar ── */}
      <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="bento-item" style={{ height: '400px', padding: '1rem' }}>
          <PriceChart ticker={selectedTicker} name={data.macro.find(m => m.ticker === selectedTicker)?.name || 'Macro Data'} />
        </div>
        <div style={{ flex: 1, minHeight: '400px' }}>
          <EconomicCalendar />
        </div>
      </div>

    </div>
  );
}
