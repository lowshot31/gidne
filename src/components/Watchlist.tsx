import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, reorderWatchlist } from '../lib/watchlist';
import type { WatchlistItem } from '../lib/watchlist';
import { useFlash } from '../hooks/useFlash';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<'^GSPC' | '^IXIC'>('^GSPC');

  // 자동완성 관련
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // LocalStorage에서 워치리스트 로드
  useEffect(() => {
    setItems(getWatchlist());
    try {
      const stored = localStorage.getItem('gidne_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  const { data: fetchedQuotes } = useSWR<Record<string, QuoteData>>(
    items.length > 0 
      ? `/api/quotes?tickers=${Array.from(new Set([...items.map(i => i.ticker), '^GSPC', '^IXIC'])).map(encodeURIComponent).join(',')}`
      : null,
    fetcher,
    { refreshInterval: 5000, dedupingInterval: 2000 }
  );

  const quotes = React.useMemo(() => {
    const m = new Map<string, QuoteData>();
    if (fetchedQuotes) {
      Object.entries(fetchedQuotes).forEach(([symbol, q]: [string, any]) => {
        m.set(symbol, {
          price: q.price ?? 0,
          changePercent: q.changePercent ?? 0,
          name: q.name ?? symbol,
        });
      });
    }
    return m;
  }, [fetchedQuotes]);

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

    // 값이 다 지워지면 최근 검색어 표시
    if (!val.trim()) {
      setSuggestions([]);
      if (recentSearches.length > 0) setShowDropdown(true);
      else setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTickers(val), 300);
  };

  const handleSelectSuggestion = (symbol: string) => {
    setError(null);
    if (items.length >= 30 && !items.some(i => i.ticker === symbol.toUpperCase())) {
      setError('워치리스트는 최대 30개까지만 추가 가능합니다.');
      return;
    }
    const updated = addToWatchlist(symbol);
    if (updated.length === items.length) {
      setError('이미 추가된 종목이거나 한도를 초과했습니다.');
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

  // 드래그 앤 드롭 상태
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const updated = reorderWatchlist(dragItem.current, dragOverItem.current);
      setItems(updated);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDraggingIdx(index);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;
    setDragOverIdx(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const activeList = !inputValue.trim() ? recentSearches : suggestions;
    
    if (showDropdown && activeList.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => Math.min(prev + 1, activeList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        if (selectedIdx >= 0 && selectedIdx < activeList.length) {
          handleSelectSuggestion(activeList[selectedIdx].symbol);
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

  const isMarketOpen = () => {
    return true; 
  };

  const benchmarkChange = quotes.get(benchmark)?.changePercent || 0;
  const benchmarkLabel = benchmark === '^GSPC' ? 'SPX' : 'NDX';

  return (
    <div className="bento-item watchlist-container">
      <div className="watchlist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="text-secondary" style={{ margin: 0 }}>WATCHLIST</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="text-muted" 
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px', 
              padding: '0.1rem 0.4rem', 
              fontSize: '0.7rem',
              cursor: 'pointer' 
            }}
            onClick={() => setBenchmark(b => b === '^GSPC' ? '^IXIC' : '^GSPC')}
            title="RS 기준 지수 변경"
          >
            vs {benchmarkLabel}
          </button>
          <button 
            className="watchlist-add-btn" 
            onClick={() => setIsAdding(!isAdding)}
            title="종목 추가"
          >
            {isAdding ? '✕' : '+'}
          </button>
        </div>
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
              onFocus={() => {
                if (inputValue.trim() && suggestions.length > 0) setShowDropdown(true);
                else if (!inputValue.trim() && recentSearches.length > 0) setShowDropdown(true);
              }}
              placeholder="종목 검색 (예: AAPL, Tesla)"
              className="watchlist-input"
              autoFocus
            />
            <button className="watchlist-confirm-btn" onClick={handleAdd}>추가</button>
          </div>

          {/* 자동완성 및 최근 검색 드롭다운 */}
          {showDropdown && (!inputValue.trim() ? recentSearches.length > 0 : suggestions.length > 0) && (
            <div className="autocomplete-dropdown">
              {!inputValue.trim() && recentSearches.length > 0 && (
                <div className="text-muted" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: 600 }}>최근 검색 기록</div>
              )}
              {(!inputValue.trim() ? recentSearches : suggestions).map((s, idx) => (
                <div
                  key={s.symbol}
                  className={`autocomplete-item ${idx === selectedIdx ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(s.symbol)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <div className="ac-left" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)' }}>
                      <span style={{ fontSize: '10px', color: '#fff' }}>{s.symbol.charAt(0)}</span>
                      <img 
                        src={`https://assets.parqet.com/logos/symbol/${s.symbol}?format=png`} 
                        alt="" 
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff', zIndex: 1 }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                    </div>
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
          {items.map((item, index) => {
            const q = quotes.get(item.ticker);
            return (
              <WatchlistRow
                key={item.ticker}
                index={index}
                ticker={item.ticker}
                name={q?.name || item.ticker}
                price={q?.price || 0}
                changePercent={q?.changePercent || 0}
                isUp={(q?.changePercent || 0) >= 0}
                benchmarkChange={benchmarkChange}
                benchmarkLabel={benchmarkLabel}
                onRemove={() => handleRemove(item.ticker)}
                isLoading={!q}
                dragItem={dragItem}
                dragOverItem={dragOverItem}
                handleSort={handleSort}
                isDragging={draggingIdx === index}
                isDragOver={dragOverIdx === index}
                onDragStart={(e: any) => handleDragStart(e, index)}
                onDragEnter={(e: any) => handleDragEnter(e, index)}
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
          height: 100%;
          overflow: hidden;
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
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .table-row {
          display: flex;
          align-items: center;
          padding: 0.6rem 0.5rem;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s ease, transform 0.1s ease, border-color 0.2s ease;
          font-size: 0.85rem;
          color: inherit;
        }
        .table-row:hover {
          background: var(--bg-card);
        }
        .table-row.is-dragging {
          opacity: 0.4;
          background: rgba(200, 155, 60, 0.05); /* 약간의 강조색 */
        }
        .table-row.is-dragover {
          border-top: 2px solid var(--accent-primary);
          background: rgba(200, 155, 60, 0.08); /* 위치 강조 */
          transform: translateY(2px);
        }
        .wl-grip {
          color: var(--text-muted);
          cursor: grab;
          font-size: 0.9rem;
          margin-right: 0.4rem;
          opacity: 0.2;
          transition: opacity 0.2s;
        }
        .table-row:hover .wl-grip {
          opacity: 0.8;
        }
        .table-row.is-dragging .wl-grip {
          cursor: grabbing;
        }
        .wl-ticker {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          min-width: 0;
          flex: 0 1 auto;
          max-width: 65%;
        }
        .wl-name {
          font-size: 0.7rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
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
function WatchlistRow({ ticker, name, price, changePercent, isUp, benchmarkChange, benchmarkLabel, onRemove, isLoading, index, isDragging, isDragOver, onDragStart, onDragEnter, handleSort }: any) {
  const flash = useFlash(price, 500);
  const rs = changePercent - benchmarkChange;
  const isRsUp = rs >= 0;
  
  return (
    <a 
      href={`/chart/${encodeURIComponent(ticker)}`} 
      className={`table-row ${flash} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-dragover' : ''}`} 
      style={{ textDecoration: 'none', cursor: 'pointer' }}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={handleSort}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="wl-grip" title="드래그해서 순서 변경">⋮⋮</div>
      <div className="wl-ticker" style={{ alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', color: '#fff' }}>{ticker.charAt(0)}</span>
          <img 
            src={`https://assets.parqet.com/logos/symbol/${ticker}?format=png`} 
            alt="" 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff', zIndex: 1 }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
        </div>
        <strong>{ticker}</strong>
        {!isLoading && <span className="text-muted wl-name" style={{ marginLeft: '2px' }}>{name}</span>}
      </div>
      <div style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 12px', minWidth: '20px', alignSelf: 'center', opacity: 0.5, transform: 'translateY(-4px)' }}></div>
      <div className="wl-data" style={{ padding: '0 0.25rem', borderRadius: '4px', gap: '0.75rem' }}>
        {!isLoading ? (
          <>
            <span className="wl-price">{price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : price.toFixed(2)}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem', minWidth: '65px' }}>
              <span className={isUp ? 'text-bull' : 'text-bear'} style={{ fontWeight: 500 }}>
                {isUp ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
              <span className={isRsUp ? 'text-bull' : 'text-bear'} style={{ opacity: 0.8, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                RS({benchmarkLabel}): {isRsUp ? '+' : ''}{rs.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', minWidth: '90px' }}>
            <span className="text-muted" style={{ fontSize: '0.7rem', opacity: 0.7 }}>초기 데이터 수집 중...</span>
          </div>
        )}
      </div>
      <button 
        className="wl-remove" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        title="삭제"
      >
        ✕
      </button>
    </a>
  );
}
