import React, { useEffect, useState } from 'react';

interface SummaryData {
  profile: {
    sector: string;
    industry: string;
    website: string;
    description: string;
    employees: number;
  };
  financials: {
    targetHigh: number;
    targetLow: number;
    targetMean: number;
    recommendationKey: string;
    numberOfAnalysts: number;
    totalRevenue: number;
    ebitda: number;
    debtToEquity: number;
    profitMargins: number;
    operatingMargins: number;
    returnOnEquity: number;
  };
  statistics: {
    trailingPE: number;
    forwardPE: number;
    priceToBook: number;
    beta: number;
    shortRatio: number;
    shortPercentOfFloat: number;
    dividendYield: number;
  };
  trends: any[];
  filings: any[];
}

interface Props {
  ticker: string;
  currentPrice: number;
}

function formatPct(val: number) {
  if (!val) return '-';
  return (val * 100).toFixed(2) + '%';
}

function formatNum(val: number) {
  if (!val) return '-';
  return val.toFixed(2);
}

function capitalize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function CompanyAnalysis({ ticker, currentPrice }: Props) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/quote-summary?ticker=${encodeURIComponent(ticker)}`)
      .then(res => res.json())
      .then(resData => {
        if (!isMounted) return;
        if (resData.error || !resData.profile?.sector) {
          setError(true); // 보통 ETF나 지수, 크립토는 이 데이터가 없음
        } else {
          setData(resData);
          setError(false);
        }
      })
      .catch(() => {
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bento-item analysis-skeleton">
        <div style={{ height: '20px', width: '200px', background: 'var(--card-bg)', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '150px', background: 'var(--card-bg)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  // 지수나 크립토 등 펀더멘털이 없는 종목
  if (error || !data) {
    return null; 
  }

  const { profile, financials, statistics } = data;

  // Analyst Target 계산
  const targetLow = financials.targetLow;
  const targetHigh = financials.targetHigh;
  const targetMean = financials.targetMean;
  const hasTargets = targetLow > 0 && targetHigh > 0;
  
  let targetPct = 50;
  if (hasTargets) {
    const range = targetHigh - targetLow;
    targetPct = range > 0 ? ((currentPrice - targetLow) / range) * 100 : 50;
    targetPct = Math.max(0, Math.min(100, targetPct));
  }

  return (
    <div className="company-analysis-container">
      <h3 className="section-title">FUNDAMENTALS & VALUATION</h3>
      
      <div className="analysis-grid">
        {/* 1. 기업 프로필 */}
        <div className="bento-item analysis-card profile-card">
          <h4 className="card-title">COMPANY PROFILE</h4>
          <div className="profile-tags">
            <span className="profile-tag">Sector: <strong>{profile.sector}</strong></span>
            <span className="profile-tag">Industry: <strong>{profile.industry}</strong></span>
            <span className="profile-tag">Employees: <strong>{profile.employees?.toLocaleString() || '-'}</strong></span>
          </div>
          <p className={`profile-desc ${expandedDesc ? 'expanded' : ''}`}>
            {profile.description}
          </p>
          {profile.description.length > 150 && (
            <button className="read-more-btn" onClick={() => setExpandedDesc(!expandedDesc)}>
              {expandedDesc ? '접기' : '더보기'}
            </button>
          )}
        </div>

        {/* 2. 가치 평가 및 수익성 (Valuation & Profitability) */}
        <div className="bento-item analysis-card stats-card">
          <h4 className="card-title">VALUATION & PROFITABILITY</h4>
          <div className="stats-2col">
            <div className="stat-group">
              <div className="stat-item">
                <span className="stat-label">P/E (Trailing)</span>
                <span className="stat-value">{formatNum(statistics.trailingPE)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">P/E (Forward)</span>
                <span className="stat-value">{formatNum(statistics.forwardPE)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Price to Book</span>
                <span className="stat-value">{formatNum(statistics.priceToBook)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Dividend Yield</span>
                <span className="stat-value" style={{ color: 'var(--bull)' }}>{formatPct(statistics.dividendYield)}</span>
              </div>
            </div>
            <div className="stat-group">
              <div className="stat-item">
                <span className="stat-label">Profit Margin</span>
                <span className="stat-value" style={{ color: financials.profitMargins > 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {formatPct(financials.profitMargins)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ROE</span>
                <span className="stat-value" style={{ color: financials.returnOnEquity > 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {formatPct(financials.returnOnEquity)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Short % Float</span>
                <span className="stat-value" style={{ color: statistics.shortPercentOfFloat > 0.1 ? 'var(--bear)' : 'inherit' }}>
                  {formatPct(statistics.shortPercentOfFloat)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Beta</span>
                <span className="stat-value">{formatNum(statistics.beta)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 월가 컨센서스 (Analyst Consensus) */}
        {hasTargets && (
          <div className="bento-item analysis-card analyst-card">
            <h4 className="card-title">ANALYST CONSENSUS</h4>
            <div className="recommendation-badge">
              {capitalize(financials.recommendationKey)}
              <span className="analyst-count">({financials.numberOfAnalysts} Analysts)</span>
            </div>

            <div className="target-price-visual">
              <div className="target-labels">
                <span className="target-label">Low<br/>${formatNum(targetLow)}</span>
                <span className="target-label" style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Mean<br/>${formatNum(targetMean)}</span>
                <span className="target-label" style={{ textAlign: 'right' }}>High<br/>${formatNum(targetHigh)}</span>
              </div>
              
              <div className="target-bar-bg">
                <div className="target-bar-fill" />
                <div 
                  className="current-price-marker" 
                  style={{ left: `${targetPct}%` }}
                  title={`Current Price: $${currentPrice}`}
                >
                  <div className="marker-tooltip">${currentPrice}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SEC 공시 (SEC Filings) */}
        {data.filings && data.filings.length > 0 && (
          <div className="bento-item analysis-card filings-card">
            <h4 className="card-title">RECENT SEC FILINGS</h4>
            <ul className="filing-list">
              {data.filings.slice(0, 5).map((f, i) => {
                // Yahoo SEC dates are often like "2024-02-14"
                const dateStr = typeof f.date === 'string' ? f.date.split('T')[0] : '';
                return (
                  <li key={i} className="filing-item">
                    <div className="filing-meta">
                      <span className="filing-date">{dateStr}</span>
                      <span className="filing-type">{f.type}</span>
                    </div>
                    <a href={f.url} target="_blank" rel="noreferrer" className="filing-title" title={f.title}>
                      {f.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .company-analysis-container {
          margin-top: 1rem;
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }
        .analysis-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
        }
        .card-title {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin: 0 0 1rem;
          text-transform: uppercase;
        }

        /* Profile */
        .profile-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .profile-tag {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .profile-desc {
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .profile-desc.expanded {
          display: block;
        }
        .read-more-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: 0.8rem;
          padding: 0;
          margin-top: 0.5rem;
          cursor: pointer;
          align-self: flex-start;
        }
        .read-more-btn:hover { text-decoration: underline; }

        /* Stats */
        .stats-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .stat-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-bottom: 1px dotted rgba(255,255,255,0.1);
          padding-bottom: 0.25rem;
        }
        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .stat-value {
          font-size: 0.9rem;
          font-family: var(--font-mono);
          font-weight: 500;
        }

        /* Analyst */
        .recommendation-badge {
          display: inline-flex;
          align-items: baseline;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--accent-primary);
          margin-bottom: 1.5rem;
        }
        .analyst-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 400;
        }
        .target-price-visual {
          margin-top: auto;
          padding-bottom: 1rem;
        }
        .target-labels {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          margin-bottom: 0.5rem;
        }
        .target-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          line-height: 1.3;
        }
        .target-bar-bg {
          position: relative;
          height: 8px;
          background: var(--glass-border);
          border-radius: 4px;
        }
        .target-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--bear) 0%, var(--neutral) 50%, var(--bull) 100%);
          opacity: 0.4;
        }
        .current-price-marker {
          position: absolute;
          top: -6px;
          width: 4px;
          height: 20px;
          background: var(--text-primary);
          border-radius: 2px;
          transform: translateX(-2px);
          box-shadow: 0 0 8px rgba(0,0,0,0.5);
          transition: left 0.5s ease;
        }
        .marker-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 4px;
          background: var(--text-primary);
          color: var(--bg-body);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          font-weight: 600;
          pointer-events: none;
        }

        /* SEC Filings */
        .filing-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .filing-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px dotted rgba(255,255,255,0.1);
        }
        .filing-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .filing-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filing-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .filing-type {
          font-size: 0.65rem;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          font-weight: 600;
        }
        .filing-title {
          font-size: 0.8rem;
          color: var(--accent-primary);
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .filing-title:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
