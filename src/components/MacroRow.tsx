import React, { useState, useRef } from 'react';
import { useFlash } from '../hooks/useFlash';

interface Props {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

/**
 * 매크로 지표 한 줄. 가격이 변동되면 초록/빨강 배경이 0.8초간 깜빡입니다.
 * 텍스트가 말줄임 처리(...)될 경우 hover 시 예쁜 글래스 툴팁으로 전체 이름을 보여줍니다.
 */
export default function MacroRow({ ticker, name, price, changePercent }: Props) {
  const flash = useFlash(price);
  const isUp = changePercent >= 0;
  const [isTruncated, setIsTruncated] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);

  // 가격 포맷: 소수점 이하가 의미 없는 큰 수는 정수로 표시
  const formattedPrice = price >= 1000
    ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : price.toFixed(2);

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
        fontFamily: 'var(--font-mono)',
        padding: '0.3rem 0.5rem',
        gap: '0.5rem',
        transition: 'background 0.3s ease',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        borderRadius: '4px'
      }}
    >
      <span
        ref={nameRef}
        className="text-muted macro-name-label"
        onMouseEnter={handleMouseEnter}
        style={{
          flexShrink: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          fontSize: '0.85rem',
          cursor: 'default',
          position: 'relative'
        }}
      >
        {name}
        {isTruncated && (
          <span className="macro-tooltip-card">{name}</span>
        )}
      </span>
      <strong className={isUp ? 'text-bull' : 'text-bear'} style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.85rem', flexShrink: 0 }}>
        {formattedPrice} <span style={{fontSize: '0.75rem'}}>({isUp ? '+' : ''}{changePercent.toFixed(2)}%)</span>
      </strong>

      <style>{`
        .macro-name-label {
          position: relative;
        }
        .macro-tooltip-card {
          position: absolute;
          bottom: calc(100% + 8px);
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
        .macro-name-label:hover .macro-tooltip-card {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
