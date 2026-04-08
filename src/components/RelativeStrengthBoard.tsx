import React, { useState } from 'react';
import type { IndexQuote } from '../lib/types';
import FlagIcon from './FlagIcon';

interface Props {
  indices: IndexQuote[];
}

export default function RelativeStrengthBoard({ indices }: Props) {
  const [baselineTicker, setBaselineTicker] = useState('^GSPC');

  if (!indices || indices.length === 0) return null;

  const baselineQuote = indices.find(i => i.symbol === baselineTicker);
  const baselineReturn = baselineQuote?.changePercent || 0;

  const withRS = indices
    .filter(i => i.symbol !== baselineTicker && !['^VIX', '^VVIX', '^TNX', '^FVX'].includes(i.symbol)) 
    .map(i => ({
      ...i,
      rs: i.changePercent - baselineReturn
    }))
    .sort((a, b) => b.rs - a.rs);
  
  const outperformers = withRS.filter(i => i.rs > 0).slice(0, 5);
  const underperformers = withRS.filter(i => i.rs < 0).slice().reverse().slice(0, 5);

  const MAX_SPREAD = 3.0; // 3% 갭을 프로그레스 게이지 100%로 시각화 (정규화)

  return (
    <div className="relative-strength-board glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px', padding: '1.5rem', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-secondary)' }}>GLOBAL RS STRENGTH</h3>
        <select 
          className="glass-panel" 
          style={{ background: 'var(--overlay)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '4px', outline: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
          value={baselineTicker}
          onChange={(e) => setBaselineTicker(e.target.value)}
        >
          <option value="^GSPC" style={{ color: 'black' }}>vs S&P 500</option>
          <option value="^IXIC" style={{ color: 'black' }}>vs Nasdaq 100</option>
        </select>
      </div>

      <div className="rs-sections flex-1" style={{ display: 'flex', gap: '3rem' }}>
        
        {/* Outperformers Column */}
        <div className="rs-list" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--bull)', marginBottom: '1.25rem', fontWeight: 600, letterSpacing: '1px' }}>OUTPERFORMING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {outperformers.length > 0 ? outperformers.map(idx => {
              const fillPct = Math.min(100, (idx.rs / MAX_SPREAD) * 100);
              return (
                <div key={idx.symbol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FlagIcon flag={idx.flag} size={16} /> {idx.name}</span>
                    <span className="text-bull font-mono" style={{ fontSize: '0.9rem', fontWeight: 600}}>+{idx.rs.toFixed(2)}%</span>
                  </div>
                  <div style={{ height: '10px', background: 'var(--glass-border, #1a1a1a)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, background: 'var(--bull)', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              );
            }) : <div className="text-muted text-sm" style={{ padding: '1rem 0' }}>No outperformers</div>}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 -1.5rem' }} />

        {/* Underperformers Column */}
        <div className="rs-list" style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--bear)', marginBottom: '1.25rem', fontWeight: 600, letterSpacing: '1px', display: 'flex', justifyContent: 'flex-end' }}>UNDERPERFORMING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {underperformers.length > 0 ? underperformers.map(idx => {
              const absRs = Math.abs(idx.rs);
              const fillPct = Math.min(100, (absRs / MAX_SPREAD) * 100);
              return (
                <div key={idx.symbol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FlagIcon flag={idx.flag} size={16} /> {idx.name}</span>
                    <span className="text-bear font-mono" style={{ fontSize: '0.9rem', fontWeight: 600}}>{idx.rs.toFixed(2)}%</span>
                  </div>
                  <div style={{ height: '10px', background: 'var(--glass-border, #1a1a1a)', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, background: 'var(--bear)', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              );
            }) : <div className="text-muted text-sm" style={{ textAlign: 'right', padding: '1rem 0' }}>No underperformers</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
