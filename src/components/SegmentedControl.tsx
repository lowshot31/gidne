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
  sm: { padding: '0.35rem 0.7rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 0.8rem', fontSize: '0.85rem' },
  lg: { padding: '0.6rem 1.5rem', fontSize: '0.9rem' },
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
    <div style={{ 
      display: 'inline-flex', 
      background: 'rgba(255, 255, 255, 0.05)', 
      borderRadius: '12px', 
      padding: '0.25rem',
      alignItems: 'center',
      gap: '2px',
      overflowX: 'auto',
      maxWidth: '100%',
      scrollbarWidth: 'none' as const,
      msOverflowStyle: 'none' as any,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            padding: sizeStyle.padding,
            cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === tab.id ? 600 : 500,
            fontSize: sizeStyle.fontSize,
            whiteSpace: 'nowrap',
            borderRadius: '8px',
            transition: 'all 0.2s',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {tab.label}
        </button>
      ))}
      {suffix}
    </div>
  );
}
