# Macro Focus (Gidne) 고도화 설계 문서

> **상태:** ✅ 구현 완료 (2026-04-08)
> **구현체:** `src/components/MacroFocusWidget.tsx`, `src/components/MacroRow.tsx`

## 1. 개요 및 문제 정의
현재 Gidne의 `Macro Focus` 위젯은 하드코딩된 소수의 지표(VIX, 10Y, DXY 등)만 평면적으로 나열하여 거시 경제의 입체적인 흐름을 읽기 어렵습니다. 또한, 수준 높은 트레이더와 갓 입문한 주린이 등 **다양한 유저 스펙트럼**을 동시에 만족시키지 못하는 한계가 있습니다.

## 2. 핵심 목표 (Hybrid Approach)
초보자를 위한 **'친절하고 완벽한 기본 밥상'**과, 고인물을 위한 **'무한 커스텀 기능'**을 동시에 제공하는 하이브리드 지표 보드 구축.

## 3. 사용자 페르소나 및 핵심 기능
1. **주린이 (Level 1)**: 거시 경제가 뭔진 모르지만 "오늘 시장이 위험한지" 알고 싶음.
   - **해결책 (스마트 프리셋)**: `[🔥 HOT]`, `[💸 금리/환율]`, `[🛢️ 원자재]` 등으로 탭(Tab)을 쪼개어 프리셋 보드 제공.
   - HOT 탭은 필수 뼈대 지표(VIX, VVIX, SKEW, 10Y, DXY) + 당일 변동 최고치 종목 5개를 자동 추출
2. **고인물 (Level 10)**: 나만의 거시 지표(구리 단가, M2 통화량, 하이일드 스프레드 등)를 매일 아침 체크해야 함.
   - **해결책 (커스텀 탭)**: `[⭐️ 내 지표]` 탭을 제공하여, 본인이 원하는 `Ticker`를 직접 추가/삭제 가능 (LocalStorage 연동).

## 4. UI/UX 디자인 플로우
- **위젯 상단**: `<Tabs>` 구조
  - `🔥 HOT` (기본값) | `💸 금리/환율` | `🛢️ 원자재` | `⭐️ 내 지표`
- **리스트 영역**: `display: flex; flex-direction: column; flex: 1; overflow-y: auto` 구조.
- **+ 버튼 (우측 상단)**: 누르면 `TickerSearch` 자동완성 드롭다운이 나와서 티커를 추가함. 추가된 지표는 `내 지표` 탭에 자동 저장됨.
- **아이템 UI**: 
  - 좌측: 티커명 + (친절한 한글 별명, 예: `VIX` -> `공포 지수`)
  - 우측: 실시간 가격 + 일일 변동률(녹색/적색 색상 반영)

## 5. 데이터 모델 (LocalStorage)
```typescript
interface CustomMacroItem {
  ticker: string; // 예: "HG=F" 
  name: string;   // 예: "Copper (구리)"
}
// 저장 키: 'gidne_macro_custom'
// 타입: CustomMacroItem[]
```

## 6. 개발 마일스톤

| 단계 | 설명 | 상태 |
|------|------|------|
| Step 1 | 프리셋 목록을 카테고리별 배열로 정리 | ✅ 완료 |
| Step 2 | 카테고리 탭 인터페이스 구현 | ✅ 완료 |
| Step 3 | `TickerSearch` 재활용한 커스텀 지표 추가 + localStorage 직렬화 | ✅ 완료 |
| Step 4 | 탭 전환 시 overflow-y 처리 및 Flexbox 유동성 최적화 | ✅ 완료 |

