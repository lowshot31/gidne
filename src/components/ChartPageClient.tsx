import React, { useState, useEffect, useCallback } from 'react';
import PriceChart from './PriceChart';
import CompanyAnalysis from './CompanyAnalysis';
import ExpectedMoveWidget from './ExpectedMoveWidget';

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  exchange: string;
  quoteType: string;
}

function formatNumber(n: number): string {
  if (!n && n !== 0) return '-';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en-US');
  return n.toFixed(2);
}

function formatVolume(n: number): string {
  if (!n) return '-';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
}

interface Props {
  initialTicker: string;
}

export default function ChartPageClient({ initialTicker }: Props) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quote?ticker=${encodeURIComponent(initialTicker)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuote(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [initialTicker]);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 15000); // 15초 폴링
    return () => clearInterval(interval);
  }, [fetchQuote]);

  if (loading) {
    return (
      <div className="chart-page-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-chart" />
        <style>{`
          .chart-page-skeleton { padding: 1rem; }
          .skeleton-header { height: 80px; background: var(--card-bg); border-radius: var(--radius-md); margin-bottom: 1rem; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-chart { height: 500px; background: var(--card-bg); border-radius: var(--radius-md); animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bento-item" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--bear)', marginBottom: '1rem' }}>⚠️ 종목을 찾을 수 없습니다</h2>
        <p style={{ color: 'var(--text-muted)' }}>티커 "{initialTicker}"에 대한 데이터를 가져올 수 없습니다.</p>
        <a href="/" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>← 대시보드로 돌아가기</a>
      </div>
    );
  }

  const isUp = quote.change >= 0;
  const priceColor = isUp ? 'var(--bull)' : 'var(--bear)';
  const changeSign = isUp ? '+' : '';

  // 52주 레인지 퍼센트
  const range52 = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow;
  const range52Pct = range52 > 0 ? ((quote.price - quote.fiftyTwoWeekLow) / range52) * 100 : 50;

  // 일일 레인지 퍼센트
  const dayRange = quote.dayHigh - quote.dayLow;
  const dayRangePct = dayRange > 0 ? ((quote.price - quote.dayLow) / dayRange) * 100 : 50;

  // 거래량 vs 평균 비율
  const volRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const volBarPct = Math.min(volRatio * 100, 200); // cap at 200%

  const stats = [
    { label: '전일 종가', value: formatNumber(quote.previousClose) },
    { label: '시가', value: formatNumber(quote.open) },
    { label: '고가', value: formatNumber(quote.dayHigh), color: 'var(--bull)' },
    { label: '저가', value: formatNumber(quote.dayLow), color: 'var(--bear)' },
    { label: '시가총액', value: formatNumber(quote.marketCap) },
    { label: '거래소', value: quote.exchange || '-' },
  ];

  return (
    <div className="chart-page">
      {/* ── 상단 히어로: 종목명 + 가격 ── */}
      <div className="chart-hero bento-item">
        <div className="hero-left">
          <div className="hero-ticker-row">
            <a href="/" className="back-link" title="대시보드로 돌아가기">←</a>
            <h1 className="hero-symbol">{quote.symbol}</h1>
            <span className="hero-type-badge">{quote.quoteType}</span>
          </div>
          <p className="hero-name">{quote.name}</p>
        </div>
        <div className="hero-right">
          <div className="hero-price" style={{ color: priceColor }}>
            ${formatNumber(quote.price)}
          </div>
          <div className="hero-change" style={{ color: priceColor }}>
            {changeSign}{quote.change.toFixed(2)} ({changeSign}{quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* ── 메인: 차트(좌) + 사이드패널(우) ── */}
      <div className="chart-body">
        {/* 차트 영역 */}
        <div className="chart-main">
          <PriceChart ticker={initialTicker} name={quote.name} />
        </div>

        {/* 사이드 패널 */}
        <div className="chart-sidebar">
          {/* 핵심 통계 */}
          <div className="bento-item sidebar-card">
            <h4 className="sidebar-title">KEY STATS</h4>
            <div className="stats-grid">
              {stats.map(s => (
                <div key={s.label} className="stat-row">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 일일 레인지 */}
          <div className="bento-item sidebar-card">
            <h4 className="sidebar-title">TODAY'S RANGE</h4>
            <div className="range-wrapper">
              <div className="range-labels">
                <span style={{ color: 'var(--bear)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatNumber(quote.dayLow)}</span>
                <span style={{ color: 'var(--bull)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatNumber(quote.dayHigh)}</span>
              </div>
              <div className="range-bar">
                <div className="range-fill" style={{ width: `${dayRangePct}%` }} />
                <div className="range-marker" style={{ left: `${dayRangePct}%` }} />
              </div>
            </div>
          </div>

          {/* 52주 레인지 */}
          <div className="bento-item sidebar-card">
            <h4 className="sidebar-title">52-WEEK RANGE</h4>
            <div className="range-wrapper">
              <div className="range-labels">
                <span style={{ color: 'var(--bear)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatNumber(quote.fiftyTwoWeekLow)}</span>
                <span style={{ color: 'var(--bull)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatNumber(quote.fiftyTwoWeekHigh)}</span>
              </div>
              <div className="range-bar">
                <div className="range-fill range-fill-52w" style={{ width: `${range52Pct}%` }} />
                <div className="range-marker" style={{ left: `${range52Pct}%` }} />
              </div>
            </div>
          </div>

          {/* 당일 예상 변동폭 (Expected Move) - 옵션 IV 기반 */}
          <ExpectedMoveWidget ticker={initialTicker} currentPrice={quote.price} />

          {/* 거래량 */}
          <div className="bento-item sidebar-card">
            <h4 className="sidebar-title">VOLUME</h4>
            <div className="volume-section">
              <div className="volume-row">
                <span className="stat-label">오늘</span>
                <span className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatVolume(quote.volume)}</span>
              </div>
              <div className="volume-row">
                <span className="stat-label">3M 평균</span>
                <span className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatVolume(quote.avgVolume)}</span>
              </div>
              <div className="vol-bar-container">
                <div 
                  className="vol-bar-fill" 
                  style={{ 
                    width: `${Math.min(volBarPct, 100)}%`,
                    background: volRatio > 1.5 ? 'var(--bull)' : volRatio < 0.5 ? 'var(--bear)' : 'var(--accent-primary)'
                  }} 
                />
              </div>
              <div className="vol-ratio" style={{ 
                color: volRatio > 1.5 ? 'var(--bull)' : volRatio < 0.5 ? 'var(--bear)' : 'var(--text-muted)',
                fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textAlign: 'right'
              }}>
                {volRatio.toFixed(2)}x avg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 펀더멘털 및 기업 분석 ── */}
      <CompanyAnalysis ticker={initialTicker} currentPrice={quote.price} />

      <style>{`
        .chart-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 2rem;
        }

        /* ── 히어로 ── */
        .chart-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-color: var(--accent-subtle);
          background: linear-gradient(180deg, rgba(200, 155, 60, 0.03) 0%, var(--card-bg) 100%);
        }
        .hero-ticker-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .back-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 1.4rem;
          transition: color 0.2s ease;
          line-height: 1;
        }
        .back-link:hover { color: var(--accent-primary); }
        .hero-symbol {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .hero-type-badge {
          font-size: 0.65rem;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: var(--accent-subtle);
          color: var(--accent-primary);
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hero-name {
          margin: 0.25rem 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .hero-right { text-align: right; }
        .hero-price {
          font-family: var(--font-mono);
          font-size: 2.2rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .hero-change {
          font-family: var(--font-mono);
          font-size: 1rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        /* ── 본문 2열 ── */
        .chart-body {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1rem;
          min-height: 550px;
        }
        .chart-main {
          min-height: 550px;
        }
        .chart-main > div {
          height: 100%;
        }

        /* ── 사이드바 ── */
        .chart-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .sidebar-card {
          padding: 1rem 1.25rem;
        }
        .sidebar-title {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
        }

        /* ── 통계 그리드 ── */
        .stats-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-label {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .stat-value {
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* ── 레인지 바 ── */
        .range-wrapper { margin-top: 0.25rem; }
        .range-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }
        .range-bar {
          position: relative;
          height: 6px;
          background: var(--glass-border);
          border-radius: 3px;
          overflow: visible;
        }
        .range-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--bear), var(--neutral), var(--bull));
          border-radius: 3px 0 0 3px;
          transition: width 0.5s ease;
        }
        .range-fill-52w {
          background: linear-gradient(90deg, var(--bear), var(--accent-primary), var(--bull));
        }
        .range-marker {
          position: absolute;
          top: -4px;
          width: 3px;
          height: 14px;
          background: var(--text-primary);
          border-radius: 2px;
          transform: translateX(-1.5px);
          transition: left 0.5s ease;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }

        /* ── 거래량 ── */
        .volume-section {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .volume-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .vol-bar-container {
          height: 6px;
          background: var(--glass-border);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .vol-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        /* ── 반응형 ── */
        @media (max-width: 1000px) {
          .chart-body {
            grid-template-columns: 1fr;
          }
          .chart-sidebar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
        }
        @media (max-width: 600px) {
          .chart-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .hero-right { text-align: left; }
          .hero-price { font-size: 1.6rem; }
          .chart-sidebar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
