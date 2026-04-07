import React, { useState, useEffect } from 'react';
import type { IndexQuote } from '../lib/types';
import { isUSMarketOpen } from '../lib/tickers';

interface Props {
  indices: IndexQuote[];
  onSelectIndex: (ticker: string) => void;
  selectedIndex: string;
}

const PIN_CITIES = [
  // 미주
  { id: 'new_york', name: 'New York', region: 'americas', primaryTicker: '^GSPC', left: '26%', top: '33%' },
  { id: 'toronto', name: 'Toronto', region: 'americas', primaryTicker: '^GSPTSE', left: '27%', top: '28%' },
  { id: 'saopaulo', name: 'Sao Paulo', region: 'emerging', primaryTicker: '^BVSP', left: '33%', top: '65%' },
  { id: 'mexicocity', name: 'Mexico City', region: 'emerging', primaryTicker: '^MXX', left: '21%', top: '45%' },
  
  // 유럽
  { id: 'london', name: 'London', region: 'europe', primaryTicker: '^FTSE', left: '47.1%', top: '23%' },
  { id: 'paris', name: 'Paris', region: 'europe', primaryTicker: '^FCHI', left: '48.2%', top: '26%' },
  { id: 'frankfurt', name: 'Frankfurt', region: 'europe', primaryTicker: '^GDAXI', left: '49.5%', top: '25%' },
  { id: 'telaviv', name: 'Tel Aviv', region: 'emerging', primaryTicker: 'TA35.TA', left: '56.5%', top: '38%' },
  
  // 아시아 & 신흥국
  { id: 'tokyo', name: 'Tokyo', region: 'asia', primaryTicker: '^N225', left: '85.5%', top: '35%' },
  { id: 'seoul', name: 'Seoul', region: 'asia', primaryTicker: '^KS11', left: '82%', top: '36%' },
  { id: 'shanghai', name: 'Shanghai', region: 'asia', primaryTicker: '000001.SS', left: '78%', top: '38%' },
  { id: 'taipei', name: 'Taipei', region: 'asia', primaryTicker: '^TWII', left: '80%', top: '43%' },
  { id: 'hong_kong', name: 'Hong Kong', region: 'asia', primaryTicker: '^HSI', left: '79%', top: '45%' },
  { id: 'mumbai', name: 'Mumbai', region: 'emerging', primaryTicker: '^NSEI', left: '68%', top: '45%' },
  { id: 'hcmc', name: 'Ho Chi Minh', region: 'emerging', primaryTicker: '^VNINDEX.VN', left: '77%', top: '49%' },
  { id: 'sydney', name: 'Sydney', region: 'asia', primaryTicker: '^AXJO', left: '88%', top: '75%' },
];

export default function GlobalMarketMap({ indices, onSelectIndex, selectedIndex }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

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
      <div className="map-center-container">
        {/* Aspect Ratio locked wrapper for accurate Pin placement */}
        <div className="map-inner-wrapper">
          <div className="map-background" />

        {PIN_CITIES.map(city => {
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
            shadowColor = isBull ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 83, 80, 0.6)';
            changePct = displayQuote.changePercent;
          }

          return (
            <div 
              key={city.id}
              className={`map-pin ${hoveredCity === city.id ? 'is-hovered' : ''} ${isSelected ? 'is-selected' : ''} ${isOpen ? 'is-open' : 'is-closed'}`}
              style={{ left: city.left, top: city.top, '--pin-color': colorVar, '--pin-shadow': shadowColor } as React.CSSProperties}
              onMouseEnter={() => setHoveredCity(city.id)}
              onMouseLeave={() => setHoveredCity(null)}
              onClick={() => onSelectIndex(city.primaryTicker)}
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
                    <span style={{ color: isOpen ? 'var(--text-secondary)' : '#aaaaaa', fontWeight: 500 }}>
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
                className={`hero-card glass-panel flex-1 cursor-move ${isSelected ? 'selected-card' : ''} ${draggedHeroIndex === index ? 'dragging' : ''}`}
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
          /* Padding bottom removed, the relative cards will push the height organically */
        }
        
        [data-theme='light'] .global-map-container {
          background: rgba(245, 245, 250, 0.6);
        }

        .map-center-container {
          width: 100%;
          max-width: 1100px; /* Limits width so aspect-ratio height never exceeds ~560px */
          margin: 0 auto;
        }

        .map-inner-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 2754 / 1398;
        }

        /* Abstract Low-res World Map via CSS repeated background */
        .map-background {
          position: absolute;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.12);
          mask-image: url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg');
          mask-size: 100% 100%;
          mask-position: center;
          mask-repeat: no-repeat;
          -webkit-mask-image: url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg');
          -webkit-mask-size: 100% 100%;
          -webkit-mask-position: center;
          -webkit-mask-repeat: no-repeat;
        }

        [data-theme='light'] .map-background {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .map-pin {
          position: absolute;
          width: 14px;
          height: 14px;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 10;
        }

        .pin-core {
          position: absolute;
          inset: 3px;
          background: var(--pin-color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--pin-shadow);
          transition: all 0.2s;
        }

        .map-pin:hover .pin-core, .map-pin.is-selected .pin-core {
          inset: 0px;
          box-shadow: 0 0 15px var(--pin-shadow), 0 0 30px var(--pin-shadow);
        }

        .pin-pulse {
          position: absolute;
          inset: -4px;
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
          background: rgba(15, 20, 25, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        [data-theme='light'] .pin-tooltip {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(0, 0, 0, 0.1);
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
          background: #aaaaaa;
          box-shadow: 0 0 4px rgba(255,255,255,0.2);
        }

        .hero-cards-overlay {
          position: relative; /* STOP absolute floating to prevent overflow when wrapping! */
          margin-top: -4.5rem; /* Native overlap over the bottom of the map */
          padding: 0 1rem 1.5rem 1rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          z-index: 5;
          width: 100%;
          /* max-width removed to allow flex to breathe */
        }

        .hero-card {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(15, 20, 25, 0.6);
          backdrop-filter: blur(10px);
        }

        [data-theme='light'] .hero-card {
          background: rgba(255, 255, 255, 0.7);
          border-color: rgba(0, 0, 0, 0.05);
        }

        .hero-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.1);
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
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-left: 0.5rem;
        }

        .hero-add-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
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
          background: rgba(15, 20, 25, 0.95);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          z-index: 50;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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
        .hero-picker-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .hero-picker-item {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.1s;
        }

        .hero-picker-item:hover {
          background: rgba(255,255,255,0.06);
        }

        .hero-picker-item.selected {
          border: 1px solid var(--accent-primary);
          background: rgba(234, 179, 8, 0.05);
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
