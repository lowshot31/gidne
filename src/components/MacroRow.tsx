import React, { useState, useRef } from 'react';
import { useFlash } from '../hooks/useFlash';

interface Props {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

const ALIAS_MAP: Record<string, string> = {
  '^VIX': 'S&P500 공포지수',
  '^VVIX': 'VIX 변동성',
  '^SKEW': '블랙스완 위험도 (SKEW)',
  '^TNX': '미 국채 10년물 금리',
  '^TYX': '미 국채 30년물 금리',
  '^FVX': '미 국채 5년물 금리',
  '^IRX': '미 국채 13주물 금리',
  'DX-Y.NYB': '달러 인덱스 (달러 강세)',
  'GC=F': '금 (안전 자산)',
  'SI=F': '은 (Silver)',
  'CL=F': 'WTI 국제유가',
  'NG=F': '천연가스',
  'HG=F': '구리 (닥터 코퍼)',
  'BTC-USD': '비트코인',
  'ETH-USD': '이더리움',
  'KRW=X': '원/달러 환율',
  'JPY=X': '엔/달러 환율',
  'EUR=X': '유로/달러 환율'
};

const TV_TICKER_MAP: Record<string, string> = {
  '^VIX': 'VIX',
  '^VVIX': 'VVIX',
  '^SKEW': 'SKEW',
  '^TNX': 'US10Y',
  '^TYX': 'US30Y',
  '^FVX': 'US05Y',
  '^IRX': 'US03M',
  'DX-Y.NYB': 'DXY',
  'GC=F': 'GC1!',
  'SI=F': 'SI1!',
  'CL=F': 'CL1!',
  'NG=F': 'NG1!',
  'HG=F': 'HG1!',
  'BTC-USD': 'BTCUSD',
  'ETH-USD': 'ETHUSD',
  'KRW=X': 'USDKRW',
  'JPY=X': 'USDJPY',
  'EUR=X': 'EURUSD'
};

/**
 * 매크로 지표 한 줄. 토스증권 스타일로 친절한 한글 별명 우선 노출.
 * 가격 변동 시 배경이 부드럽게 깜빡입니다.
 */
export default function MacroRow({ ticker, name, price, changePercent }: Props) {
  const flash = useFlash(price);
  const isUp = changePercent >= 0;
  const [isTruncated, setIsTruncated] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);

  // 가격 포맷: 소수점 이하가 의미 없는 큰 수는 정수로 표시
  const formattedPrice = price >= 1000 && ticker !== 'BTC-USD' && ticker !== 'ETH-USD'
    ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : price.toFixed(2);

  const displayName = ALIAS_MAP[ticker] || name;
  const subName = TV_TICKER_MAP[ticker] || ticker; // 트레이딩뷰용 티커로 변환

  const handleMouseEnter = () => {
    if (nameRef.current) {
      setIsTruncated(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  };

  return (
    <div
      className={`macro-row ${flash}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0.6rem',
        margin: '0.2rem 0',
        transition: 'background-color 0.3s ease, transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        borderRadius: '8px',
        cursor: 'default'
      }}
    >
      <div 
        ref={nameRef}
        onMouseEnter={handleMouseEnter}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 1, 
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        <span 
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
        >
          {displayName}
        </span>
        <span 
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginTop: '0.1rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {subName}
        </span>
        
        {isTruncated && (
          <div className="macro-tooltip-card">{displayName} ({subName})</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {ticker.includes('=X') ? '' : ''}{formattedPrice}
        </strong>
        <span 
          className={isUp ? 'text-bull' : 'text-bear'} 
          style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.1rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: isUp ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)' }}
        >
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>

      <style>{`
        .macro-row {
          background-color: transparent;
        }
        .macro-row:hover {
          background-color: var(--bg-modifier-hover);
        }
        .macro-row.flash-up {
          background-color: rgba(38, 166, 154, 0.12);
          transform: scale(1.015);
        }
        .macro-row.flash-down {
          background-color: rgba(239, 83, 80, 0.12);
          transform: scale(1.015);
        }
        .macro-tooltip-card {
          position: absolute;
          bottom: calc(100% + 4px);
          left: 0;
          padding: 0.5rem 0.75rem;
          background: rgba(20, 20, 30, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.8rem;
          white-space: nowrap;
          z-index: 200;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: all 0.2s ease;
          pointer-events: none;
        }
        .macro-row:hover .macro-tooltip-card {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
