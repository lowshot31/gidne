import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../lib/watchlist';
import type { WatchlistItem } from '../lib/watchlist';
import { useFinnhubStream } from '../hooks/useFinnhubStream';
import { useFlash } from '../hooks/useFlash';

interface QuoteData {
  price: number;
  changePercent: number;
  name: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

/**
 * 개인 워치리스트 위젯
 * - LocalStorage CRUD
 * - 실시간 시세 조회 (Yahoo Finance API)
 * - 자동완성 검색 기능
 */
export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Map<string, QuoteData>>(new Map());
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 자동완성 관련
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // LocalStorage에서 워치리스트 로드
  useEffect(() => {
    setItems(getWatchlist());
  }, []);

  // Finnhub 실시간 스트림 연동
  const finnhubPrices = useFinnhubStream(items.map(i => i.ticker));

  // 시세 데이터 fetch — 배치 API (한 번에 모든 종목 조회)
  const fetchQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    try {
      const res = await fetch(`/api/quotes?tickers=${tickers.map(encodeURIComponent).join(',')}`);
      if (!res.ok) return;
      const data: Record<string, QuoteData> = await res.json();
      const newQuotes = new Map<string, QuoteData>();
      Object.entries(data).forEach(([symbol, q]: [string, any]) => {
        newQuotes.set(symbol, {
          price: q.price ?? 0,
          changePercent: q.changePercent ?? 0,
          name: q.name ?? symbol,
        });
      });
      setQuotes(newQuotes);
    } catch (err) {
      console.error('[Watchlist] batch fetch error:', err);
    }
  }, []);

  // 워치리스트 시세 폴링 (5초 — 배치 API로 요청 수 최소화)
  useEffect(() => {
    const tickers = items.map(i => i.ticker);
    fetchQuotes(tickers);
    const interval = setInterval(() => fetchQuotes(tickers), 5000);
    return () => clearInterval(interval);
  }, [items, fetchQuotes]);

  // 자동완성 검색 (디바운스 300ms)
  const searchTickers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
        setSelectedIdx(-1);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInputValue(val);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTickers(val), 300);
  };

  const handleSelectSuggestion = (symbol: string) => {
    setError(null);
    const updated = addToWatchlist(symbol);
    if (updated.length === items.length) {
      setError('이미 추가된 종목입니다');
    } else {
      setItems(updated);
    }
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    handleSelectSuggestion(inputValue.trim());
  };

  const handleRemove = (ticker: string) => {
    const updated = removeFromWatchlist(ticker);
    setItems(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIdx].symbol);
        } else {
          handleAdd();
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setIsAdding(false);
        setInputValue('');
        setError(null);
      }
    } else {
      if (e.key === 'Enter') handleAdd();
      if (e.key === 'Escape') {
        setIsAdding(false);
        setInputValue('');
        setError(null);
      }
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bento-item watchlist-container">
      <div className="watchlist-header">
        <h3 className="text-secondary">WATCHLIST</h3>
        <button 
          className="watchlist-add-btn" 
          onClick={() => setIsAdding(!isAdding)}
          title="종목 추가"
        >
          {isAdding ? '✕' : '+'}
        </button>
      </div>

      {/* 종목 추가 입력 + 자동완성 */}
      {isAdding && (
        <div className="watchlist-search-wrapper" ref={dropdownRef}>
          <div className="watchlist-input-row">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="종목 검색 (예: AAPL, Tesla)"
              className="watchlist-input"
              autoFocus
            />
            <button className="watchlist-confirm-btn" onClick={handleAdd}>추가</button>
          </div>

          {/* 자동완성 드롭다운 */}
          {showDropdown && suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((s, idx) => (
                <div
                  key={s.symbol}
                  className={`autocomplete-item ${idx === selectedIdx ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(s.symbol)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <div className="ac-left">
                    <strong className="ac-symbol">{s.symbol}</strong>
                    <span className="ac-name text-muted">{s.name}</span>
                  </div>
                  <span className="ac-type">{s.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <div className="watchlist-error">{error}</div>}

      {/* 워치리스트 목록 */}
      {items.length === 0 ? (
        <div className="watchlist-empty">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            종목을 추가하세요
          </span>
        </div>
      ) : (
        <div className="watchlist-list">
          {items.map(item => {
            const yfQuote = quotes.get(item.ticker);
            const fhQuote = finnhubPrices.get(item.ticker);
            const price = fhQuote?.price || yfQuote?.price || 0;
            const changePercent = fhQuote?.changePercent || yfQuote?.changePercent || 0;
            const name = yfQuote?.name || item.ticker;
            const isUp = changePercent >= 0;
            return (
              <WatchlistRow 
                key={item.ticker} 
                ticker={item.ticker} 
                name={name} 
                price={price} 
                changePercent={changePercent} 
                isUp={isUp} 
                onRemove={() => handleRemove(item.ticker)} 
                isLoading={!yfQuote && !fhQuote}
              />
            );
          })}
        </div>
      )}

      <style>{`
        .watchlist-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .watchlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .watchlist-add-btn {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .watchlist-add-btn:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .watchlist-search-wrapper {
          position: relative;
        }
        .watchlist-input-row {
          display: flex;
          gap: 0.4rem;
        }
        .watchlist-input {
          flex: 1;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .watchlist-input:focus {
          border-color: var(--accent-primary);
        }
        .watchlist-input::placeholder {
          color: var(--text-muted);
        }
        .watchlist-confirm-btn {
          background: var(--accent-subtle, rgba(200,155,60,0.12));
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .watchlist-confirm-btn:hover {
          background: var(--accent-primary);
          color: var(--bg-color);
        }

        /* 자동완성 드롭다운 */
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-top: none;
          border-radius: 0 0 var(--radius-sm) var(--radius-sm);
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .autocomplete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.6rem;
          cursor: pointer;
          transition: background var(--transition-fast);
          border-bottom: 1px solid var(--glass-border);
        }
        .autocomplete-item:last-child {
          border-bottom: none;
        }
        .autocomplete-item:hover,
        .autocomplete-item.selected {
          background: var(--accent-subtle, rgba(200,155,60,0.12));
        }
        .ac-left {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .ac-symbol {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-primary);
          flex-shrink: 0;
        }
        .ac-name {
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ac-type {
          font-size: 0.65rem;
          color: var(--text-muted);
          background: var(--bg-secondary);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          flex-shrink: 0;
          margin-left: 0.3rem;
        }

        .watchlist-error {
          color: var(--bear);
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }
        .watchlist-empty {
          padding: 1rem 0;
          text-align: center;
        }
        .watchlist-list {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .watchlist-row {
          display: flex;
          align-items: center;
          padding: 0.35rem 0.25rem;
          border-bottom: 1px solid var(--glass-border);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          gap: 0.4rem;
        }
        .wl-ticker {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
          min-width: 0;
          flex: 1;
        }
        .wl-name {
          font-size: 0.7rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wl-data {
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
          flex-shrink: 0;
        }
        .wl-price {
          color: var(--text-primary);
        }
        .wl-remove {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0.15rem 0.3rem;
          border-radius: 2px;
          transition: color var(--transition-fast);
          flex-shrink: 0;
        }
        .wl-remove:hover {
          color: var(--bear);
        }
      `}</style>
    </div>
  );
}

// 개별 종목 렌더링 (플래시 애니메이션 적용 위해 분리)
function WatchlistRow({ ticker, name, price, changePercent, isUp, onRemove, isLoading }: any) {
  const flash = useFlash(price, 500);
  
  return (
    <div className={`watchlist-row ${flash}`}>
      <div className="wl-ticker">
        <strong>{ticker}</strong>
        {!isLoading && <span className="text-muted wl-name">{name}</span>}
      </div>
      <div className="wl-data" style={{ padding: '0 0.25rem', borderRadius: '4px' }}>
        {!isLoading ? (
          <>
            <span className="wl-price">{price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : price.toFixed(2)}</span>
            <span className={isUp ? 'text-bull' : 'text-bear'} style={{ minWidth: '60px', textAlign: 'right' }}>
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="text-muted">로딩...</span>
        )}
      </div>
      <button 
        className="wl-remove" 
        onClick={onRemove}
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}
