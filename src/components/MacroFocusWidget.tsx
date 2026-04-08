import React, { useState, useEffect } from 'react';
import MacroRow from './MacroRow';
import type { MacroData } from '../lib/types';
import TickerSearch from './TickerSearch';
import SegmentedControl from './SegmentedControl';

interface Props {
  presetData: MacroData[];
}

interface CustomItem {
  ticker: string;
  name: string;
}

export default function MacroFocusWidget({ presetData }: Props) {
  const [activeTab, setActiveTab] = useState<'HOT' | 'RATES' | 'CURRENCY' | 'COMMODITY' | 'CUSTOM'>('HOT');
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
    { id: 'HOT', label: '주요 지표' },
    { id: 'RATES', label: '금리·채권' },
    { id: 'CURRENCY', label: '외환' },
    { id: 'COMMODITY', label: '원자재' },
    { id: 'CUSTOM', label: '내 지표' }
  ] as const;

  const renderContent = () => {
    if (activeTab === 'HOT') {
      const hotTickers = [
        '^VIX',     // S&P500 공포지수
        '^VVIX',    // VIX 변동성 
        '^SKEW',    // 블랙스완 위험도
        'DX-Y.NYB', // 달러 인덱스
        '^TNX',     // 미 10년물 국채 
        'KRW=X',    // 원/달러 환율
        'CL=F',     // WTI
        'BZ=F'      // 브렌트유
      ];
      const hotTickersData = hotTickers.map(t => presetData.find(m => m.ticker === t)).filter(Boolean) as MacroData[];

      return hotTickersData.map((m: MacroData) => (
        <div key={m.ticker} className="gidne-list-row" style={{ padding: '0.25rem 0.5rem', cursor: 'default' }}>
          <MacroRow ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
        </div>
      ));
    }
    if (activeTab === 'RATES') {
      return presetData
        .filter(m => m.category === 'rates')
        .map(m => (
        <div key={m.ticker} className="gidne-list-row" style={{ padding: '0.25rem 0.5rem', cursor: 'default' }}>
          <MacroRow ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
        </div>
      ));
    }
    if (activeTab === 'CURRENCY') {
      return presetData
        .filter(m => m.category === 'currency')
        .map(m => (
        <div key={m.ticker} className="gidne-list-row" style={{ padding: '0.25rem 0.5rem', cursor: 'default' }}>
          <MacroRow ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
        </div>
      ));
    }
    if (activeTab === 'COMMODITY') {
      return presetData
        .filter(m => m.category === 'commodity')
        .map(m => (
        <div key={m.ticker} className="gidne-list-row" style={{ padding: '0.25rem 0.5rem', cursor: 'default' }}>
          <MacroRow ticker={m.ticker} name={m.name} price={m.price} changePercent={m.changePercent} />
        </div>
      ));
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
                <div key={item.ticker} className="gidne-list-row" style={{ padding: '0.25rem 0.5rem', cursor: 'default', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
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

      <div style={{ marginBottom: '0.75rem', flexShrink: 0, display: 'flex', flexWrap: 'wrap' }}>
        <SegmentedControl tabs={tabs as any} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as any)} />
      </div>

      {isAdding && activeTab === 'CUSTOM' && (
        <div style={{ marginBottom: '0.5rem', flexShrink: 0 }}>
          <TickerSearch 
            mode="macro"
            onSelect={(ticker, name) => handleAddCustom(ticker, name)} 
          />
        </div>
      )}

      <div className="gidne-list-container" style={{ flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
}
