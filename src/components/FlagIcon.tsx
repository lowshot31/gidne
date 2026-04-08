import React from 'react';

/**
 * 크로스 브라우저 국기 아이콘
 * 
 * Windows Chrome은 국기 이모지를 렌더링하지 못함 (Segoe UI Emoji 미지원).
 * 이 컴포넌트는 이모지의 유니코드 코드포인트를 Twemoji CDN 이미지 URL로 변환하여
 * Chrome, Firefox, Safari 등 모든 브라우저에서 동일하게 국기를 표시합니다.
 */

interface Props {
  /** 국기 이모지 문자열 (예: 🇺🇸, 🇰🇷) */
  flag: string;
  /** 아이콘 크기 (px), 기본값 20 */
  size?: number;
}

function emojiToTwemojiUrl(emoji: string): string {
  // 이모지를 코드포인트로 변환 → Twemoji CDN URL 생성
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints}.svg`;
}

export default function FlagIcon({ flag, size = 20 }: Props) {
  if (!flag) return null;
  
  return (
    <img
      src={emojiToTwemojiUrl(flag)}
      alt={flag}
      width={size}
      height={size}
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle',
        flexShrink: 0 
      }}
      loading="lazy"
      // 이미지 로드 실패 시 원본 이모지로 폴백
      onError={(e) => {
        const span = document.createElement('span');
        span.textContent = flag;
        span.style.fontSize = `${size}px`;
        span.style.lineHeight = '1';
        e.currentTarget.replaceWith(span);
      }}
    />
  );
}
