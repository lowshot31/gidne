# 🧭 Gidne v2 — 종합 설계 문서

> **"복잡한 데이터의 숲에서 수익으로 가는 길을 제시하다."**
>
> **Gidne** = **Guide(길잡이)** + **Node(거점)**
> 파편화된 금융 데이터를 연결하여 투자자가 의사결정을 내릴 수 있는 최적의 경로를 제공

---

## 📌 목차

1. [리서치 요약](#1-리서치-요약)
2. [문제 정의](#2-문제-정의)
3. [사용자 페르소나](#3-사용자-페르소나)
4. [핵심 기능 (MVP Scope)](#4-핵심-기능-mvp-scope)
5. [기술 결정](#5-기술-결정)
6. [데이터 소스 & 모델](#6-데이터-소스--모델)
7. [디자인 시스템](#7-디자인-시스템)
8. [UI 레이아웃](#8-ui-레이아웃)
9. [플랜 리뷰 결과 & 개선안](#9-플랜-리뷰-결과--개선안)
10. [배포 전략](#10-배포-전략)
11. [구현 로드맵](#11-구현-로드맵)

---

## 1. 리서치 요약

### 참조한 오픈소스 프로젝트

| 레포지토리 | ⭐ | 핵심 참고 포인트 |
|-----------|-----|------------------|
| [tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills) | 597 | Sector Analyst, Breadth Analyzer, Macro Regime Detector 등 11개 스킬. TraderMonty CSV(무료), FMP API, FINVIZ 활용. RS/Breadth 분석 알고리즘 참고 |
| [himself65/finance-skills](https://github.com/himself65/finance-skills) | 726 | **웹앱 포함** (`apps/web`), TypeScript 91.3%. earnings-preview, options-payoff, stock-correlation, yfinance-data 스킬. UI 레퍼런스 + TS 코드 참고 |
| [RKiding/Awesome-finance-skills](https://github.com/RKiding/Awesome-finance-skills) | 1.5k | 실시간 뉴스 + 감성분석 + 시장 예측. Python 100%. DeepEar 프레임워크 연동. **Antigravity 직접 지원** (`~/.gemini/antigravity/global_skills/`) |

### 핵심 인사이트

- **MCP (Model Context Protocol)**: AI 에이전트와 외부 도구 연결의 현재 표준
- **데이터 스택**: `yfinance` (무료) → `openbb` (프로페셔널) → Polygon/Twelve Data (유료)
- **기술분석**: `pandas-ta` (130+ 지표), `technicalindicators` (npm)
- **차트**: TradingView Lightweight Charts가 무료 + 고성능 + 트레이딩 전문

---

## 2. 문제 정의

### 🔴 현재 투자자가 겪는 핵심 문제

| # | 문제 | 구체적 상황 |
|---|------|------------|
| 1 | **정보 파편화** | FRED, TradingView, Coinglass, Finviz, CNN을 5-6개 탭으로 관리 |
| 2 | **맥락 부재** | 나스닥 하락 → 비트코인 영향? 금리 상승 → 섹터 로테이션? 연결이 안 됨 |
| 3 | **시간 비용** | 정보 종합에 하루 1-2시간 낭비 |
| 4 | **상대 강도 부재** | 지수 대비 진짜 강한 종목/섹터가 뭔지 한눈에 안 보임 |

### 💡 Gidne의 해결

> **"하나의 화면에서, 실시간으로, 맥락까지."**

- 모든 데이터를 Bento Grid 대시보드에 통합
- 폴링 기반 자동 갱신 (30초/장중, 5분/장외)
- **RS(상대 강도) 기반으로 진짜 대장주/섹터를 한눈에 식별**

### 경쟁 분석

| 서비스 | 강점 | 약점 | Gidne 차별점 |
|--------|------|------|-------------|
| **TradingView** | 차트 분석 최강, 커뮤니티 | 매크로 데이터 통합 부족, RS 기능 없음 | 매크로-크립토 시냅스 + RS 필터링 |
| **Coinglass** | 파생상품 데이터 표준 | 크립토 전용, UI 올드함 | 주식/매크로 통합 + 모던 UI |
| **CNN Fear & Greed** | 직관적 심리 지표 | 단일 지표, 맥락 없음 | 복합 지표 기반 (Market Pulse) |
| **Investing.com** | 종합 경제 캘린더 | UI 복잡, 광고 과다 | 클린 UI, 핵심 이벤트 집중 |
| **Finviz** | 섹터 히트맵 | 주식만, 매크로 연결 없음 | 섹터 RS + 매크로 맥락 |

---

## 3. 사용자 페르소나

| | Primary | Secondary |
|---|---|---|
| **이름** | "시간 부족한 스마트 개미" | "풀타임 트레이더" |
| **연령** | 25-40세, 직장인 | 30-50세, 전업 투자자 |
| **투자 경력** | 1-3년, 중급 | 5년+, 고급 |
| **투자 스타일** | 레버리지/스윙 트레이딩 | 매크로+크립토 멀티에셋 |
| **Pain Point** | 퇴근 후 30분 안에 시장 파악이 안 됨 | 데이터는 많은데 맥락이 안 연결됨 |
| **Goal** | 효율적 의사결정 경로 확보 | 매크로 변화의 크립토 전이 선제 포착 |

---

## 4. 핵심 기능 (MVP Scope)

### Phase 1: MVP — "Equities 탭" 완성 집중

> ⚠️ 플랜리뷰 결과: P0를 6개에서 핵심 3개로 축소. "Equities 탭"만 완벽하게 먼저.

| 기능 | 우선순위 | 설명 | 데이터소스 |
|------|----------|------|-----------|
| **Global Ticker Strip** | P0 | 상단 실시간 시세 스크롤 (지수 + 원자재 + 크립토) | Yahoo Finance |
| **Sector Strength Bar** | P0 | 11개 섹터 ETF 수평 바 차트 + RS 기반 정렬. 색상 강도 = 등락률 | Yahoo Finance |
| **RS Leaderboard** | P0 | 상대강도 랭킹. **어제 대비 순위 변동(▲▼) 표시** = 섹터 로테이션 신호 (킬러 피처) | 내부 연산 |
| **Market Pulse 게이지** | P0 | 0-100 점수. 열자마자 3초 안에 시장 상태 판단 | 복합 계산 |
| **Macro Focus 카드** | P1 | 금리 스프레드, VIX, DXY, CPI (숫자 + 스파크라인) | FRED API, Yahoo Finance |
| **Price Chart** | P1 | TradingView Lightweight Charts. 섹터 바 클릭 시 해당 ETF 차트 전환 | Yahoo Finance |
| **Event Horizon** | P1 | FOMC/CPI 카운트다운 타임라인 | 하드코딩 + FRED |
| **대표지수 카드** | P1 | SPY, QQQ, DIA, IWM, KOSPI, KOSDAQ + 7일 스파크라인 | Yahoo Finance |

### Market Pulse 계산 공식

```
Market Pulse Score (0-100) =
  상승 섹터 비율 (40%)   → 예: 8/11 = 72.7% → 29.1점
  RS 평균 강도 (30%)     → 예: 평균 RS +0.5% → 15.0점
  VIX 안전 구간 (20%)    → 예: VIX < 20 = 100% → 20.0점
  ADV/DECL 비율 (10%)    → 예: 2.41 비율 → 8.0점
                           ──────────────
                           = 72.1 / 100

해석:
  0-25:  🔴 EXTREME FEAR  — 시장 공포 극단
 26-45:  🟠 BEARISH       — 하락 우세
 46-55:  🟡 NEUTRAL       — 관망
 56-75:  🟢 BULLISH       — 상승 우세  
 76-100: 🔵 EXTREME GREED — 과열 주의
```

### RS(상대강도) 계산

```
RS Spread = Ticker %Δ (1D) - S&P500 %Δ (1D)

해석:
  RS > +1.0%:  🟢 STRONG  — 시장보다 강함 (매수 관심)
  RS ±1.0%:    🟡 NEUTRAL — 시장과 동조
  RS < -1.0%:  🔴 WEAK    — 시장보다 약함 (주의)

킬러 피처: 어제 대비 RS 순위 변동
  XLF: 4위 → 2위 (▲2) = 자금 유입 신호
  XLE: 2위 → 7위 (▼5) = 자금 이탈 경고
```

### Phase 2: Growth

| 기능 | 설명 |
|------|------|
| **Indices 탭** | 대표지수 상세 차트 + 크로스 비교 |
| **Macro 탭** | 순유동성(WALCL-TGA-RRP), 금리곡선, MOVE vs VIX |
| **Flows 탭** | 기관 수급, 크립토 온체인, 김치 프리미엄 |
| **Breadth Score** | 시장 참여도 점수 0-100 (tradermonty 알고리즘 참고) |
| **매크로 레짐** | Concentration/Broadening/Contraction/Inflationary |
| **VIX 텀스트럭처** | 선물 곡선 분석 (Contango/Backwardation) |
| **알림** | Telegram/Discord 연동 |

### Phase 3: Platform

| 기능 | 설명 |
|------|------|
| **Synapse AI Terminal** | 매크로→크립토 연쇄 반응 자동 분석 |
| **포트폴리오 트래커** | 보유 종목 RS 모니터링 |
| **Vercel/Cloudflare 배포** | 서비스 공개 |

---

## 5. 기술 결정

### 🏗️ 아키텍처: Astro (hybrid) + React Islands

```
왜 이 조합인가?

Astro (output: 'hybrid')
├── 정적 부분 → SSG (빌드 시 생성, JS 없음)
│   ├── 레이아웃 셸 (네비게이션, 탭, 푸터)
│   ├── EventHorizon (이벤트 캘린더)
│   └── 정적 페이지들
│
├── API Routes → SSR (서버에서 실행)
│   ├── /api/market-data  → Yahoo Finance 프록시 + 캐싱
│   ├── /api/fred          → FRED API 프록시
│   └── /api/indicators    → 기술지표 계산
│
└── React Islands → 클라이언트 (브라우저에서 실행)
    ├── TickerStrip.tsx    client:load
    ├── SectorBar.tsx      client:load
    ├── RSLeaderboard.tsx  client:load
    ├── MarketPulse.tsx    client:load
    ├── MacroFocus.tsx     client:visible
    ├── PriceChart.tsx     client:only="react"  ← SSR 불가
    └── IndexCards.tsx     client:visible

Vite 설명 (참고):
  Vite = 프론트엔드 빌드 도구 (프랑스어로 "빠르다")
  Astro 내부적으로 Vite를 엔진으로 사용 → 별도 설정 불필요
```

### 데이터 흐름

```
[브라우저]
    │
    ├── Astro 정적 셸 ←── 빌드 시 생성
    │
    ├── React Islands ←── client:load / client:visible
    │       │
    │       ├── TickerStrip ──┐
    │       ├── SectorBar ────┤
    │       ├── RSLeaderboard ┤──→ /api/market-data ──→ Yahoo Finance
    │       ├── MarketPulse ──┤              │
    │       ├── PriceChart ───┘      [In-Memory Cache]
    │       │                        TTL: 30s (시세)
    │       ├── MacroFocus ────→ /api/fred ──→ FRED API
    │       │                        TTL: 1h (매크로)
    │       └── RSGauge ──────→ 내부 계산 (indicators.ts)
    │
    └── [Polling: setInterval]
         장중: 30초 간격
         장외: 5분 간격
         판단: 미국 장중 = UTC 14:30-21:00 (ET 9:30-16:00)
```

### 기술 스택

| 카테고리 | 선택 | 이유 |
|----------|------|------|
| **프레임워크** | Astro 5.x (`output: 'hybrid'`) | 정적 셸 + SSR API Routes + React Islands |
| **UI 인터랙션** | React 19 | 동적 차트/데이터만 담당 |
| **차트** | TradingView Lightweight Charts v4 | 무료, 고성능, 트레이딩 전문, `client:only="react"` |
| **스타일** | Vanilla CSS (CSS Variables) | 다크모드 전용 디자인 시스템 |
| **폰트** | Outfit (헤딩) + Inter (본문) | 기존 기드네 디자인 계승 |
| **기술지표** | technicalindicators (npm) | RSI, MACD, BB, SMA/EMA, ATR |
| **타입** | TypeScript (strict) | 안정성 + 자동완성 |

### 📁 프로젝트 구조

```
gidne-app/
├── src/
│   ├── layouts/
│   │   └── Dashboard.astro             ← 메인 대시보드 레이아웃 (탭 네비 포함)
│   │
│   ├── pages/
│   │   ├── index.astro                 ← Equities 탭 (메인, Phase 1)
│   │   ├── indices.astro               ← Indices 탭 (Phase 2)
│   │   ├── macro.astro                 ← Macro 탭 (Phase 2)
│   │   ├── flows.astro                 ← Flows 탭 (Phase 2)
│   │   └── api/
│   │       ├── market-data.ts          ← Yahoo Finance 프록시 + in-memory 캐시
│   │       ├── fred.ts                 ← FRED API 프록시 (.env 키 보호)
│   │       └── indicators.ts           ← 기술지표 계산 API
│   │
│   ├── components/
│   │   ├── TickerStrip.tsx             ← [React] 상단 시세 스크롤
│   │   ├── MarketPulse.tsx             ← [React] 0-100 시장 온도 게이지
│   │   ├── SectorBar.tsx               ← [React] 11개 섹터 수평 바 + RS
│   │   ├── RSLeaderboard.tsx           ← [React] RS 랭킹 + 순위 변동
│   │   ├── PriceChart.tsx              ← [React] TradingView Lightweight Charts
│   │   ├── MacroFocus.tsx              ← [React] 매크로 지표 카드
│   │   ├── IndexCards.tsx              ← [React] 대표지수 + 스파크라인
│   │   ├── EventHorizon.astro          ← [Astro] 이벤트 타임라인 (정적)
│   │   └── SkeletonCard.tsx            ← [React] 로딩 스켈레톤 UI
│   │
│   ├── lib/
│   │   ├── yahoo-finance.ts            ← Yahoo Finance 데이터 fetch + 배치
│   │   ├── fred-api.ts                 ← FRED API 클라이언트
│   │   ├── indicators.ts               ← RS, RSI, MACD, BB 계산
│   │   ├── market-pulse.ts             ← Market Pulse 점수 계산
│   │   ├── cache.ts                    ← TTL 기반 in-memory 캐시
│   │   └── tickers.ts                  ← 고정 티커 목록 (상수)
│   │
│   └── styles/
│       └── global.css                  ← 기드네 디자인 시스템
│
├── public/
│   └── gidne_mockup.png                ← 원본 목업 (참조용)
│
├── .env.example                        ← FRED_API_KEY 등
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── DESIGN.md                           ← 이 파일
```

---

## 6. 데이터 소스 & 모델

### 데이터 소스 (전부 무료)

| 소스 | 데이터 | API 키 | 제한 | Fallback |
|------|--------|--------|------|----------|
| **Yahoo Finance** | 시세, 차트, 섹터 ETF, 지수 | 불필요 | 비공식 (CORS 프록시 필수) | Twelve Data 무료 티어 (800 req/day) |
| **FRED API** | 금리, CPI, 유동성 (WALCL, TGA, RRP) | 무료 키 발급 | 120 req/min | Alpha Vantage |
| **TraderMonty CSV** | Breadth 데이터 (Phase 2) | 불필요 | GitHub CSV 직접 fetch | — |

### 고정 티커 목록

```typescript
// src/lib/tickers.ts

export const INDICES = [
  { ticker: '^GSPC', name: 'S&P 500', symbol: 'SPY', flag: '🇺🇸' },
  { ticker: '^IXIC', name: 'Nasdaq 100', symbol: 'QQQ', flag: '🇺🇸' },
  { ticker: '^DJI', name: 'Dow Jones', symbol: 'DIA', flag: '🇺🇸' },
  { ticker: '^RUT', name: 'Russell 2000', symbol: 'IWM', flag: '🇺🇸' },
  { ticker: '^KS11', name: 'KOSPI', symbol: 'KOSPI', flag: '🇰🇷' },
  { ticker: '^KQ11', name: 'KOSDAQ', symbol: 'KOSDAQ', flag: '🇰🇷' },
] as const;

export const SECTOR_ETFS = [
  { ticker: 'XLK', name: 'Technology', cycle: 'Late', color: '#6366f1' },
  { ticker: 'XLF', name: 'Financials', cycle: 'Early', color: '#22c55e' },
  { ticker: 'XLV', name: 'Healthcare', cycle: 'Defensive', color: '#06b6d4' },
  { ticker: 'XLE', name: 'Energy', cycle: 'Mid', color: '#f97316' },
  { ticker: 'XLI', name: 'Industrials', cycle: 'Early', color: '#eab308' },
  { ticker: 'XLP', name: 'Staples', cycle: 'Defensive', color: '#84cc16' },
  { ticker: 'XLY', name: 'Discretionary', cycle: 'Early', color: '#ec4899' },
  { ticker: 'XLU', name: 'Utilities', cycle: 'Defensive', color: '#a855f7' },
  { ticker: 'XLB', name: 'Materials', cycle: 'Mid', color: '#14b8a6' },
  { ticker: 'XLRE', name: 'Real Estate', cycle: 'Rate-Sensitive', color: '#f43f5e' },
  { ticker: 'XLC', name: 'Communication', cycle: 'Growth', color: '#3b82f6' },
] as const;

export const MACRO_TICKERS = [
  { ticker: '^VIX', name: 'VIX', category: 'volatility' },
  { ticker: 'DX-Y.NYB', name: 'Dollar Index', category: 'currency' },
  { ticker: '^TNX', name: '10Y Yield', category: 'rates' },
  { ticker: 'GC=F', name: 'Gold', category: 'commodity' },
  { ticker: 'TLT', name: '20Y Bond ETF', category: 'rates' },
] as const;

export const TICKER_STRIP = [
  // Ticker Strip에 표시할 순서
  { ticker: 'GC=F', name: 'GOLD' },
  { ticker: '^IXIC', name: 'NASDAQ 100' },
  { ticker: '^GSPC', name: 'S&P 500' },
  { ticker: '^KS11', name: 'KOSPI' },
  { ticker: '^N225', name: 'NIKKEI 225' },
  { ticker: 'BTC-USD', name: 'BTC/USD' },
  { ticker: 'DX-Y.NYB', name: 'DXY' },
  { ticker: '^TNX', name: 'US 10Y' },
] as const;
```

---

## 7. 디자인 시스템

### 다크모드 전용 (플랜리뷰 결정)

> 트레이딩 대시보드는 다크 모드가 업계 표준. 라이트 모드 없음으로 CSS 공수 절감.

### 디자인 토큰 (기존 기드네 목업 계승)

```css
:root {
  /* ── 배경 ── */
  --bg-color: #050507;
  --card-bg: rgba(15, 15, 20, 0.7);
  --card-bg-hover: rgba(25, 25, 35, 0.8);

  /* ── 브랜드 컬러 ── */
  --accent-primary: #00f2ff;        /* 시안 네온 */
  --accent-secondary: #6366f1;      /* 인디고 */
  --gradient-brand: linear-gradient(90deg, #00f2ff, #6366f1);

  /* ── 마켓 컬러 ── */
  --bull: #00e676;                   /* 상승 - 녹색 */
  --bear: #ff1744;                   /* 하락 - 빨강 */
  --neutral: #ffd740;                /* 보합 - 노랑 */
  --bull-bg: rgba(0, 230, 118, 0.1);
  --bear-bg: rgba(255, 23, 68, 0.1);

  /* ── 텍스트 ── */
  --text-primary: #ffffff;
  --text-secondary: #a0a0ab;
  --text-muted: #5a5a65;

  /* ── 보더 & 글래스 ── */
  --border-color: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.05);
  --neon-glow: 0 0 20px rgba(0, 242, 255, 0.3);

  /* ── 타이포 ── */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* ── 반경 ── */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  /* ── 간격 ── */
  --gap-sm: 0.75rem;
  --gap-md: 1.5rem;
  --gap-lg: 2rem;
}
```

### 컴포넌트 스타일 가이드

```
카드 (.bento-item):
  background: var(--card-bg)
  border: 1px solid var(--glass-border)
  border-radius: var(--radius-lg)
  backdrop-filter: blur(10px)
  hover → border-color: var(--accent-primary) + box-shadow: var(--neon-glow)

상승/하락 표시:
  상승: color: var(--bull), background: var(--bull-bg)
  하락: color: var(--bear), background: var(--bear-bg)

스켈레톤 로딩:
  background: linear-gradient(90deg, #0f0f14 25%, #1a1a24 50%, #0f0f14 75%)
  animation: shimmer 1.5s infinite
```

---

## 8. UI 레이아웃

### 네비게이션 탭 구조 (목업 기반)

```
┌─── GIDNE ── [Equities] │ Indices │ Macro │ Flows ──── 🔍 Search ──┐
│ [TICKER STRIP] GOLD ▲0.38% │ NDX ▲1.25% │ KOSPI ▲0.45%  ← 자동 스크롤│
```

> Phase 1에서는 Equities 탭만 구현. 나머지는 "Coming Soon" 표시.

### Equities 탭 레이아웃 (최종)

```
┌─── GIDNE ── [Equities] │ Indices │ Macro │ Flows ─── 🔍 ───────┐
│ GOLD ▲0.38% │ NASDAQ ▲1.25% │ S&P ▲0.82% │ KOSPI ▲0.45% │ ... │
├═══════════════════════════════════════════════════════════════════┤
│                                                                   │
│  🟢 MARKET PULSE                                         72/100  │
│  ████████████████████░░░░░░░  BULLISH                            │
│  "8/11 섹터 상승 중, RS 리더: XLK +2.31%"                        │
│                                                                   │
├──────────┬──────────────────────────┬─────────────────────────────┤
│          │                          │                             │
│  MACRO   │  SECTOR STRENGTH         │  RS LEADERBOARD             │
│  FOCUS   │  (수평 바 + RS 기반 정렬) │                             │
│          │                          │  🥇 XLK Tech    ▲+2.31% ▲1 │
│  10Y/2Y  │  XLK ████████████ +1.8% │  🥈 XLY Discr   ▲+1.82% ── │
│  -0.35%  │  XLY ██████████  +1.5%  │  🥉 XLF Fin     ▲+0.94% ▲2 │
│  ⟋⟍⟋⟋   │  XLF ████████   +0.9%  │  ──── 중립 ────              │
│          │  XLI ██████     +0.4%   │  8  XLP Stapl   ▼-0.31% ▼1 │
│  VIX     │  ...                    │  9  XLE Energy  ▼-1.24% ▼3 │
│  14.2    │  XLE ██████     -1.2%   │  10 XLU Util    ▼-1.87% ── │
│  ⟋⟍⟋⟋   │  XLU ████       -1.9%  │                             │
│          │                          │  ▲2 = 어제 대비 2계단 상승  │
│  DXY     │  ● OW  ● Neutral  ● UW │  ▼3 = 어제 대비 3계단 하락  │
│  104.25  │                          │                             │
│  ⟋⟍⟋⟋   │                          │                             │
├──────────┼──────────────────────────┤                             │
│          │                          │                             │
│  EVENT   │  PRICE CHART             │                             │
│  HORIZON │  (TradingView LW)       │                             │
│          │                          │                             │
│ ──●──●── │  [ 섹터 바 클릭 시       │                             │
│ CPI FOMC │    해당 ETF 차트 표시 ]  │                             │
│          │                          │                             │
├──────────┴──────────────────────────┴─────────────────────────────┤
│ ⚡ ENGINE STATUS: OPTIMIZED │ Last Update: 14:23:05 │ 30s polling │
└───────────────────────────────────────────────────────────────────┘
```

### 반응형 (태블릿/모바일)

```
태블릿 (< 1200px):
  3열 → 2열 (Macro + Sector | RS Leaderboard)
  차트는 아래로 이동

모바일 (< 768px):
  단일 열 (세로 스택)
  Market Pulse → Sector Bar → RS 리더보드 → 차트
  Ticker Strip은 터치 스와이프
```

---

## 9. 플랜 리뷰 결과 & 개선안

### 통합 판정

```
╔═══════════════════════════════════════════════════╗
║            PLAN REVIEW REPORT — Gidne v2          ║
╠═══════════════════════════════════════════════════╣
║ CEO 리뷰:    PASS ✅  (8.2/10)                    ║
║ Eng 리뷰:    PASS ✅  (7.0/10, 조건부)            ║
║ Design 리뷰: NEEDS_WORK ⚠️ (6.5/10)              ║
╠═══════════════════════════════════════════════════╣
║ 종합 판정:   REVISE → 디자인 보완 후 GO           ║
╚═══════════════════════════════════════════════════╝
```

### CEO 주요 피드백
- ✅ 문제 정의 날카로움 (본인이 유저)
- ✅ RS 상대강도가 핵심 차별점
- ⚠️ MVP 범위 축소 필요 → **Equities 탭만 먼저 완성**

### Eng 필수 보완 사항

| # | 이슈 | 위험도 | 해결 |
|---|------|--------|------|
| 1 | **CORS 프록시** | 🔴 | Yahoo Finance 직접 호출 불가 → Astro API Routes 필수 |
| 2 | **Yahoo Finance 폴백** | 🟡 | 비공식 API 차단 대비 → Twelve Data 무료 티어 준비 |
| 3 | **스켈레톤 UI** | 🟡 | 빈 화면 방지 → SkeletonCard 컴포넌트 |
| 4 | **장 마감 처리** | 🟡 | "Market Closed" 배너 + 폴링 간격 5분으로 증가 |
| 5 | **FRED API 키** | 🟡 | .env + 서버사이드 전용 → 클라이언트 노출 금지 |
| 6 | **Lightweight Charts SSR** | 🟡 | `client:only="react"` 디렉티브로 서버 렌더링 스킵 |

### Design 개선안 (반영 완료)

| # | 기존 | 개선 |
|---|------|------|
| 1 | 바로 Bento Grid 시작 | **Market Pulse 게이지** (0-100) 최상단 추가 |
| 2 | Treemap 제안 | ❌ **철회** → 수평 바 차트 유지 (11개에 더 적합), 색상 강도만 추가 |
| 3 | RS 단순 리스트 | **리더보드** + **어제 대비 순위 변동** (킬러 피처) |
| 4 | 단일 대시보드 | **탭 구조** (Equities/Indices/Macro/Flows) 목업 의도 살림 |
| 5 | 숫자만 표시 | **7일 스파크라인** 미니차트 추가 |
| 6 | 에러 처리 없음 | **스켈레톤 UI** + "데이터 지연" 배너 |
| 7 | 다크/라이트 토글 | **다크 전용** 확정 (CSS 절감, 업계 표준) |

---

## 10. 배포 전략

### Phase 1: 로컬 개발

```bash
npm run dev  # localhost:4321
```

### Phase 2: 서비스 배포 (미래)

| 플랫폼 | 방법 | 무료 티어 |
|--------|------|-----------|
| **Vercel** | `npx astro add vercel` | 월 100K req, 서버리스 함수 포함 |
| **Cloudflare Pages** | `npx astro add cloudflare` | 무제한 req, Workers로 API 실행 |

> 결정 보류: 서비스화 시 API 호출 비용 발생 가능성 검토 필요

---

## 11. 구현 로드맵

### Sprint 1: 프로젝트 셋업 (Day 1)
- [ ] Astro 프로젝트 초기화 (`npx create-astro`)
- [ ] React, TypeScript 통합
- [ ] 디자인 시스템 (global.css) 구현
- [ ] Dashboard.astro 레이아웃 (탭 네비 포함)

### Sprint 2: 데이터 레이어 (Day 1-2)
- [ ] `tickers.ts` 상수 정의
- [ ] Yahoo Finance API Route 프록시 + 캐싱
- [ ] FRED API Route 프록시
- [ ] `indicators.ts` (RS 계산, Market Pulse 공식)

### Sprint 3: 핵심 컴포넌트 (Day 2-3)
- [ ] TickerStrip.tsx (상단 스크롤)
- [ ] MarketPulse.tsx (0-100 게이지)
- [ ] SectorBar.tsx (11개 섹터 수평 바)
- [ ] RSLeaderboard.tsx (랭킹 + 순위 변동)
- [ ] SkeletonCard.tsx (로딩 상태)

### Sprint 4: 차트 & 상세 (Day 3-4)
- [ ] PriceChart.tsx (TradingView Lightweight Charts)
- [ ] MacroFocus.tsx (매크로 지표 + 스파크라인)
- [ ] IndexCards.tsx (대표지수 + 스파크라인)
- [ ] 섹터 바 클릭 → 차트 연동

### Sprint 5: 마무리 (Day 4-5)
- [ ] EventHorizon.astro (이벤트 타임라인)
- [ ] 폴링 구현 (30초/5분 동적 조절)
- [ ] 장 마감 표시 ("Market Closed")
- [ ] 에러 상태 UI
- [ ] 반응형 레이아웃
- [ ] 최종 테스트

---

> **핵심 원칙**: 기드네 목업의 비주얼 아이덴티티를 100% 계승하되,
> Astro + React Islands로 **실제 동작하는 프로덕트**로 만든다.
> RS(상대강도)가 핵심 차별점 — 이걸 가장 눈에 띄는 곳에 배치한다.

---

*Last Updated: 2026-04-03*
*Status: REVISE → 디자인 보완 완료, GO 대기*
