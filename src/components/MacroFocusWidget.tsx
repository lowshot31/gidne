import React, { useState, useEffect } from 'react';
import MacroRow from './MacroRow';
import type { MacroData } from '../lib/types';
import TickerSearch from './TickerSearch';

interface Props {
  presetData: MacroData[];
}

interface CustomItem {
  ticker: string;
  name: string;
}

export default function MacroFocusWidget({ presetData }: Props) {
  const [activeTab, setActiveTab] = useState<'HOT' | 'RATES' | 'COMMODITY' | 'CUSTOM'>('HOT');
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customQuotes, setCustomQuotes] = useState<Record<string, { price: number; changePercent: number }>>({});
  const [isAdding, setIsAdding] = useState(false);
  const lastFetchTime = React.useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('gidne_macro_custom');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(i => i && typeof i.ticker === 'string')) {
          setCustomItems(parsed);
        } else {
          localStorage.removeItem('gidne_macro_custom');
        }
      } catch (e) {
        localStorage.removeItem('gidne_macro_custom');
      }
    }
  }, []);

  const saveCustomItems = (items: CustomItem[]) => {
    setCustomItems(items);
    localStorage.setItem('gidne_macro_custom', JSON.stringify(items));
  };

  useEffect(() => {
    if (activeTab === 'CUSTOM' && customItems.length > 0) {
      const now = Date.now();
      // 1분 이내 동일 탭 전환 시 재요청 방지 (메모리 캐싱)
      if (now - lastFetchTime.current < 60000 && Object.keys(customQuotes).length > 0) return;

      const tickers = customItems.map(item => item.ticker).join(',');
      fetch(`/api/quotes?tickers=${encodeURIComponent(tickers)}`)
        .then(res => res.json())
        .then(data => {
          setCustomQuotes(data);
          lastFetchTime.current = Date.now();
        })
        .catch(console.error);
    }
  }, [activeTab, customItems]);

  const handleAddCustom = (symbol: string, name: string) => {
    if (customItems.some(i => i.ticker === symbol)) return;
    saveCustomItems([...customItems, { ticker: symbol, name }]);
    setIsAdding(false);
  };

  const handleRemoveCustom = (symbol: string) => {
    saveCustomItems(customItems.filter(i => i.ticker !== symbol));
  };

  const tabs = [
    { id: 'HOT', label: '🔥 HOT' },
    { id: 'RATES', label: '💸 금리/환율' },
    { id: 'COMMODITY', label: '🛢️ 원자재' },
    { id: 'CUSTOM', label: '⭐️ 내 지표' }
  ] as const;

  const renderContent = () => {
    if (activeTab === 'HOT') {
      // 1. 무슨 일이 있어도 봐야 하는 필수 뼈대 지표
      const mustHaves = ['^VIX', '^TNX', 'DX-Y.NYB'];
      const mustHavesData = presetData.filter(m => mustHaves.includes(m.ticker));
      
      // 2. 나머지 지표 중에서 오늘 하루 변동성이 가장 극심한 '진짜 HOT한' 지표 5개 추출
      const rest = presetData.filter(m => !mustHaves.includes(m.ticker));
      const topMovers = [...rest].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);
      
      // 필수 지표 + 오늘 가장 핫한 지표 조합
      const hotTickersData = [...mustHavesData, ...topMovers];

      return hotTickersData.map(m => <MacroRow key={m.ticker} ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />);
    }
    if (activeTab === 'RATES') {
      return presetData
        .filter(m => m.category === 'rates' || m.category === 'currency')
        .map(m => <MacroRow key={m.ticker} ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />);
    }
    if (activeTab === 'COMMODITY') {
      return presetData
        .filter(m => m.category === 'commodity')
        .map(m => <MacroRow key={m.ticker} ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />);
    }
    if (activeTab === 'CUSTOM') {
      return (
        <>
          {customItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              상단의 + 버튼을 눌러 나만의 지표를 추가하세요.<br/>(예: M2 통화량, BDI 운임지수 등)
            </div>
          ) : (
            customItems.map(item => {
              const q = customQuotes[item.ticker];
              return (
                <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{ flex: 1 }}>
                    <MacroRow 
                      ticker={item.ticker} 
                      name={item.name} 
                      price={q?.price || 0} 
                      changePercent={q?.changePercent || 0} 
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveCustom(item.ticker)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                  >×</button>
                </div>
              );
            })
          )}
        </>
      );
    }
  };

  return (
    <div className="macro-focus-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>
        <h3 className="text-secondary" style={{ margin: 0 }}>MACRO FOCUS</h3>
        <button 
          onClick={() => {
            setActiveTab('CUSTOM');
            setIsAdding(!isAdding);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}
        >
          +
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexShrink: 0, overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`,
              borderRadius: '4px',
              padding: '0.2rem 0.4rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isAdding && activeTab === 'CUSTOM' && (
        <div style={{ marginBottom: '0.5rem', flexShrink: 0 }}>
          <TickerSearch 
            mode="macro"
            onSelect={(ticker, name) => handleAddCustom(ticker, name)} 
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}
