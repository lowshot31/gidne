import React, { useState, useEffect, useCallback } from 'react';
import PriceChart from './PriceChart';
import CompanyAnalysis from './CompanyAnalysis';
import ExpectedMoveWidget from './ExpectedMoveWidget';
import { useFinnhubStream } from '../hooks/useFinnhubStream';
import { useBinanceStream } from '../hooks/useBinanceStream';

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

function formatNumber(n: number | null | undefined): React.ReactNode {
  if (!n && n !== 0) return <span className="mini-shimmer" style={{ display: 'inline-block', width: '3em', height: '1em', borderRadius: '4px', verticalAlign: 'middle' }} />;
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(n: number | null | undefined): React.ReactNode {
  if (!n) return <span className="mini-shimmer" style={{ display: 'inline-block', width: '3em', height: '1em', borderRadius: '4px', verticalAlign: 'middle' }} />;
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
    const interval = setInterval(fetchQuote, 15000); // 15초 폴링 (지수/크립토용 백업)
    return () => clearInterval(interval);
  }, [fetchQuote]);

  // Finnhub WebSocket (미국주식 실시간 가격 오버라이드)
  const isUSStock = !initialTicker.startsWith('^') && !initialTicker.includes('-') && !initialTicker.includes('.');
  const wsQuotes = useFinnhubStream(isUSStock ? [initialTicker] : []);
  
  // Binance WebSocket (크립토 실시간 가격 오버라이드)
  const isCrypto = initialTicker.includes('-USD') || quote?.quoteType === 'CRYPTOCURRENCY';
  const binanceTicker = isCrypto ? initialTicker.replace('-USD', 'usdt').toLowerCase() : '';
  const cryptoQuotes = useBinanceStream(binanceTicker ? [binanceTicker] : []);

  const displayQuote = React.useMemo(() => {
    if (!quote) return null;
    
    if (isUSStock) {
      const wsQ = wsQuotes.get(initialTicker);
      if (wsQ) {
        return { ...quote, price: wsQ.price, change: wsQ.change, changePercent: wsQ.changePercent };
      }
    } else if (isCrypto) {
      // binanceTicker의 키는 대문자이므로 uppercase로 찾습니다.
      const wsQ = cryptoQuotes.get(binanceTicker.toUpperCase());
      if (wsQ) {
        // Binance Stream에는 절대적인 variation 정보 대신 24h 정보가 존재합니다.
        // 현재 price와 changePercent (change24h)를 바탕으로 단순화하여 보여줍니다.
        // change 값 추측: price - (price / (1 + change24h/100))
        const prev = wsQ.price / (1 + (wsQ.change24h / 100));
        return { 
          ...quote, 
          price: wsQ.price, 
          change: wsQ.price - prev, 
          changePercent: wsQ.change24h,
          dayHigh: wsQ.high24h,
          dayLow: wsQ.low24h
        };
      }
    }
    return quote;
  }, [quote, wsQuotes, cryptoQuotes, initialTicker, isUSStock, isCrypto, binanceTicker]);

  const isLivePrice = (isUSStock && wsQuotes.has(initialTicker)) || (isCrypto && cryptoQuotes.has(binanceTicker.toUpperCase()));

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
            border: 4px solid var(--border-color);
            border-radius: 50%;
            border-top-color: var(--accent-primary);
            animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          .mini-shimmer {
            background: linear-gradient(90deg, var(--card-bg-hover) 25%, var(--border-color) 50%, var(--card-bg-hover) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite linear;
            opacity: 0.8;
          }
          [data-theme='light'] .mini-shimmer {
            background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-color) 50%, var(--bg-secondary) 75%);
            background-size: 200% 100%;
          }
        `}</style>
      </div>
    );
  }

  if (error || !displayQuote) {
    return (
      <div className="bento-item" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--bear)', marginBottom: '1rem' }}>⚠️ 종목을 찾을 수 없습니다</h2>
        <p style={{ color: 'var(--text-muted)' }}>티커 "{initialTicker}"에 대한 데이터를 가져올 수 없습니다.</p>
        <a href="/" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>← 대시보드로 돌아가기</a>
      </div>
    );
  }

  const isUp = displayQuote.change >= 0;
  const priceColor = isUp ? 'var(--bull)' : 'var(--bear)';
  const changeSign = isUp ? '+' : '';

  // 52주 레인지 퍼센트
  const range52 = displayQuote.fiftyTwoWeekHigh - displayQuote.fiftyTwoWeekLow;
  const range52Pct = range52 > 0 ? ((displayQuote.price - displayQuote.fiftyTwoWeekLow) / range52) * 100 : 50;

  // 일일 레인지 퍼센트
  const dayRange = displayQuote.dayHigh - displayQuote.dayLow;
  const dayRangePct = dayRange > 0 ? ((displayQuote.price - displayQuote.dayLow) / dayRange) * 100 : 50;

  // 거래량 vs 평균 비율
  const volRatio = displayQuote.avgVolume > 0 ? displayQuote.volume / displayQuote.avgVolume : 1;
  const volBarPct = Math.min(volRatio * 100, 200); // cap at 200%

  const stats = [
    { label: '전일 종가', value: formatNumber(displayQuote.previousClose) },
    { label: '시가', value: formatNumber(displayQuote.open) },
    { label: '고가', value: formatNumber(displayQuote.dayHigh), color: 'var(--bull)' },
    { label: '저가', value: formatNumber(displayQuote.dayLow), color: 'var(--bear)' },
    { label: '시가총액', value: formatNumber(displayQuote.marketCap) },
    { label: '거래소', value: displayQuote.exchange || <span className="mini-shimmer" style={{ display: 'inline-block', width: '3em', height: '1em', borderRadius: '4px' }} /> },
  ];

  const logoUrl = displayQuote.quoteType === 'CRYPTOCURRENCY' 
    ? `https://assets.coincap.io/assets/icons/${displayQuote.symbol.replace('-USD', '').toLowerCase()}@2x.png`
    : `https://assets.parqet.com/logos/symbol/${displayQuote.symbol}?format=png`;

  return (
    <div className="chart-page">
      {/* ── 🚀 초고도화된 토스증권 스타일 티커 헤더 ── */}
      <div className="chart-hero toss-style-header bento-item">
        <div className="toss-hero-left">
          <div className="toss-hero-top">
            {/* Zone 1: 고정 — 뒤로가기 + 로고 */}
            <div className="toss-hero-identity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <a href="/" className="back-link" title="대시보드로 돌아가기">←</a>
              <div className="toss-logo-circle" style={{ background: priceColor, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ position: 'absolute', color: 'white', fontSize: '1rem', fontWeight: 600 }}>{displayQuote.symbol.charAt(0)}</span>
                <img 
                  src={logoUrl} 
                  alt="" 
                  style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', background: 'transparent' }} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              </div>
            </div>

            {/* Zone 2: 유동 — 회사명 (overflow ellipsis) */}
            <h1 className="toss-name">{displayQuote.quoteType === 'CRYPTOCURRENCY' ? displayQuote.name.replace(' USD', '') : displayQuote.name}</h1>

            {/* Zone 3: 고정 — 티커 심볼 + 배지 */}
            <div className="toss-hero-badges" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <span className="toss-symbol">{displayQuote.quoteType === 'CRYPTOCURRENCY' ? `${displayQuote.symbol.replace('-USD', '')}/USDT` : displayQuote.symbol}</span>
            
              {/* 태그 영역 */}
              <div className="toss-tags">
                {!isLivePrice && (
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--overlay)', color: 'var(--neutral)', border: '1px solid var(--border-color)' }} title="야후 파이낸스 정책에 따라 15~20분 지연된 데이터를 사용 중입니다.">
                    🕒 15분 지연 데이터
                  </span>
                )}
                {isLivePrice && (
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--bull-bg)', color: 'var(--bull)', border: '1px solid var(--bull)' }} title="실시간 스트리밍 시세 적용 중">
                    ⚡ 실시간
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="toss-hero-bot">
            <div className="toss-price-big">${formatNumber(displayQuote.price)}</div>
            <div className="toss-change-text" style={{ color: 'var(--text-muted)' }}>
              지난 장보다 <span style={{ color: priceColor, fontWeight: 600 }}>{changeSign}${Math.abs(displayQuote.change).toFixed(2)} ({changeSign}{Math.abs(displayQuote.changePercent).toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="toss-hero-right">
          {/* 1. 레인지 컬럼 */}
          <div className="toss-stat-col toss-ranges">
            <div className="toss-range-row">
              <span className="tr-label">1일 범위</span>
              <span className="tr-min">${formatNumber(displayQuote.dayLow)}</span>
              <div className="tr-bar-bg">
                <div className="tr-marker" style={{ left: `${Math.max(0, Math.min(dayRangePct, 100))}%` }}></div>
              </div>
              <span className="tr-max">${formatNumber(displayQuote.dayHigh)}</span>
            </div>
            <div className="toss-range-row">
              <span className="tr-label">52주 범위</span>
              <span className="tr-min">${formatNumber(displayQuote.fiftyTwoWeekLow)}</span>
              <div className="tr-bar-bg">
                <div className="tr-marker" style={{ left: `${Math.max(0, Math.min(range52Pct, 100))}%` }}></div>
              </div>
              <span className="tr-max">${formatNumber(displayQuote.fiftyTwoWeekHigh)}</span>
            </div>
          </div>

          <div className="toss-divider"></div>

          {/* 2. 거래량 컬럼 */}
          <div className="toss-stat-col toss-kv">
            <div className="toss-kv-row">
              <span className="kv-label">거래량</span>
              <span className="kv-val">{formatVolume(displayQuote.volume)}</span>
            </div>
            <div className="toss-kv-row">
              <span className="kv-label">평균대비</span>
              <span className="kv-val">{!displayQuote.avgVolume ? <span className="mini-shimmer" style={{ display: 'inline-block', width: '2em', height: '1em', borderRadius: '4px', verticalAlign: 'middle' }} /> : `${volRatio.toFixed(1)}x`}</span>
            </div>
          </div>

          <div className="toss-divider"></div>

          {/* 3. 시가총액 컬럼 */}
          <div className="toss-stat-col toss-kv" style={{ minWidth: '120px' }}>
            <div className="toss-kv-row">
              <span className="kv-label">시가총액</span>
              <span className="kv-val">${formatNumber(displayQuote.marketCap)}</span>
            </div>
            <div className="toss-kv-row">
              <span className="kv-label">시장</span>
              <span className="kv-val">{displayQuote.exchange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 메인: 차트(좌) + 사이드패널(우) ── */}
      <div className="chart-body">
        {/* 차트 영역 */}
        <div className="chart-main">
          <PriceChart ticker={initialTicker} name={displayQuote.name} />
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
          {displayQuote.quoteType !== 'CRYPTOCURRENCY' && (
            <ExpectedMoveWidget ticker={initialTicker} currentPrice={displayQuote.price} />
          )}

          {/* 거래량 */}
          <div className="bento-item sidebar-card">
            <h4 className="sidebar-title">VOLUME</h4>
            <div className="volume-section">
              <div className="volume-row">
                <span className="stat-label">오늘</span>
                <span className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatVolume(displayQuote.volume)}</span>
              </div>
              <div className="volume-row">
                <span className="stat-label">3M 평균</span>
                <span className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatVolume(displayQuote.avgVolume)}</span>
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
      <CompanyAnalysis ticker={initialTicker} currentPrice={displayQuote.price} />

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
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }

        .toss-hero-top {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          overflow: hidden;
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
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .toss-name {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .toss-symbol {
          font-size: 1.15rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          margin-right: 0;
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
          background: var(--overlay);
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
          background: var(--border-color);
          border-radius: 2px;
        }

        .tr-marker {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: var(--bull);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--bull);
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
        @media (max-width: 450px) {
          .toss-tags { display: none; }
          .toss-hero-badges { flex-shrink: 1; overflow: hidden; }
          .toss-symbol { font-size: 0.9rem; }
          .toss-name { font-size: 0.95rem; }
          .toss-logo-circle { width: 28px !important; height: 28px !important; }
          .back-link { font-size: 1.1rem; margin-right: 0; }
        }
      `}</style>
    </div>
  );
}
