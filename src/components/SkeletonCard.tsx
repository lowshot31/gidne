import React from 'react';

interface Props {
  title?: string;
  /** 에러 메시지가 있으면 스켈레톤 대신 에러 카드 표시 */
  error?: string | null;
  /** 에러 시 재시도 콜백 */
  onRetry?: () => void;
}

/**
 * 프로그레시브 로딩 카드
 * - 로딩 중: shimmer 애니메이션 + 부드러운 텍스트 펄스
 * - 에러 시: 인라인 에러 메시지 + 재시도 버튼
 */
export default function SkeletonCard({ title, error, onRetry }: Props) {
  // ── 에러 상태 ──
  if (error) {
    return (
      <div className="bento-item h-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center', padding: '1.5rem' }}>
        <div style={{ fontSize: '1.5rem', opacity: 0.5 }}>⚠️</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          데이터를 불러올 수 없습니다
        </p>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>
          {error}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: '0.25rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  // ── 로딩 상태 ──
  return (
    <div className="bento-item h-full" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {title && <h3 className="text-secondary mb-md">{title}</h3>}
      
      {/* Shimmer bar */}
      <div 
        style={{
          flex: 1,
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(90deg, #161616 25%, #1c1c1c 50%, #161616 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear'
        }}
      />
      
      {/* 로딩 텍스트 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <div className="skeleton-dots" style={{ display: 'flex', gap: '4px' }}>
          <span className="skeleton-dot" />
          <span className="skeleton-dot" style={{ animationDelay: '0.15s' }} />
          <span className="skeleton-dot" style={{ animationDelay: '0.3s' }} />
        </div>
        <span className="skeleton-pulse-text" style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          정보를 가져오는 중...
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .skeleton-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        .skeleton-pulse-text {
          animation: textPulse 2s infinite ease-in-out;
        }
        [data-theme='light'] .bento-item .skeleton-dot {
          background: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
