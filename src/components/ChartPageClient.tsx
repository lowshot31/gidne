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
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      const apiTicker = initialTicker.toUpperCase().endsWith('USDT') 
        ? initialTicker.toUpperCase().replace('USDT', '-USD') 
        : initialTicker;
      const res = await fetch(`/api/quote?ticker=${encodeURIComponent(apiTicker)}`);
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
      <div className="chart-page-loading" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="toss-spinner"></div>
        <h3 style={{ marginTop: '1.5rem', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.2rem' }}>
          실시간 데이터를 가져오는 중입니다...
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          글로벌 금융 시장과 연결 중입니다 ⚡
        </p>
        <style>{`
          .toss-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            border-top-color: var(--accent-primary);
            animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
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

  const logoUrl = quote.quoteType === 'CRYPTOCURRENCY' 
    ? `https://assets.coincap.io/assets/icons/${quote.symbol.replace('-USD', '').toLowerCase()}@2x.png`
    : `https://assets.parqet.com/logos/symbol/${quote.symbol}?format=png`;

  return (
    <div className="chart-page">
      {/* ── 🚀 초고도화된 토스증권 스타일 티커 헤더 ── */}
      <div className="chart-hero toss-style-header bento-item">
        <div className="toss-hero-left">
          <div className="toss-hero-top">
            <a href="/" className="back-link" title="대시보드로 돌아가기">←</a>
            <div className="toss-logo-circle" style={{ background: priceColor, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{quote.symbol.charAt(0)}</span>
              <img 
                src={logoUrl} 
                alt="" 
                style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            </div>
            <h1 className="toss-name">{quote.quoteType === 'CRYPTOCURRENCY' ? quote.name.replace(' USD', '') : quote.name}</h1>
            <span className="toss-symbol">{quote.quoteType === 'CRYPTOCURRENCY' ? `${quote.symbol.replace('-USD', '')}/USDT` : quote.symbol}</span>
            
            {/* 태그 영역 */}
            <div className="toss-tags">
              {/* 기능이 연동되면 표시할 태그 영역 */}
            </div>
          </div>
          
          <div className="toss-hero-bot">
            <div className="toss-price-big">${formatNumber(quote.price)}</div>
            <div className="toss-change-text" style={{ color: priceColor }}>
              지난 장보다 {changeSign}${Math.abs(quote.change).toFixed(2)} ({changeSign}{Math.abs(quote.changePercent).toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="toss-hero-right">
          {/* 1. 레인지 컬럼 */}
          <div className="toss-stat-col toss-ranges">
            <div className="toss-range-row">
              <span className="tr-label">1일 범위</span>
              <span className="tr-min">${formatNumber(quote.dayLow)}</span>
              <div className="tr-bar-bg">
                <div className="tr-marker" style={{ left: `${Math.max(0, Math.min(dayRangePct, 100))}%` }}></div>
              </div>
              <span className="tr-max">${formatNumber(quote.dayHigh)}</span>
            </div>
            <div className="toss-range-row">
              <span className="tr-label">52주 범위</span>
              <span className="tr-min">${formatNumber(quote.fiftyTwoWeekLow)}</span>
              <div className="tr-bar-bg">
                <div className="tr-marker" style={{ left: `${Math.max(0, Math.min(range52Pct, 100))}%` }}></div>
              </div>
              <span className="tr-max">${formatNumber(quote.fiftyTwoWeekHigh)}</span>
            </div>
          </div>

          <div className="toss-divider"></div>

          {/* 2. 거래량 컬럼 */}
          <div className="toss-stat-col toss-kv">
            <div className="toss-kv-row">
              <span className="kv-label">거래량</span>
              <span className="kv-val">{formatVolume(quote.volume)}</span>
            </div>
            <div className="toss-kv-row">
              <span className="kv-label">평균대비</span>
              <span className="kv-val">{volRatio.toFixed(1)}x</span>
            </div>
          </div>

          <div className="toss-divider"></div>

          {/* 3. 시가총액 컬럼 */}
          <div className="toss-stat-col toss-kv" style={{ minWidth: '120px' }}>
            <div className="toss-kv-row">
              <span className="kv-label">시가총액</span>
              <span className="kv-val">${formatNumber(quote.marketCap)}</span>
            </div>
            <div className="toss-kv-row">
              <span className="kv-label">시장</span>
              <span className="kv-val">{quote.exchange}</span>
            </div>
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

          {/* 당일 예상 변동폭 (Expected Move) - 옵션 IV 기반 */}
          {quote.quoteType !== 'CRYPTOCURRENCY' && (
            <ExpectedMoveWidget ticker={initialTicker} currentPrice={quote.price} />
          )}

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

        /* ── 상단 토스 헤더 ── */
        .chart-hero.toss-style-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 1.5rem 1.75rem;
          background: linear-gradient(180deg, rgba(200, 155, 60, 0.03) 0%, var(--card-bg) 100%);
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .toss-hero-left {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-width: 320px;
        }

        .toss-hero-top {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .back-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 1.4rem;
          line-height: 1;
          margin-right: 0.4rem;
          transition: color 0.2s ease;
        }

        .toss-logo-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .toss-name {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .toss-symbol {
          font-size: 1.15rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          margin-right: 0.4rem;
        }

        .toss-tags {
          display: flex;
          gap: 0.4rem;
        }

        .toss-tag {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          background: var(--accent-subtle);
          color: var(--accent-primary);
          font-weight: 600;
        }

        .toss-tag.dark-mode-tag {
          background: rgba(255,255,255,0.06);
          color: var(--text-secondary);
        }

        .toss-hero-bot {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .toss-price-big {
          font-size: 2.2rem;
          font-weight: 700;
          font-family: var(--font-mono);
          line-height: 1;
          letter-spacing: -0.01em;
          color: var(--text-primary);
        }

        .toss-change-text {
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* 오른쪽 스탯바 영역 */
        .toss-hero-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .toss-divider {
          width: 1px;
          height: 36px;
          background: var(--border-color);
        }

        .toss-stat-col {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        /* 미니 레인지 슬라이더 */
        .toss-range-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        .tr-label {
          color: var(--text-muted);
          font-family: var(--font-body);
          width: 55px;
        }

        .tr-min, .tr-max {
          color: var(--text-secondary);
          width: 50px;
        }
        .tr-max { text-align: right; }

        .tr-bar-bg {
          position: relative;
          width: 60px;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .tr-marker {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: #4ade80; /* 밝은 녹색 포인트 점 */
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
        }

        /* 텍스트 KV 스탯 */
        .toss-kv-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          font-size: 0.8rem;
        }

        .kv-label {
          color: var(--text-muted);
        }

        .kv-val {
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-weight: 500;
          text-align: right;
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
        @media (max-width: 768px) {
          .chart-hero.toss-style-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .toss-hero-right {
            width: 100%;
            justify-content: space-between;
          }
          .toss-divider { display: none; }
        }
        @media (max-width: 600px) {
          .chart-sidebar {
            grid-template-columns: 1fr;
          }
          .toss-hero-right {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
