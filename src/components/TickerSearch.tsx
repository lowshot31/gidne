import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface Props {
  onNavigate?: (ticker: string) => void;
  onSelect?: (ticker: string, name: string) => void;
  mode?: 'default' | 'macro';
}

// 인기 종목 내장 인덱스 (API 없이도 즉시 자동완성)
const BUILTIN_INDEX: Suggestion[] = [
  // 🇺🇸 미국 대형주
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'UNH', name: 'UnitedHealth Group', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'HD', name: 'Home Depot Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'BAC', name: 'Bank of America', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Company', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'DIS', name: 'Walt Disney Co', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'CRM', name: 'Salesforce Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'SHOP', name: 'Shopify Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'COIN', name: 'Coinbase Global', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'UBER', name: 'Uber Technologies', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'SQ', name: 'Block Inc. (Square)', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'ARM', name: 'Arm Holdings', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'SMCI', name: 'Super Micro Computer', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'MU', name: 'Micron Technology', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'SOFI', name: 'SoFi Technologies', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'MSTR', name: 'MicroStrategy', type: 'EQUITY', exchange: 'NASDAQ' },
  // 🇺🇸 ETF
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', exchange: 'NASDAQ' },
  { symbol: 'IWM', name: 'iShares Russell 2000', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'DIA', name: 'SPDR Dow Jones ETF', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLK', name: 'Technology Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLF', name: 'Financial Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLV', name: 'Health Care Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLE', name: 'Energy Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLI', name: 'Industrial Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLP', name: 'Consumer Staples Select', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLY', name: 'Consumer Discretionary', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLU', name: 'Utilities Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLB', name: 'Materials Select Sector', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLRE', name: 'Real Estate Select', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'XLC', name: 'Communication Services', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'TLT', name: 'iShares 20+Yr Treasury', type: 'ETF', exchange: 'NASDAQ' },
  { symbol: 'HYG', name: 'iShares High Yield Corp', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'SOXL', name: 'Direxion Semi Bull 3X', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ', type: 'ETF', exchange: 'NASDAQ' },
  // 🪙 크립토
  { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'SOL-USD', name: 'Solana USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'XRP-USD', name: 'XRP USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'DOGE-USD', name: 'Dogecoin USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'ADA-USD', name: 'Cardano USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'AVAX-USD', name: 'Avalanche USD', type: 'CRYPTOCURRENCY', exchange: 'CCC' },
  // 📊 주요 지수
  { symbol: '^GSPC', name: 'S&P 500', type: 'INDEX', exchange: 'SNP' },
  { symbol: '^IXIC', name: 'NASDAQ Composite', type: 'INDEX', exchange: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones Industrial', type: 'INDEX', exchange: 'DJI' },
  { symbol: '^VIX', name: 'CBOE Volatility Index', type: 'INDEX', exchange: 'CBOE' },
  { symbol: '^KS11', name: 'KOSPI', type: 'INDEX', exchange: 'KSC' },
  { symbol: '^N225', name: 'Nikkei 225', type: 'INDEX', exchange: 'OSA' },
];

const MACRO_BUILTIN: Suggestion[] = [
  { symbol: '^TNX', name: 'US 10-Yr Treasury', type: 'INDEX', exchange: 'SNP' },
  { symbol: '^VIX', name: 'CBOE Volatility Index', type: 'INDEX', exchange: 'CBOE' },
  { symbol: 'CL=F', name: 'Crude Oil WTI', type: 'FUTURE', exchange: 'NYM' },
  { symbol: 'GC=F', name: 'Gold', type: 'FUTURE', exchange: 'CMX' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index', type: 'INDEX', exchange: 'ICE' },
  { symbol: 'KRW=X', name: 'USD/KRW', type: 'CURRENCY', exchange: 'CCY' },
  { symbol: 'TLT', name: 'iShares 20+Yr Treasury ETF', type: 'ETF', exchange: 'NASDAQ' },
  { symbol: 'M2', name: 'M2 Money Supply (Approx via Proxy)', type: 'INDEX', exchange: '' }, // For UX, though Yahoo has limited M2
];

// 클라이언트 측 로컬 퍼지 검색
function localSearch(q: string, mode: 'default' | 'macro'): Suggestion[] {
  const lower = q.toLowerCase();
  const targetIndex = mode === 'macro' ? [...MACRO_BUILTIN, ...BUILTIN_INDEX] : BUILTIN_INDEX;
  return targetIndex.filter(item =>
    item.symbol.toLowerCase().includes(lower) ||
    item.name.toLowerCase().includes(lower)
  ).slice(0, 8);
}

export default function TickerSearch({ onNavigate, onSelect, mode = 'default' }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // 로컬스토리지에서 최근 검색 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gidne_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 하이브리드 검색: 로컬 먼저 → API 보조
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      // 쿼리가 지워졌을 때 최근 검색어가 있다면 드롭다운 유지
      if (recentSearches.length > 0) setIsOpen(true);
      else setIsOpen(false);
      return;
    }

    // 즉시 로컬 인덱스에서 결과 렌더링 (API 없이도 동작)
    const localResults = localSearch(query, mode);
    setSuggestions(localResults);
    setIsOpen(localResults.length > 0);
    setSelectedIdx(-1);

    // API 폴백: 로컬에서 결과가 부족하면 서버도 시도
    if (localResults.length < 3) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              // 로컬 결과와 병합 (중복 제거)
              const combined = [...localResults];
              const existingSymbols = new Set(localResults.map(s => s.symbol));
              for (const item of data) {
                if (!existingSymbols.has(item.symbol)) {
                  combined.push(item);
                }
              }
              setSuggestions(combined.slice(0, 8));
              setIsOpen(true);
            }
          }
        } catch {
          // API 실패해도 로컬 결과는 이미 표시됨 — 무시
        }
      }, 400);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = (s: Suggestion) => {
      // 최근 검색어 저장 로직
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.symbol !== s.symbol);
      const updated = [s, ...filtered].slice(0, 6);
      localStorage.setItem('gidne_recent_searches', JSON.stringify(updated));
      return updated;
    });

    setIsOpen(false);
    setQuery('');
    if (onSelect) {
      onSelect(s.symbol, s.name);
    } else if (onNavigate) {
      onNavigate(s.symbol);
    } else {
      let navSymbol = s.symbol;
      if (s.type === 'CRYPTOCURRENCY' && s.symbol.endsWith('-USD')) {
        navSymbol = s.symbol.replace('-USD', 'USDT');
      }
      window.location.href = `/chart/${navSymbol}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    // 현재 보여지고 있는 목록 (쿼리가 없으면 최근 검색어, 있으면 제안 목록)
    const activeList = !query.trim() ? recentSearches : suggestions;
    if (activeList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, activeList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0 && selectedIdx < activeList.length) {
      e.preventDefault();
      navigate(activeList[selectedIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'EQUITY': return '주식';
      case 'ETF': return 'ETF';
      case 'CRYPTOCURRENCY': return '크립토';
      case 'INDEX': return '지수';
      case 'CURRENCY': return '환율';
      case 'FUTURE': return '선물';
      default: return type;
    }
  };

  return (
    <div ref={containerRef} className="ticker-search-container">
      <div className="search-input-wrapper">
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && suggestions.length > 0) setIsOpen(true);
            else if (!query.trim() && recentSearches.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'macro' ? "매크로 지표, 환율 (예: ^VIX, KRW=X, CL=F)" : "종목 검색 (예: AAPL, TSLA, NVDA)"}
          className="search-input"
          autoComplete="off"
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setSuggestions([]); }} aria-label="Clear">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {isOpen && (!query.trim() ? recentSearches.length > 0 : suggestions.length > 0) && (
        <ul className="search-dropdown">
          {!query.trim() && recentSearches.length > 0 && (
             <div className="search-dropdown-header" style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>최근 검색 내역</div>
          )}
          {(!query.trim() ? recentSearches : suggestions).map((s, idx) => (
            <li
              key={s.symbol}
              className={`search-item ${idx === selectedIdx ? 'selected' : ''}`}
              onClick={() => navigate(s)}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              <div className="search-item-left" style={{ alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: '#fff' }}>{s.symbol.charAt(0)}</span>
                  <img 
                    src={`https://assets.parqet.com/logos/symbol/${s.symbol}?format=png`} 
                    alt="" 
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff', zIndex: 1 }} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                </div>
                <strong>{s.symbol}</strong>
                <span className="search-item-name">{s.name}</span>
              </div>
              <span className="search-item-badge">{typeLabel(s.type)}</span>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .ticker-search-container {
          position: relative;
          width: 100%;
          max-width: 500px;
        }
        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--overlay);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.75rem;
          gap: 0.5rem;
          transition: border-color 0.2s ease;
        }
        .search-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 12px rgba(0, 242, 255, 0.15);
        }
        .search-icon {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .search-input-wrapper:focus-within .search-icon {
          color: var(--accent-primary);
        }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
        }
        .search-input::placeholder {
          color: var(--text-muted);
        }
        .search-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .search-clear:hover {
          color: var(--text-primary);
          background: var(--overlay-hover);
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--tooltip-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          list-style: none;
          margin: 0;
          padding: 0.25rem 0;
          z-index: 100;
          max-height: 320px;
          overflow-y: auto;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .search-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 0.75rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .search-item:hover,
        .search-item.selected {
          background: var(--card-bg-hover);
        }
        .search-item-left {
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
        }
        .search-item-left strong {
          font-family: var(--font-mono);
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .search-item-name {
          color: var(--text-muted);
          font-size: 0.8rem;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .search-item-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--overlay-hover);
          color: var(--accent-secondary);
          font-weight: 500;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
