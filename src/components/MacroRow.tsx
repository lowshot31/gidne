import React from 'react';
import { useFlash } from '../hooks/useFlash';

interface Props {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

/**
 * 매크로 지표 한 줄. 가격이 변동되면 초록/빨강 배경이 0.8초간 깜빡입니다.
 */
export default function MacroRow({ ticker, name, price, changePercent }: Props) {
  const flash = useFlash(price);
  const isUp = changePercent >= 0;

  // 가격 포맷: 소수점 이하가 의미 없는 큰 수는 정수로 표시
  const formattedPrice = price >= 1000
    ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : price.toFixed(2);

  return (
    <div
      className={`macro-row ${flash}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: 'var(--font-mono)',
        padding: '0.3rem 0.5rem',
        gap: '0.5rem',
        transition: 'background 0.3s ease',
        flexWrap: 'wrap',
      }}
    >
      <span className="text-muted" style={{ flexShrink: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.85rem' }}>{name}</span>
      <strong className={isUp ? 'text-bull' : 'text-bear'} style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.85rem', flexShrink: 0 }}>
        {formattedPrice} <span style={{fontSize: '0.75rem'}}>({isUp ? '+' : ''}{changePercent.toFixed(2)}%)</span>
      </strong>
    </div>
  );
}
