import React, { useMemo } from 'react';
import { useMarketData } from '../hooks/useMarketData';

export default function MarketRegimeWidget() {
  const { data, loading, error } = useMarketData();

  const regimeInfo = useMemo(() => {
    if (!data) return null;

    const vixNode = data.macro.find(m => m.ticker === '^VIX');
    const dxyNode = data.macro.find(m => m.ticker === 'DX-Y.NYB');
    const tnxNode = data.macro.find(m => m.ticker === '^TNX');
    const spxNode = data.indices.find(i => i.symbol === '^GSPC');

    const vix = vixNode?.price || 0;
    const vixChange = vixNode?.changePercent || 0;
    const dxyChange = dxyNode?.changePercent || 0;
    const tnxChange = tnxNode?.changePercent || 0;
    const spxChange = spxNode?.changePercent || 0;

    let regime = '달리는 불장 (안전) 🚀';
    let color = 'var(--text-bull)';
    let shortDesc = '변동성(VIX)이 20 이하로 얌전하며, 시장에 돈이 넘쳐 주식과 코인을 쓸어담기 좋은 타이밍입니다!';
    let icon = '🟢';

    if (vix > 20 || vixChange > 5) {
      if (tnxChange > 1 && dxyChange > 0.5) {
        regime = '발작 장세 (금리·달러 폭등) 🚨';
        color = 'var(--text-bear)';
        shortDesc = '금리와 달러가 동반 폭등하면서 세계 경제의 돈줄이 쪼그라들까봐 시장이 발작하는 무서운 장세입니다.';
        icon = '🔴';
      } else {
        regime = '현금 확보! (극단적 공포) 🥶';
        color = 'var(--text-bear)';
        shortDesc = '묻지마 폭락 투매가 나오는 구역. 기회를 엿보며 무조건 현금 총알을 비축하세요!';
        icon = '🟣';
      }
    } else {
      if (spxChange < 0.3 && spxChange > -0.3) {
        regime = '눈치보기 (급등락 테마주) 🎢';
        color = 'var(--neutral)';
        shortDesc = '전체 지수는 멈춰 있고 특정 유행하는 테마주들끼리만 돈이 빠르게 빙글빙글 돌고 있습니다.';
        icon = '🟡';
      }
    }

    // Score for visual thermometer (0 = Extreme Fear, 100 = Extreme Greed)
    // VIX 10 = 100 (Greed), VIX 35+ = 0 (Fear)
    let score = 100 - ((vix - 10) / 25) * 100;
    score = Math.max(0, Math.min(100, score));

    return { regime, color, shortDesc, icon, score, metrics: { vix, vixChange, dxyChange, tnxChange, spxChange } };
  }, [data]);

  if (loading || !regimeInfo) return <div className="bento-item p-xl text-center">Loading Regime...</div>;
  if (error) return null;

  return (
    <div className="bento-item" style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h3 className="text-secondary" style={{ margin: 0 }}>오늘 장 분위기 온도계 🌡️</h3>
        <div className="regime-info-wrapper">
          <span className="info-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          <div className="regime-tooltip-card">
            <h4 style={{ margin: '0 0 0.5rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>시장 국면 가이드</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <li>
                <strong>🟢 달리는 불장 🚀</strong>: 변동성(VIX)이 20 이하로 얌전하며, 시장에 돈이 넘쳐 주식과 코인을 쓸어담기 좋은 타이밍입니다!
              </li>
              <li>
                <strong>🟡 눈치보기 (순환매) 🎢</strong>: 전체 지수는 멈춰 있고 특정 유행하는 테마주들끼리만 돈이 빠르게 빙글빙글 돌고 있습니다.
              </li>
              <li>
                <strong>🔴 발작 장세 (충격) 🚨</strong>: 금리와 달러가 동반 폭등하면서 세계 경제의 돈줄이 쪼그라들까봐 시장이 발작하는 무서운 장세입니다.
              </li>
              <li>
                <strong>🟣 극단적 공포 (현금) 🥶</strong>: 묻지마 폭락 투매가 나오는 구역. 기회를 엿보며 무조건 현금 총알을 비축하세요!
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Visual Thermometer Bar ── */}
      <div style={{ marginBottom: '2rem', padding: '0 4px' }}>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '10px', 
          background: 'linear-gradient(90deg, #9c27b0, #ef5350, #f5a623, #22c55e)', 
          borderRadius: '5px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '-5px', 
            left: `calc(${regimeInfo.score}% - 10px)`, 
            width: '20px', 
            height: '20px', 
            background: 'var(--card-bg)', 
            border: `3px solid ${regimeInfo.color}`, 
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, padding: '0 2px' }}>
          <span>극단적 공포</span>
          <span style={{ transform: 'translateX(-20%)' }}>공포</span>
          <span style={{ transform: 'translateX(20%)' }}>중립</span>
          <span>탐욕</span>
        </div>
      </div>

      <div className="regime-flex-container">
        <div style={{ flex: '1 1 250px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: regimeInfo.color, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {regimeInfo.icon} {regimeInfo.regime}
          </div>
          <p className="text-muted" style={{ marginTop: '0.5rem', lineHeight: 1.5 }}>
            {regimeInfo.shortDesc}
          </p>
        </div>
        
        <div className="regime-metrics" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span className="text-muted tooltip-container" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              공포 지수 (VIX) 😨
              <span className="mini-info-icon">?</span>
              <div className="mini-tooltip"><strong>VIX (공포 지수)</strong><br />주식 시장 사람들의 공포심을 수치화했어요. 20이 넘으면 시장이 패닉 상태에 들어섰다는 뜻입니다.</div>
            </span>
            <span style={{ color: regimeInfo.metrics.vix > 20 ? 'var(--text-bear)' : 'var(--text-bull)', fontWeight: 500 }}>
              {regimeInfo.metrics.vix.toFixed(2)} ({regimeInfo.metrics.vixChange > 0 ? '+' : ''}{regimeInfo.metrics.vixChange.toFixed(2)}%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span className="text-muted tooltip-container" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              글로벌 달러 파워 💵
              <span className="mini-info-icon">?</span>
              <div className="mini-tooltip"><strong>DXY (달러 인덱스)</strong><br />지구상에서 달러의 힘이 얼마나 센지 보여줍니다. 돈이 오직 달러로만 귀소병(강세)을 보이면 주식엔 완전 악재입니다!</div>
            </span>
            <span style={{ fontWeight: 500 }}>{regimeInfo.metrics.dxyChange > 0 ? '+' : ''}{regimeInfo.metrics.dxyChange.toFixed(2)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span className="text-muted tooltip-container" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              글로벌 금리 기준점 🏦
              <span className="mini-info-icon">?</span>
              <div className="mini-tooltip"><strong>US10Y (미국 10년물 국채 금리)</strong><br />전 세계 금리의 왕폐입니다. 이게 이틀 연속으로 팍팍 오르면 빅테크 기술주들은 피눈물을 흘립니다.</div>
            </span>
            <span style={{ fontWeight: 500 }}>{regimeInfo.metrics.tnxChange > 0 ? '+' : ''}{regimeInfo.metrics.tnxChange.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      <style>{`
        .regime-flex-container {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .regime-metrics {
          border-left: 1px solid var(--glass-border);
          padding-left: 1.5rem;
        }
        @media (max-width: 600px) {
          .regime-metrics {
            border-left: none;
            padding-left: 0;
            border-top: 1px dashed var(--border-color);
            padding-top: 1.5rem;
            margin-top: 0.5rem;
          }
        }
        .regime-info-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          cursor: help;
        }
        .info-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
          display: flex;
        }
        .regime-info-wrapper:hover .info-icon {
          color: var(--accent-primary);
        }
        .regime-tooltip-card {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 320px;
          background: var(--tooltip-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          color: var(--text-primary);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-5px);
          transition: all 0.2s ease;
          pointer-events: none;
        }
        .regime-info-wrapper:hover .regime-tooltip-card {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }
        .tooltip-container {
          position: relative;
          cursor: help;
        }
        .mini-info-icon {
          opacity: 0.5;
          font-size: 0.75rem;
          transition: opacity 0.2s;
        }
        .tooltip-container:hover .mini-info-icon {
          opacity: 1;
          color: var(--accent-primary);
        }
        .mini-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          width: 250px;
          background: var(--tooltip-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          padding: 0.75rem;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 100;
          color: var(--text-primary);
          font-family: var(--font-sans);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease-out;
          font-size: 0.8rem;
          line-height: 1.5;
          pointer-events: none;
        }
        .tooltip-container:hover .mini-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        @media (max-width: 600px) {
          .regime-tooltip-card {
            width: 280px;
          }
        }
      `}</style>
    </div>
  );
}
