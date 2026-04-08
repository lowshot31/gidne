import React, { useState, useEffect, useRef } from 'react';
import type { IndexQuote } from '../lib/types';
import { isUSMarketOpen } from '../lib/tickers';

interface Props {
  indices: IndexQuote[];
  onSelectIndex: (ticker: string) => void;
  selectedIndex: string;
}

const PIN_CITIES = [
  // 미주
  { id: 'new_york', name: 'New York', region: 'americas', primaryTicker: '^GSPC', left: '29.4%', top: '27.4%' },
  { id: 'toronto', name: 'Toronto', region: 'americas', primaryTicker: '^GSPTSE', left: '28.0%', top: '25.8%' },
  { id: 'saopaulo', name: 'Sao Paulo', region: 'emerging', primaryTicker: '^BVSP', left: '37.0%', top: '63.1%' },
  { id: 'mexicocity', name: 'Mexico City', region: 'emerging', primaryTicker: '^MXX', left: '22.5%', top: '39.2%' },
  
  // 유럽 & 중동
  { id: 'london', name: 'London', region: 'europe', primaryTicker: '^FTSE', left: '50.0%', top: '21.4%' },
  { id: 'paris', name: 'Paris', region: 'europe', primaryTicker: '^FCHI', left: '50.7%', top: '22.9%' },
  { id: 'frankfurt', name: 'Frankfurt', region: 'europe', primaryTicker: '^GDAXI', left: '52.4%', top: '22.2%' },
  { id: 'brussels', name: 'Brussels', region: 'europe', primaryTicker: '^STOXX50E', left: '51.2%', top: '21.7%' },
  { id: 'telaviv', name: 'Tel Aviv', region: 'emerging', primaryTicker: 'TA35.TA', left: '59.7%', top: '32.2%' },
  
  // 아시아 & 신흥국 & 오세아니아
  { id: 'tokyo', name: 'Tokyo', region: 'asia', primaryTicker: '^N225', left: '88.8%', top: '30.2%' },
  { id: 'seoul', name: 'Seoul', region: 'asia', primaryTicker: '^KS11', left: '85.3%', top: '29.1%' },
  { id: 'shanghai', name: 'Shanghai', region: 'asia', primaryTicker: '000001.SS', left: '83.7%', top: '32.6%' },
  { id: 'taipei', name: 'Taipei', region: 'asia', primaryTicker: '^TWII', left: '83.8%', top: '36.1%' },
  { id: 'hong_kong', name: 'Hong Kong', region: 'asia', primaryTicker: '^HSI', left: '81.7%', top: '37.6%' },
  { id: 'mumbai', name: 'Mumbai', region: 'emerging', primaryTicker: '^NSEI', left: '70.2%', top: '39.4%' },
  { id: 'hcmc', name: 'Ho Chi Minh', region: 'emerging', primaryTicker: '^VNINDEX.VN', left: '79.6%', top: '44.0%' },
  { id: 'sydney', name: 'Sydney', region: 'asia', primaryTicker: '^AXJO', left: '92.0%', top: '68.8%' },
];

export default function GlobalMarketMap({ indices, onSelectIndex, selectedIndex }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // 숨겨진 미세조정 모드 (Tweak Mode)
  const [isTweakMode, setIsTweakMode] = useState(false);
  const [tweakPins, setTweakPins] = useState([...PIN_CITIES]);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string, active: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!isTweakMode) return;
    dragRef.current = { id, active: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTweakMode || !dragRef.current?.active || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setTweakPins(prev => prev.map(p => 
      p.id === dragRef.current!.id ? { ...p, left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` } : p
    ));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTweakMode || !dragRef.current?.active) return;
    dragRef.current.active = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const currentPins = isTweakMode ? tweakPins : PIN_CITIES;
  

  // US Market isOpen directly from our utility, others are simplified
  const isUSOpen = isUSMarketOpen();
  
  const now = new Date();
  const utcHours = now.getUTCHours();
  
  const isMarketOpen = (region: string) => {
    if (region === 'americas') return isUSOpen;
    if (region === 'europe') return (utcHours >= 7 && utcHours < 16); 
    if (region === 'asia') return (utcHours >= 0 && utcHours < 7); 
    return false;
  };

  const [heroTickers, setHeroTickers] = useState<string[]>(['^GSPC', '^IXIC', '^KS11']);
  const [isAddingHero, setIsAddingHero] = useState(false);
  const [draggedHeroIndex, setDraggedHeroIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gidne_map_heroes');
    if (saved) {
      try {
        setHeroTickers(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleHero = (ticker: string) => {
    let newHeroes;
    if (heroTickers.includes(ticker)) {
      newHeroes = heroTickers.filter(t => t !== ticker);
    } else {
      if (heroTickers.length >= 6) return; // limit to 6 cards max
      newHeroes = [...heroTickers, ticker];
    }
    setHeroTickers(newHeroes);
    localStorage.setItem('gidne_map_heroes', JSON.stringify(newHeroes));
  };

  const handleHeroDragStart = (e: React.DragEvent, index: number) => {
    setDraggedHeroIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleHeroDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedHeroIndex === null || draggedHeroIndex === index) return;
    
    const newHeroes = [...heroTickers];
    const draggedItem = newHeroes[draggedHeroIndex];
    newHeroes.splice(draggedHeroIndex, 1);
    newHeroes.splice(index, 0, draggedItem);
    
    setHeroTickers(newHeroes);
    setDraggedHeroIndex(index);
  };

  const handleHeroDragEnd = () => {
    setDraggedHeroIndex(null);
    localStorage.setItem('gidne_map_heroes', JSON.stringify(heroTickers));
  };

  const usIndices = heroTickers.map(t => indices.find(i => i.symbol === t)).filter(Boolean);

  return (
    <div className="global-map-container glass-panel">
      {/* Tweak Mode Toggle */}
      <div 
        style={{ position: 'absolute', top: 5, right: 10, zIndex: 100, fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer' }}
        onDoubleClick={() => setIsTweakMode(!isTweakMode)}
        title="Double click to toggle Tweak Mode"
        className="select-none"
      >
        [⚙️]
      </div>
      
      {isTweakMode && (
        <div style={{ position: 'absolute', top: 30, right: 10, zIndex: 100, background: 'rgba(50,0,0,0.8)', color: '#ffaaaa', padding: '10px', fontSize: '10px', fontFamily: 'monospace', borderRadius: '4px', maxWidth: '300px', maxHeight: '400px', overflow: 'auto' }}>
          {`const PIN_CITIES = ${JSON.stringify(tweakPins, null, 2)};`}
        </div>
      )}

      <div 
        className="map-center-container"
        ref={mapRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Aspect Ratio locked wrapper for accurate Pin placement */}
        <div className="map-inner-wrapper">
          <div className="map-background" />

        {currentPins.map(city => {
          let quote = indices.find(i => i.symbol === city.primaryTicker);
          if (!quote) {
            quote = { symbol: city.primaryTicker, name: city.name, price: 0, change: 0, changePercent: 0, previousClose: 0, region: city.region, flag: '' };
          }
          const isOpen = isMarketOpen(city.region);
          
          let colorVar = 'var(--neutral)';
          let shadowColor = 'rgba(150, 150, 150, 0.6)';
          let changePct = 0;
          let isSelected = false;
          let displayQuote = quote; // default to primary

          if (quote) {
            // Special rule for New York pin dynamically pulling the selected index quote
            if (city.id === 'new_york' && ['^GSPC', '^IXIC', '^DJI', '^RUT'].includes(selectedIndex)) {
              displayQuote = indices.find(i => i.symbol === selectedIndex) || quote;
              isSelected = true;
            } else if (quote.symbol === selectedIndex) {
              isSelected = true;
            }

            const isBull = displayQuote.changePercent >= 0;
            colorVar = isBull ? 'var(--bull)' : 'var(--bear)';
            shadowColor = isBull ? 'var(--bull)' : 'var(--bear)';
            changePct = displayQuote.changePercent;
          }

          return (
            <div 
              key={city.id}
              className={`map-pin ${hoveredCity === city.id ? 'is-hovered' : ''} ${isSelected ? 'is-selected' : ''} ${isOpen ? 'is-open' : 'is-closed'}`}
              style={{ 
                left: city.left, 
                top: city.top, 
                '--pin-color': colorVar, 
                '--pin-shadow': shadowColor,
                cursor: isTweakMode ? 'grab' : 'pointer',
                zIndex: isTweakMode && dragRef.current?.id === city.id ? 50 : undefined
              } as React.CSSProperties}
              onMouseEnter={() => !isTweakMode && setHoveredCity(city.id)}
              onMouseLeave={() => !isTweakMode && setHoveredCity(null)}
              onClick={() => !isTweakMode && onSelectIndex(city.primaryTicker)}
              onPointerDown={(e) => handlePointerDown(e, city.id)}
            >
              <div className="pin-core" />
              <div className="pin-pulse" />
              
              {(hoveredCity === city.id || isSelected) && displayQuote && (
                <div className="pin-tooltip glass-panel">
                  <div className="tooltip-city">{city.name}</div>
                  <div className="tooltip-index">
                    <strong>{displayQuote.name}</strong>
                    <span className={changePct >= 0 ? 'text-bull' : 'text-bear'} style={{ fontFamily: 'var(--font-mono)'}}>
                      {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="tooltip-status">
                    <span className={`status-dot ${isOpen ? 'open' : 'closed'}`} />
                    <span style={{ color: isOpen ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 500 }}>
                      {isOpen ? 'Trading' : 'Closed'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Core Hero Cards (Lower Left) */}
      <div className="hero-cards-overlay">
          {usIndices.map((u, index) => {
            if (!u) return null;
            const isBull = u.changePercent >= 0;
            const isSelected = selectedIndex === u.symbol;
            return (
              <div 
                key={u.symbol}
                draggable
                onDragStart={(e) => handleHeroDragStart(e, index)}
                onDragOver={(e) => handleHeroDragOver(e, index)}
                onDragEnd={handleHeroDragEnd}
                className={`hero-card glass-panel cursor-move ${isSelected ? 'selected-card' : ''} ${draggedHeroIndex === index ? 'dragging' : ''}`}
                onClick={() => onSelectIndex(u.symbol)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-secondary text-sm">{u.name}</span>
                </div>
                <div className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-mono)'}}>
                  {u.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-mono flex justify-between items-center`}>
                  <span className={`${isBull ? 'text-bull' : 'text-bear'} flex items-center gap-1`}>
                    {isBull ? '▲' : '▼'} {Math.abs(u.changePercent).toFixed(2)}%
                  </span>
                  <button className="remove-hero-btn" onClick={(e) => { e.stopPropagation(); toggleHero(u.symbol); }}>✕</button>
                </div>
              </div>
            );
          })}

          <div 
            className="hero-add-btn glass-panel" 
            onClick={() => setIsAddingHero(!isAddingHero)}
            title="Add Index Card"
          >
            <span>+</span>
          </div>

          {/* Hero Picker Popup */}
          {isAddingHero && (
            <div className="hero-picker-popup glass-panel">
              <div className="hero-picker-header">
                <h4>지수 카드 추가 (최대 6개)</h4>
                <button onClick={() => setIsAddingHero(false)}>✕</button>
              </div>
              <div className="hero-picker-grid">
                {indices.map(idx => (
                  <div 
                    key={idx.symbol}
                    className={`hero-picker-item ${heroTickers.includes(idx.symbol) ? 'selected' : ''}`}
                    onClick={() => toggleHero(idx.symbol)}
                  >
                    <span>{idx.flag} {idx.name}</span>
                    {heroTickers.includes(idx.symbol) && <span className="text-bull">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .global-map-container {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          border-radius: var(--radius-lg);
          background: rgba(15, 20, 25, 0.4);
          border: 1px solid var(--border-color);
          overflow: hidden;
          /* Padding bottom removed, the relative cards will push the height organically */
        }
        
        [data-theme='light'] .global-map-container {
          background: rgba(245, 245, 250, 0.6);
        }

        .map-center-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          container-type: inline-size;
        }

        .map-inner-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 4378 / 2435;
          margin-top: -3%;
          margin-bottom: -5%;
          pointer-events: none;
        }
        /* Restore pointer-events for interactive elements inside the map */
        .map-background, .map-pin {
          pointer-events: auto;
        }

        /* Standard background image instead of mask, fixes Chrome render issues */
        .map-background {
          position: absolute;
          inset: 0;
          background-image: url('/map.svg');
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.15;
          filter: grayscale(100%) brightness(200%);
        }

        [data-theme='light'] .map-background {
          opacity: 0.15;
          filter: grayscale(100%) invert(100%);
        }

        .map-pin {
          position: absolute;
          width: clamp(8px, 1.5cqi, 16px);
          height: clamp(8px, 1.5cqi, 16px);
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 10;
        }

        .pin-core {
          position: absolute;
          inset: 20%;
          background: var(--pin-color);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--pin-shadow);
          transition: all 0.2s;
        }

        .map-pin:hover .pin-core, .map-pin.is-selected .pin-core {
          inset: 0%;
          box-shadow: 0 0 12px var(--pin-shadow), 0 0 24px var(--pin-shadow);
        }

        .pin-pulse {
          position: absolute;
          inset: -30%;
          border-radius: 50%;
          border: 2px solid var(--pin-color);
          opacity: 0;
        }

        .map-pin.is-open .pin-pulse {
          animation: mapPulse 2s infinite ease-out;
        }

        @keyframes mapPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(3.5); opacity: 0; }
        }

        .pin-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translate(-50%, -10px);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          min-width: 140px;
          z-index: 20;
          pointer-events: none;
          background: var(--card-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          color: var(--text-primary);
        }

        .tooltip-city {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .tooltip-index {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .tooltip-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: var(--text-secondary);
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-dot.open {
          background: var(--bull);
          box-shadow: 0 0 5px var(--bull);
        }
        .status-dot.closed {
          background: var(--text-muted);
          box-shadow: none;
        }

        .hero-cards-overlay {
          position: relative; /* STOP absolute floating to prevent overflow when wrapping! */
          padding: 1rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          z-index: 50; /* 툴팁(20)보다 높게 설정하여 플러스 버튼 팝업이 가려지지 않게 수정 */
          width: 100%;
          pointer-events: auto;
        }

        .hero-card {
          flex: 1 1 150px;
          min-width: 0;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          backdrop-filter: blur(10px);
        }

        @media (max-width: 480px) {
          .hero-cards-overlay {
            flex-direction: column;
            padding: 0.5rem;
            gap: 8px;
          }
          .hero-card {
            flex: 1 1 100%;
            width: 100%;
          }
        }

        .hero-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-primary);
        }
        
        .hero-card.dragging {
          opacity: 0.5;
          transform: scale(0.95);
        }

        .cursor-move {
          cursor: grab;
        }
        .cursor-move:active {
          cursor: grabbing;
        }

        .remove-hero-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, color 0.2s;
        }
        
        .remove-hero-btn:hover {
          color: var(--bear);
        }

        .hero-card:hover .remove-hero-btn {
          opacity: 1;
        }
        
        .hero-card.selected-card {
          border-color: var(--accent-primary);
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.1);
        }

        .hero-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          align-self: center;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
          color: var(--text-muted);
          transition: all 0.2s;
          background: var(--overlay);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          margin-left: 0.5rem;
        }

        .hero-add-btn:hover {
          color: var(--text-primary);
          background: var(--overlay-hover);
          border-color: var(--accent-primary);
          transform: scale(1.05);
        }

        .hero-picker-popup {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 0;
          width: 320px;
          max-height: 350px;
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          z-index: 50;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          padding: 1rem;
        }

        .hero-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .hero-picker-header h4 {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .hero-picker-header button {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.2rem;
        }

        .hero-picker-header button:hover {
          color: var(--text-primary);
        }

        .hero-picker-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        
        .hero-picker-grid::-webkit-scrollbar { width: 4px; }
        .hero-picker-grid::-webkit-scrollbar-thumb { background: var(--overlay-hover); border-radius: 4px; }

        .hero-picker-item {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          background: var(--overlay);
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.1s;
        }

        .hero-picker-item:hover {
          background: var(--overlay-hover);
        }

        .hero-picker-item.selected {
          border: 1px solid var(--accent-primary);
          background: var(--accent-subtle);
        }

        @media (max-width: 768px) {
          .hero-cards-overlay {
            margin-top: 0; /* Remove overlap on mobile so it cleanly sits below map */
            gap: 10px;
            padding: 0 0.5rem 1rem 0.5rem;
          }
          .hero-card {
            min-width: 45%;
            flex: 1 1 45%;
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
