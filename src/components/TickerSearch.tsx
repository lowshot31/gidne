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
}

export default function TickerSearch({ onNavigate, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIdx(-1);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = (symbol: string, name: string) => {
    setIsOpen(false);
    setQuery('');
    if (onSelect) {
      onSelect(symbol, name);
    } else if (onNavigate) {
      onNavigate(symbol);
    } else {
      window.location.href = `/chart/${symbol}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      navigate(suggestions[selectedIdx].symbol, suggestions[selectedIdx].name);
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
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="종목 검색 (예: AAPL, 비트코인, 삼성전자)"
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

      {isOpen && suggestions.length > 0 && (
        <ul className="search-dropdown">
          {suggestions.map((s, idx) => (
            <li
              key={s.symbol}
              className={`search-item ${idx === selectedIdx ? 'selected' : ''}`}
              onClick={() => navigate(s.symbol, s.name)}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              <div className="search-item-left">
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
          background: rgba(255, 255, 255, 0.05);
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
          background: rgba(255, 255, 255, 0.1);
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: rgba(20, 20, 30, 0.98);
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
          background: rgba(0, 242, 255, 0.08);
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
          background: rgba(99, 102, 241, 0.2);
          color: var(--accent-secondary);
          font-weight: 500;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
