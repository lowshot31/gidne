import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** 탭 버튼 크기. 'sm' = 작은 위젯용, 'md' = 기본, 'lg' = 페이지 레벨 토글 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 요소 (예: 외부 링크 버튼)를 탭 바 내부에 렌더링 */
  suffix?: React.ReactNode;
}

const SIZE_MAP = {
  sm: { padding: '0.35rem 0.3rem', fontSize: '0.72rem' },
  md: { padding: '0.4rem 0.4rem', fontSize: '0.78rem' },
  lg: { padding: '0.6rem 1rem', fontSize: '0.9rem' },
} as const;

/**
 * Toss 스타일 필 세그먼트 컨트롤
 * 
 * 앱 전체에서 동일한 디자인 언어를 보장하는 공용 탭 컴포넌트.
 * 디자인 변경 시 이 파일 하나만 수정하면 전체 반영됩니다.
 */
export default function SegmentedControl({ tabs, activeTab, onTabChange, size = 'md', suffix }: Props) {
  const sizeStyle = SIZE_MAP[size];

  return (
    <>
    <div 
      className="segmented-control-wrapper"
      style={{ 
        display: 'flex', 
        background: 'var(--overlay)', 
        borderRadius: '10px', 
        padding: '0.2rem',
        alignItems: 'center',
        gap: '2px', // 탭 사이 간격을 좁혀서 공간 확보
        maxWidth: '100%',
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: '1 1 auto', // 글자가 긴 놈은 길게, 짧은 놈은 짧게 공간을 유동분배
              flexShrink: 0, // 짤림 방지
              justifyContent: 'center',
              background: isActive ? 'var(--overlay-hover)' : 'transparent',
              border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
              padding: sizeStyle.padding,
              cursor: 'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 500,
              fontSize: sizeStyle.fontSize,
              whiteSpace: 'nowrap',
              overflow: 'hidden', // 만약 글자가 길어도 넘치지 않도록
              textOverflow: 'ellipsis',
              borderRadius: '8px',
              transition: 'all 0.2s',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
      {suffix}
    </div>
    <style>{`
      .segmented-control-wrapper::-webkit-scrollbar {
        display: none;
      }
      .segmented-control-wrapper {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      [data-theme='light'] .segmented-control-wrapper {
        background: var(--overlay) !important;
      }
      [data-theme='light'] .segmented-control-wrapper button[style*="background: var(--overlay-hover)"] {
        background: white !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        border: 1px solid var(--border-color) !important;
      }
    `}</style>
    </>
  );
}
