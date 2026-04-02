# 🧭 Gidne v2 — 기술 아키텍처 & 알고리즘 워크스루

> **마지막 업데이트:** 2026-04-03
> **현재 상태:** MVP 완성 (Equities 탭), 라이브 배포 중

---

## 1. 프레임워크 & 기술 스택

| 카테고리 | 기술 | 버전 | 왜 이걸 선택했는가? |
|----------|------|------|---------------------|
| **메타 프레임워크** | Astro | 5.x (hybrid SSR) | 정적 셸(HTML) + 동적 API Routes + React Islands. 페이지 로드 시 JS를 최소화하면서도 실시간 데이터 처리 가능 |
| **UI 라이브러리** | React | 19 | 차트, 리더보드 등 인터랙티브 위젯만 "섬(Island)"으로 독립 렌더링. 불필요한 곳에 JS를 보내지 않음 |
| **차트 엔진** | TradingView Lightweight Charts | 5.1 | 무료 + 고성능 캔버스(WebGL) 렌더링. 금융 전문 차트 라이브러리 |
| **그리드 레이아웃** | react-grid-layout | 2.2 | 드래그&리사이즈 가능한 Bento Grid 대시보드. 사용자 커스텀 레이아웃 localStorage 저장 |
| **데이터 API** | yahoo-finance2 (npm) | 3.14 | 서버사이드에서 야후 파이낸스 비공식 API 호출. API 키 불필요, 무료 |
| **실시간 (크립토)** | Binance WebSocket | Native WS | 암호화폐(BTC, ETH, SOL) 초 단위 실시간 가격. 최대 1,024 스트림 동시 구독 가능 |
| **실시간 (주식)** | Finnhub WebSocket | Native WS | 미국 주식 실시간 트레이드 데이터. 무료 티어 (장중에만 활성) |
| **언어** | TypeScript | 5.7 (strict) | 전체 코드베이스 타입 안전성 보장 |
| **테스트** | Vitest | 4.1 | Vite 네이티브 테스트 러너. 빌드 도구와 동일한 엔진 사용으로 설정 제로 |
| **스타일링** | Vanilla CSS (CSS Variables) | — | 다크모드 전용 디자인 시스템. CSS 변수로 테마 전환 지원 |
| **폰트** | Space Grotesk + Inter + JetBrains Mono | — | 헤딩/본문/수치 각각 최적화된 서체 분리 |
| **컨테이너** | Docker | — | `Dockerfile` 포함, Vercel/Cloudflare 배포 준비 완료 |

---

## 2. 아키텍처 패턴: Islands Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    브라우저 (Client)                      │
│                                                         │
│  ┌─── Astro 정적 셸 (0 JS) ───┐                        │
│  │  Dashboard.astro 레이아웃    │                        │
│  │  (Header, Nav, Footer)      │                        │
│  └─────────────────────────────┘                        │
│                                                         │
│  ┌─── React Islands (동적, JS 포함) ─────────────┐      │
│  │                                                │      │
│  │  TickerStrip ──┐                               │      │
│  │  MarketPulse ──┤  5초 폴링 → /api/market-data  │      │
│  │  SectorBar ────┤           (Astro SSR)         │      │
│  │  RSLeaderboard ┤                               │      │
│  │  PriceChart ───┘                               │      │
│  │                                                │      │
│  │  CryptoLive ──────→ Binance WebSocket (직결)   │      │
│  │  TickerStrip(BTC) → Binance WebSocket (직결)   │      │
│  │  TickerStrip(SPY) → Finnhub WebSocket          │      │
│  └────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    서버 (Astro SSR)                       │
│                                                         │
│  /api/market-data → yahoo-finance2 → Yahoo Finance      │
│         │                                               │
│         └→ [In-Memory Cache]                            │
│             TTL: 3초 (시세)                              │
│             TTL: 1시간 (매크로)                           │
│             TTL: 24시간 (RS 순위)                         │
│                                                         │
│  /api/quotes → 청크 병렬 fetch (10개/청크)               │
│  /api/chart  → 개별 종목 차트 데이터                      │
└─────────────────────────────────────────────────────────┘
```

### 왜 이 구조인가?

1. **Astro Islands**: 페이지의 80%는 정적 HTML(네비게이션, 레이아웃). 실시간 데이터가 필요한 20%만 React로 렌더링 → 초기 로딩 속도 극적으로 향상
2. **SSR API Routes**: 야후 파이낸스의 CORS 차단을 우회. Astro 서버가 프록시 역할 → API 키 노출 방지
3. **In-Memory Cache**: 5초마다 폴링해도 서버 캐시(TTL 3초)가 중복 요청을 흡수 → 야후 API 밴 방지

---

## 3. 핵심 알고리즘

### 3.1 RS (Relative Strength) — 상대강도 계산

> 📍 `src/lib/indicators.ts`

```
RS Spread = 섹터 ETF 등락률(%) − S&P 500 등락률(%)
```

| RS 값 | 해석 | 색상 |
|-------|------|------|
| > +1.0% | 🟢 STRONG — 시장보다 강함 | 초록 |
| ±1.0% | 🟡 NEUTRAL — 시장과 동조 | 노랑 |
| < -1.0% | 🔴 WEAK — 시장보다 약함 | 빨강 |

**킬러 피처 — 어제 대비 순위 변동:**
- 24시간 TTL 캐시에 "어제의 RS 순위"를 저장
- 오늘 순위와 비교하여 `▲2` (2계단 상승) 또는 `▼5` (5계단 하락) 표시
- **섹터 로테이션(자금 이동) 신호**의 핵심 지표

### 3.2 Market Pulse — 시장 심리 점수 (0-100)

> 📍 `src/lib/market-pulse.ts`

```
Score = 상승 섹터 비율 × 40%
      + RS 평균 강도   × 30%
      + VIX 안전 구간  × 20%
      + 브레드스 보너스 × 10%
```

| 점수 | 라벨 | 이모지 |
|------|------|--------|
| 0-25 | EXTREME FEAR | 🔴 |
| 26-45 | BEARISH | 🟠 |
| 46-55 | NEUTRAL | 🟡 |
| 56-75 | BULLISH | 🟢 |
| 76-100 | EXTREME GREED | 🔵 |

### 3.3 청크 병렬 페칭 (Chunked Parallel Fetch)

> 📍 `src/lib/yahoo-finance.ts`

```
[33개 티커] → 10개씩 3개 청크로 분할
   ↓
Promise.allSettled([chunk1, chunk2, chunk3])
   ↓
실패한 청크는 무시, 성공한 것만 합치기 (Graceful Degradation)
```

**`Promise.allSettled` 선택 이유:**
- `Promise.all`: 하나라도 실패 → 전체 실패
- `Promise.allSettled`: 실패한 청크만 무시, 나머지 정상 반환 → 대시보드가 부분적으로라도 항상 데이터를 표시

### 3.4 실시간 가격 불빛 (Flash Animation)

> 📍 `src/components/TickerStrip.tsx`

```javascript
// Web Animation API — 리액트 State 한계 우회
el.animate([
  { backgroundColor: 'rgba(38, 166, 154, 0.5)' },  // 초록 번쩍
  { backgroundColor: 'transparent' }
], { duration: 800, easing: 'ease-out' });
```

**CSS 클래스 대신 Web Animation API를 쓰는 이유:**
- 바이낸스 웹소켓은 초당 수 회 가격이 바뀜
- React State로 `flash-up` 클래스를 토글하면 리액트의 배치 업데이트가 중간 프레임을 삼켜서 불빛이 안 보임
- `Element.animate()`는 리액트를 우회하여 DOM에 직접 애니메이션 주입 → **100% 확실한 불빛 보장**

### 3.5 TTL 기반 In-Memory Cache

> 📍 `src/lib/cache.ts`

| 캐시 키 | TTL | 이유 |
|---------|-----|------|
| `QUOTE` | 3초 | 5초 폴링보다 짧아서 매 폴링마다 새 데이터 보장 |
| `MACRO` | 1시간 | VIX, DXY 등 매크로 지표는 급변하지 않음 |
| `RS_RANK` | 24시간 | "어제의 순위"를 하루 동안 보존하여 순위 변동 계산에 사용 |

안전장치:
- **MAX_SIZE = 1,000**: 캐시 고갈 공격(DoS) 방지
- **5분 주기 자동 정리**: `setInterval`로 만료된 항목 자동 삭제 → 메모리 누수 방지

---

## 4. 데이터 소스 매핑

| 위젯 | 데이터 소스 | 갱신 주기 | 전송 방식 |
|------|------------|-----------|-----------|
| Ticker Strip (주식) | Yahoo Finance → Finnhub WS | 5초 / 실시간 | REST + WebSocket |
| Ticker Strip (코인) | Yahoo Finance → **Binance WS** | 5초 / 실시간 | REST + WebSocket |
| Sector Strength Bar | Yahoo Finance (11 ETF) | 5초 | REST 폴링 |
| RS Leaderboard | 내부 계산 (indicators.ts) | 5초 | REST 폴링 |
| Market Pulse | 내부 계산 (market-pulse.ts) | 5초 | REST 폴링 |
| Macro Focus | Yahoo Finance (VIX, DXY, 10Y) | 5초 | REST 폴링 |
| Crypto Live | **Binance WebSocket** | ~1초 | WebSocket 직결 |
| Price Chart | TradingView Widget (CFD) | 실시간 | TradingView 내장 |
| Watchlist | Yahoo Finance (배치) | 5초 | REST 폴링 |

---

## 5. 컴포넌트 구조

```
src/components/
├── DashboardClient.tsx     ← 그리드 레이아웃 관리자 (react-grid-layout)
├── TickerStripClient.tsx   ← 데이터 병합 (Yahoo + Finnhub + Binance → TickerStrip)
├── TickerStrip.tsx         ← 상단 전광판 UI + Web Animation 불빛
├── MarketPulse.tsx         ← 0-100 게이지 (시장 심리)
├── SectorBar.tsx           ← 11개 섹터 수평 바 차트
├── RSLeaderboard.tsx       ← RS 랭킹 + ETF 가격 + 클릭→차트 연동
├── PriceChart.tsx          ← TradingView 차트 위젯
├── MacroRow.tsx            ← 매크로 지표 개별 행
├── CryptoLive.tsx          ← 바이낸스 실시간 코인 카드
├── MarketBreadth.tsx       ← 시장 참여도 분석
├── Watchlist.tsx           ← 사용자 워치리스트 (localStorage + 배치 API)
└── ThemeToggle.tsx         ← 다크/라이트 테마 전환
```

---

## 6. 폴링 전략

```
장중 (미국 ET 9:30-16:00):
  └── 5초마다 /api/market-data 호출
       └── 33개 티커 일괄 fetch → 캐시 TTL 3초

장외:
  └── 60초마다 호출 (서버 부하 절감)

크립토 (24시간):
  └── Binance WebSocket 상시 연결
       └── 가격 변동 시 즉시 UI 반영 (~1초)
```

---

## 7. 보안 & 안정성

| 항목 | 구현 |
|------|------|
| API 키 보호 | `.env` 서버사이드 전용. 클라이언트에 절대 노출 안 됨 |
| CORS 우회 | Astro SSR API Route가 프록시 역할 |
| API 밴 방지 | 캐시 TTL + 5초 폴링 제한 |
| 부분 실패 대응 | `Promise.allSettled` — 1개 청크 실패해도 나머지 정상 표시 |
| 캐시 폭주 방지 | MAX_SIZE=1000 + 5분 주기 자동 정리 |
| WS 재연결 | 지수 백오프 (5s→10s→20s→60s max, 최대 10회) |

---

## 8. 다음 단계 로드맵

| 우선순위 | 기능 | 상태 |
|----------|------|------|
| 🔴 P0 | QQQ 벤치마크 토글 (RS 리더보드) | 미구현 |
| 🔴 P0 | AI News Catalyst (실시간 뉴스 연동) | 미구현 |
| 🟡 P1 | Indices 탭 (QQQ vs SPY 상대 차트) | 미구현 |
| 🟡 P1 | Macro 탭 (순유동성, 금리곡선) | 미구현 |
| 🟡 P1 | Flows 탭 (ETF 자금 흐름, 김프) | 미구현 |
| 🟢 P2 | 멀티 타임프레임 RS (1D/1W/1M) | 미구현 |
| 🟢 P2 | VIX 텀스트럭처 곡선 | 미구현 |
