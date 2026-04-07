import React, { useEffect, useState } from 'react';

interface EMData {
  price: number;
  impliedVolatility: number;
  dailyExpectedMove: number;
  dailyUpper: number;
  dailyLower: number;
  weeklyExpectedMove: number;
  weeklyUpper: number;
  weeklyLower: number;
  monthlyExpectedMove: number;
  monthlyUpper: number;
  monthlyLower: number;
}

export default function ExpectedMoveWidget({ ticker, currentPrice }: { ticker: string, currentPrice?: number }) {
  const [data, setData] = useState<EMData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState<'1D'|'1W'|'1M'>('1D');

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/expected-move?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(res => {
        if (!isMounted) return;
        if (res.error) setError(true);
        else {
          setData(res);
          setError(false);
        }
      })
      .catch(() => isMounted && setError(true))
      .finally(() => isMounted && setLoading(false));
    return () => { isMounted = false; };
  }, [ticker]);

  if (loading) return <div style={{ height: 100, background: 'var(--card-bg)', animation: 'pulse 1.5s infinite', borderRadius: 8, marginTop: '1rem' }} />;
  if (error || !data) return null;

  const p = currentPrice || data.price;
  const ivPct = (data.impliedVolatility * 100).toFixed(1) + '%';
  
  let upper = data.dailyUpper;
  let lower = data.dailyLower;
  let move = data.dailyExpectedMove;
  
  if (tf === '1W') {
    upper = data.weeklyUpper;
    lower = data.weeklyLower;
    move = data.weeklyExpectedMove;
  } else if (tf === '1M') {
    upper = data.monthlyUpper;
    lower = data.monthlyLower;
    move = data.monthlyExpectedMove;
  }

  const emStr = move != null && !isNaN(move) ? `±$${move.toFixed(2)}` : 'N/A';
  const range = upper != null && lower != null ? upper - lower : 0;
  let pct = 50;
  if (range > 0) {
    pct = ((p - lower) / range) * 100;
    pct = Math.max(0, Math.min(100, pct));
  }

  return (
    <div className="em-widget bento-item">
      <div className="em-header">
        <span className="em-title">EXPECTED MOVE</span>
        <div className="em-tf-toggle">
          <button className={tf === '1D' ? 'active' : ''} onClick={() => setTf('1D')}>1D</button>
          <button className={tf === '1W' ? 'active' : ''} onClick={() => setTf('1W')}>1W</button>
          <button className={tf === '1M' ? 'active' : ''} onClick={() => setTf('1M')}>1M</button>
        </div>
      </div>
      <div className="em-main-val">{emStr}</div>
      <div className="em-sub-info">ATM IV: {ivPct} / Expected Range</div>
      <div className="em-bar-container">
        <div className="em-labels">
          <span>${lower.toFixed(2)}</span>
          <span>${upper.toFixed(2)}</span>
        </div>
        <div className="em-bar">
          <div className="em-bar-fill" />
          <div className="em-marker" style={{ left: `${pct}%` }}>
            <div className="em-tooltip">Now</div>
          </div>
        </div>
      </div>
      <div className="em-desc">
        Based on Options Implied Volatility & Options Delta Hedging Bounds
      </div>
      <style>{`
        .em-widget {
          padding: 1rem;
          margin-top: 1rem;
          background: rgba(200, 155, 60, 0.05);
          border: 1px solid rgba(200, 155, 60, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .em-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .em-title {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          color: var(--accent-primary);
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .em-tf-toggle {
          display: flex;
          gap: 4px;
          background: var(--overlay);
          border-radius: 4px;
          padding: 2px;
        }
        .em-tf-toggle button {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.65rem;
          font-family: var(--font-mono);
          padding: 2px 6px;
          border-radius: 2px;
          cursor: pointer;
        }
        .em-tf-toggle button.active {
          background: var(--accent-subtle);
          color: var(--accent-primary);
          font-weight: bold;
        }
        .em-sub-info {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .em-main-val {
          font-family: var(--font-mono);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .em-bar-container {
          position: relative;
          margin-bottom: 0.75rem;
        }
        .em-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .em-bar {
          position: relative;
          height: 8px;
          border-radius: 4px;
          background: var(--overlay);
          overflow: visible;
        }
        .em-bar-fill {
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(244, 67, 54, 0.5) 0%, rgba(200, 155, 60, 0.8) 50%, rgba(76, 175, 80, 0.5) 100%);
          border-radius: 4px;
        }
        .em-marker {
          position: absolute;
          top: -6px;
          width: 4px;
          height: 20px;
          background: var(--text-primary);
          border-radius: 2px;
          transform: translateX(-2px);
          transition: left 0.3s ease;
          box-shadow: 0 0 10px var(--accent-primary);
        }
        .em-tooltip {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          font-family: var(--font-mono);
          font-weight: bold;
          color: var(--text-primary);
          background: var(--tooltip-bg);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .em-desc {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
