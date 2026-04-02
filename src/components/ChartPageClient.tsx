import React, { useState, useEffect } from 'react';
import TickerSearch from './TickerSearch';
import PriceChart from './PriceChart';
import { useFlash } from '../hooks/useFlash';

interface QuoteDetail {
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

export default function ChartPageClient({ initialTicker }: { initialTicker: string }) {
  const [ticker, setTicker] = useState(initialTicker);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const priceFlash = useFlash(quote?.price);

  const fetchQuote = async (t: string) => {
    try {
      const res = await fetch(`/api/quote?ticker=${t}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      }
    } catch (err) {
      console.error('[ChartPage] quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchQuote(ticker);
    const interval = setInterval(() => fetchQuote(ticker), 5_000);
    return () => clearInterval(interval);
  }, [ticker]);

  // 검색 결과 클릭 시 페이지 리로드 없이 티커만 교체
  const handleNavigate = (newTicker: string) => {
    setTicker(newTicker);
    // URL도 갱신 (새로고침 없이)
    window.history.pushState(null, '', `/chart/${newTicker}`);
  };

  const formatNumber = (n: number) => {
    if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    return n.toLocaleString();
  };

  const formatVolume = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const isUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="chart-page">
      {/* 상단: 검색바 + 종목 정보 */}
      <div className="chart-page-header">
        <div className="chart-header-top">
          <button
            className="back-btn"
            onClick={() => window.location.href = '/'}
          >
            ← Dashboard
          </button>
          <TickerSearch onNavigate={handleNavigate} />
        </div>

        {quote && (
          <div className="quote-hero">
            <div className="quote-hero-left">
              <h1 className="quote-symbol">{quote.symbol}</h1>
              <span className="quote-name">{quote.name}</span>
              <span className="quote-exchange">{quote.exchange}</span>
            </div>
            <div className={`quote-hero-right ${priceFlash}`}>
              <span className="quote-price">{quote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`quote-change ${isUp ? 'text-bull' : 'text-bear'}`}>
                {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 메인: 풀사이즈 차트 */}
      <div className="chart-page-main">
        <div className="chart-fullsize">
          <PriceChart key={ticker} ticker={ticker} name={quote?.name || ticker} />
        </div>

        {/* 우측: 상세 정보 */}
        {quote && (
          <div className="quote-details">
            <h3 className="text-secondary">상세 정보</h3>
            <div className="detail-grid">
              <DetailRow label="시가" value={quote.open.toFixed(2)} />
              <DetailRow label="전일 종가" value={quote.previousClose.toFixed(2)} />
              <DetailRow label="일 최고" value={quote.dayHigh.toFixed(2)} highlight="bull" />
              <DetailRow label="일 최저" value={quote.dayLow.toFixed(2)} highlight="bear" />
              <DetailRow label="거래량" value={formatVolume(quote.volume)} />
              <DetailRow label="평균 거래량" value={formatVolume(quote.avgVolume)} />
              {quote.marketCap > 0 && (
                <DetailRow label="시가총액" value={formatNumber(quote.marketCap)} />
              )}
              <DetailRow label="52주 최고" value={quote.fiftyTwoWeekHigh.toFixed(2)} highlight="bull" />
              <DetailRow label="52주 최저" value={quote.fiftyTwoWeekLow.toFixed(2)} highlight="bear" />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .chart-page {
          display: flex;
          flex-direction: column;
          gap: var(--gap-md);
          height: 100%;
        }
        .chart-page-header {}
        .chart-header-top {
          display: flex;
          align-items: center;
          gap: var(--gap-md);
          margin-bottom: var(--gap-md);
        }
        .back-btn {
          background: none;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .back-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
        }
        .quote-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 1rem 1.5rem;
          background: var(--card-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
        }
        .quote-hero-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .quote-symbol {
          font-size: 2rem;
          font-weight: 700;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .quote-name {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        .quote-exchange {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .quote-hero-right {
          text-align: right;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }
        .quote-price {
          display: block;
          font-family: var(--font-mono);
          font-size: 2.2rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .quote-change {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 500;
        }
        .chart-page-main {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: var(--gap-md);
          flex: 1;
          min-height: 0;
        }
        .chart-fullsize {
          min-height: 350px;
        }
        .chart-fullsize .bento-item {
          height: 100%;
        }
        .chart-fullsize .price-chart-container {
          min-height: 350px;
        }
        .quote-details {
          background: var(--card-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--gap-md);
        }
        .quote-details h3 {
          margin-bottom: 1rem;
        }
        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .detail-label {
          color: var(--text-muted);
        }
        .detail-value {
          color: var(--text-primary);
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .chart-page-main {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: 'bull' | 'bear' }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value ${highlight ? `text-${highlight}` : ''}`}>{value}</span>
    </div>
  );
}
