import React from 'react';
import { useBinanceStream } from '../hooks/useBinanceStream';
import { useFlash } from '../hooks/useFlash';

const CRYPTO_SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt', 'xrpusdt', 'dogeusdt'];

const DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  XRPUSDT: 'XRP',
  DOGEUSDT: 'DOGE',
};

function CryptoRow({ symbol, price, change24h, high24h, low24h }: {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
}) {
  const flash = useFlash(price, 500);
  const isUp = change24h >= 0;
  const name = DISPLAY_NAMES[symbol] || symbol.replace('USDT', '');

  return (
    <a href={`/chart/${encodeURIComponent(symbol.toUpperCase())}`} style={{ textDecoration: 'none' }} className={`crypto-row ${flash}`}>
      <div className="crypto-name" style={{ alignItems: 'center' }}>
        <img 
          src={`https://assets.coincap.io/assets/icons/${name.toLowerCase()}@2x.png`} 
          alt="" 
          style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'contain', background: '#fff', marginRight: '2px' }} 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />
        <strong>{name}</strong>
      </div>
      <div className="crypto-price-col">
        <span className="crypto-price">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price >= 100 ? 2 : 4 })}
        </span>
      </div>
      <div className={`crypto-change ${isUp ? 'text-bull' : 'text-bear'}`}>
        {isUp ? '+' : ''}{change24h.toFixed(2)}%
      </div>
    </a>
  );
}

export default function CryptoLive() {
  const prices = useBinanceStream(CRYPTO_SYMBOLS);

  return (
    <div className="bento-item crypto-live-container">
      <div className="crypto-header">
        <h3 className="text-secondary">CRYPTO LIVE</h3>
        <span className="live-badge">
          <span className="live-dot" /> LIVE
        </span>
      </div>

      <div className="crypto-list">
        {CRYPTO_SYMBOLS.map(s => {
          const key = s.toUpperCase();
          const data = prices.get(key);
          if (!data) {
            return (
              <div key={key} className="crypto-row">
                <span className="text-muted">{DISPLAY_NAMES[key] || key}</span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>연결 중...</span>
              </div>
            );
          }
          return (
            <CryptoRow
              key={key}
              symbol={data.symbol}
              price={data.price}
              change24h={data.change24h}
              high24h={data.high24h}
              low24h={data.low24h}
            />
          );
        })}
      </div>

      <style>{`
        .crypto-live-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
          overflow: hidden;
        }
        .crypto-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-shrink: 0;
        }
        .live-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--bull);
          font-weight: 600;
          font-family: var(--font-mono);
          letter-spacing: 0.5px;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--bull);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--bull); }
          50% { opacity: 0.4; box-shadow: none; }
        }
        .crypto-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          overflow-y: auto;
          flex: 1;
        }
        .crypto-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.5rem;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          transition: background 0.3s ease;
        }
        .crypto-name {
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
          flex-shrink: 0;
        }
        .crypto-name strong {
          color: var(--text-primary);
        }
        .crypto-price-col {
          flex: 1;
          text-align: right;
          padding-right: 0.5rem;
        }
        .crypto-price {
          color: var(--text-primary);
          font-weight: 500;
        }
        .crypto-change {
          min-width: 70px;
          text-align: right;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
