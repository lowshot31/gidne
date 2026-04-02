import { useState, useEffect, useRef } from 'react';

/**
 * 값 변동 시 'flash-up' 또는 'flash-down' CSS 클래스를 반환하는 훅.
 * 이전 값과 비교하여 상승/하락을 감지하고, 일정 시간 뒤 자동으로 클래스를 제거합니다.
 */
export function useFlash(value: number | undefined, durationMs = 800): string {
  const prevRef = useRef<number | undefined>(undefined);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (value === undefined) return;
    
    const prev = prevRef.current;
    prevRef.current = value;

    // 최초 렌더링 시에는 Flash를 트리거하지 않음
    if (prev === undefined) return;
    // 값이 동일하면 무시
    if (prev === value) return;

    const direction = value > prev ? 'flash-up' : 'flash-down';
    setFlashClass(direction);

    const timer = setTimeout(() => setFlashClass(''), durationMs);
    return () => clearTimeout(timer);
  }, [value, durationMs]);

  return flashClass;
}
