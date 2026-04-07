# 📚 Gidne Documentation

> 프로젝트의 기술 문서, 설계서, 회고록 등을 체계적으로 관리합니다.
> **마지막 업데이트:** 2026-04-08

## 📁 문서 구조

```
docs/
├── README.md                        ← 이 파일 (문서 인덱스)
├── architecture.md                  ← 기술 아키텍처 & 알고리즘 워크스루
├── EOD_ALPHA_V2_SPEC.md             ← EOD Alpha Briefing 기능 명세서
├── retro/                           ← 주간/일일 회고록
│   ├── 2026-04-03.md
│   ├── RETRO_2026-04-07.md
│   └── RETRO_2026-04-08.md          ← 최신 (아키텍처 결정 포함)
└── reviews/                         ← 코드 리뷰 & 보안 감사 기록
    └── 2026-04-03-plan-review.md
```

### 루트 설계 문서 (프로젝트 루트에 위치)

```
/
├── README.md                        ← 프로젝트 소개 & 실행 방법
├── DESIGN.md                        ← Flows 탭 고도화 설계서
├── DESIGN_V2_EOD.md                 ← EOD Alpha Signal 원본 설계서
└── MACRO_DESIGN.md                  ← Macro Focus 위젯 고도화 설계서
```

## 🔗 Quick Links

| 문서 | 설명 | 상태 |
|------|------|------|
| [아키텍처](./architecture.md) | 프레임워크, 기술 스택, Redis Data Pump, 핵심 알고리즘, 데이터 흐름, UI 설계 원칙 | ✅ 최신 |
| [EOD 스펙](./EOD_ALPHA_V2_SPEC.md) | EOD Alpha Briefing 타임프레임, Watchlist Movers, Flexbox 렌더링 원칙 | ✅ 최신 |
| [설계서 — Flows](../DESIGN.md) | Flows 탭 크립토/주식 자금흐름 설계 | 🟡 미구현 |
| [설계서 — EOD](../DESIGN_V2_EOD.md) | Alpha Signal & EOD Wrap-up 원본 기획 | ✅ 구현 완료 |
| [설계서 — Macro](../MACRO_DESIGN.md) | Macro Focus 위젯 하이브리드(프리셋+커스텀) 설계 | ✅ 구현 완료 |
| [회고록](./retro/) | 작업 일지 & 회고 | ✅ 최신 |
| [리뷰](./reviews/) | 코드 리뷰 & 계획 리뷰 기록 | 📋 기록 중 |

## 📊 기능 구현 현황 (Feature Status)

| 기능 | 설계 문서 | 상태 |
|------|-----------|------|
| Equities 대시보드 (Bento Grid) | architecture.md | ✅ 안정 |
| Redis Data Pump 아키텍처 | architecture.md | ✅ 안정 |
| EOD Alpha Briefing (1D/1W/1M + 복사) | EOD_ALPHA_V2_SPEC.md | ✅ 안정 |
| Watchlist (드래그 앤 드롭 + 30개 제한) | architecture.md | ✅ 안정 |
| 뉴스 파이프라인 (번역 + 세이브티커) | architecture.md | ✅ 안정 |
| 토스증권 스타일 티커 헤더 | architecture.md | ✅ 안정 |
| Macro Focus 위젯 (HOT/금리/원자재/커스텀) | MACRO_DESIGN.md | ✅ 안정 |
| Graceful Error Handling (Redis 미연결 폴백) | architecture.md | ✅ 안정 |
| 듀얼 테마 (다크/라이트) | architecture.md | ✅ 안정 |
| Flows 탭 (도미넌스, TOTAL3, ETF) | DESIGN.md | 🟡 미구현 |
| 차트 인터랙션 (줌, 패닝) | — | 🟡 미구현 |
| 알림 시스템 | — | 🟡 미구현 |
