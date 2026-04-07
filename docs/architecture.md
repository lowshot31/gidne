# 🧭 Gidne v2 — 기술 아키텍처 & 알고리즘 워크스루

> **마지막 업데이트:** 2026-04-08
> **현재 상태:** Equities 대시보드 안정화 완료, EOD Alpha Briefing 구현, 뉴스 파이프라인 정비 완료

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
| **캐싱 레이어** | Redis (Upstash 호환) | — | 백그라운드 데이터 펌프(`data-pump.ts`)가 수집한 데이터를 TTL 기반으로 저장. API 밴 방지의 핵심 |
| **언어** | TypeScript | 5.7 (strict) | 전체 코드베이스 타입 안전성 보장 |
| **테스트** | Vitest | 4.1 | Vite 네이티브 테스트 러너. 빌드 도구와 동일한 엔진 사용으로 설정 제로 |
| **스타일링** | Vanilla CSS (CSS Variables) | — | 다크/라이트 듀얼 테마 디자인 시스템. CSS 변수로 테마 전환 지원 |
| **폰트** | Space Grotesk + Inter + JetBrains Mono | — | 헤딩/본문/수치 각각 최적화된 서체 분리 |
| **컨테이너** | Docker | — | `Dockerfile` 포함, Cloudflare 배포 준비 완료 |

---

## 2. 아키텍처 패턴: Islands + Redis Data Pump

```
┌─────────────────────────────────────────────────────────┐
│                    브라우저 (Client)                      │
│                                                         │
│  ┌─── Astro 정적 셸 (0 JS) ───┐                        │
│  │  Dashboard.astro 레이아웃    │                        │
│  │  (Header, Nav, ThemeToggle) │                        │
│  └─────────────────────────────┘                        │
│                                                         │
│  ┌─── React Islands (동적, JS 포함) ─────────────┐      │
│  │                                                │      │
│  │  TickerStrip ──┐                               │      │
│  │  MarketPulse ──┤                               │      │
│  │  SectorBar ────┤  5초 폴링 → /api/market-data  │      │
│  │  RSLeaderboard ┤        (Redis 캐시 반환)       │      │
│  │  EODBriefing ──┤                               │      │
│  │  PriceChart ───┘                               │      │
│  │                                                │      │
│  │  Watchlist ─────→ /api/quotes (배치, 5초 폴링)  │      │
│  │  WatchlistNews ─→ /api/news (1분 폴링)         │      │
│  │  CryptoLive ────→ Binance WebSocket (직결)     │      │
│  │  MacroFocusWidget → 프리셋 + 커스텀 지표       │      │
│  │  EconomicCalendar → /api/calendar              │      │
│  └────────────────────────────────────────────────┘      │
│                                                         │
│  ┌─── LocalStorage (클라이언트 전용) ──────────┐         │
│  │  gidne-watchlist: 관심종목 배열 (드래그 순서) │         │
│  │  gidne_layout: 그리드 위젯 배치 좌표          │         │
│  │  gidne_macro_custom: 사용자 커스텀 매크로 지표│         │
│  │  gidne_recent_searches: 최근 검색 기록        │         │
│  └───────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    서버 (Astro SSR)                       │
│                                                         │
│  /api/market-data → Redis 캐시에서 직접 조회             │
│  /api/quotes      → Redis or yahoo-finance2 fallback    │
│  /api/returns     → Redis 캐시 (4시간 TTL) / 온디맨드   │
│  /api/news        → Yahoo 뉴스 + Google 번역 우회       │
│  /api/search      → yahoo-finance2 자동완성             │
│  /api/chart       → 개별 종목 차트 데이터                │
│  /api/calendar    → 경제 일정 데이터                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              백그라운드 워커 (data-pump.ts)                │
│                                                         │
│  30초마다 반복 실행:                                      │
│  1. 섹터 ETF 11종 + 매크로 지표 시세 수집                 │
│  2. 인덱스(^GSPC, ^IXIC, ^DJI) 데이터 수집               │
│  3. 섹터별 Top5 홀딩스 시세 수집                          │
│  4. Market Pulse 점수 계산                               │
│  5. MarketBreadth 데이터 가공                            │
│  6. Redis에 TTL 60초로 저장 (gidne:market-data:v2)       │
│                                                         │
│  장중: 30초 간격 / 장외: 5분 간격                         │
│  ↕ 쓰로틀링: 종목당 200ms 딜레이로 429 밴 방지            │
└─────────────────────────────────────────────────────────┘
```

### 왜 이 구조인가?

1. **Astro Islands**: 페이지의 80%는 정적 HTML(네비게이션, 레이아웃). 실시간 데이터가 필요한 20%만 React로 렌더링 → 초기 로딩 속도 극적으로 향상
2. **Redis Data Pump 분리**: 클라이언트(브라우저)가 야후 파이낸스를 직접 때리지 않음. 백그라운드 워커가 독립적으로 데이터를 긁어서 Redis에 저장 → **429 Rate Limit 원천 차단**
3. **Graceful Degradation**: Redis에 데이터가 아직 없으면(서버 재시작 직후 등) 대시보드가 크래시하지 않고 "시황 데이터 집계 중" 벤토 스타일 대기 화면을 표시

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

### 3.3 EOD Alpha Briefing — 매크로↔섹터 상관관계 분석

> 📍 `src/components/EODBriefing.tsx` + `src/lib/tickers.ts`

```
1. 전체 11개 GICS 섹터를 RS 기준으로 정렬 (1위~11위)
2. 상위 3개(주도 섹터) / 중위 6개(중립) / 하위 2개(소외 섹터) 시각 구분
3. MACRO_SECTOR_DRIVERS 매핑 테이블로 매크로 드라이버 자동 매칭
   예) 유가 +2.3% → XLE(에너지) 상승 원인 표시: "← 유가 +2.3% 상승"
4. 사용자 Watchlist Top Movers를 최상단에 우선 배치
5. 1D/1W/1M 타임프레임 동적 전환 (/api/returns 호출 + Redis 캐시)
```

**클립보드 복사 기능:**
- 복사 버튼 클릭 시 전체 섹터 순위 + 드라이버 분석을 텍스트로 생성
- 메신저/노트에 바로 공유 가능한 브리핑 템플릿 포맷

### 3.4 청크 병렬 페칭 (Chunked Parallel Fetch)

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

### 3.5 실시간 가격 불빛 (Flash Animation)

> 📍 `src/hooks/useFlash.ts`

```javascript
// Web Animation API — 리액트 State 한계 우회
el.animate([
  { backgroundColor: 'rgba(38, 166, 154, 0.5)' },  // 초록 번쩍
  { backgroundColor: 'transparent' }
], { duration: 800, easing: 'ease-out' });
```

**CSS 클래스 대신 Web Animation API를 쓰는 이유:**
- 바이낸스 웹소켓은 초당 수 회 가격이 바뀜
- React State로 클래스를 토글하면 리액트의 배치 업데이트가 중간 프레임을 삼켜서 불빛이 안 보임
- `Element.animate()`는 리액트를 우회하여 DOM에 직접 애니메이션 주입 → **100% 확실한 불빛 보장**

### 3.6 뉴스 파이프라인 & 스마트 시간 파서

> 📍 `src/pages/api/news.ts` + `src/components/WatchlistNews.tsx`

```
1. Yahoo Finance search API로 워치리스트 상위 3개 티커 기준 뉴스 수집
2. Google Translate 무료 API 우회로 영문 뉴스 제목 → 한국어 자동 번역
3. Redis 캐시 60초 TTL로 중복 요청 방지
4. 각 쿼리 간 500ms 딜레이 (429 에러 방지 쓰로틀링)
```

**스마트 시간 파서 (NaN 버그 해결):**
- API가 밀리초, 초 단위 타임스탬프, ISO 문자열을 혼용해서 반환하는 문제 발견
- `typeof` 체크 + 10자리/13자리 분기 + `isNaN` 가드로 어떤 포맷이든 올바른 "N분 전" 변환 보장

**실시간 스쿼크 처리:**
- FT RSS 파싱 → 갱신 속도 불량으로 폐기
- `saveticker.com` 외부 터미널 직접 아웃바운드 링크로 전환 (뉴스 위젯 내부 버튼)

---

## 4. UI 설계 원칙

### 4.1 Flexbox 유동성 원칙 (모든 위젯 필수 적용)

```css
/* 모든 대시보드 위젯 컴포넌트의 최상위 컨테이너 필수 구조 */
.widget-container {
  display: flex;
  flex-direction: column;
  height: 100%;       /* react-grid-layout이 부여하는 높이에 따름 */
  overflow: hidden;    /* 콘텐츠 넘침 방지 */
}

/* 스크롤 가능 영역 */
.widget-scroll-area {
  flex: 1;             /* 남은 공간 전부 차지 */
  overflow-y: auto;    /* 내부 스크롤 */
}
```

이 패턴이 적용된 컴포넌트: `Watchlist`, `WatchlistNews`, `EODBriefing`, `MacroFocusWidget`, `CryptoLive`, `RSLeaderboard`, `EconomicCalendar`

### 4.2 토스증권 스타일 티커 오버뷰 헤더

> 📍 `src/components/ChartPageClient.tsx`

개별 종목 차트 페이지(`/chart/[ticker]`) 진입 시, 페이지 최상단에 고밀도 정보 바를 표시:
- 현재가 + 변동률 (큰 폰트)
- 1일 범위 & 52주 범위 위치를 시각적 프로그레스 바(Dot 슬라이더)로 표현
- 시가총액, 거래량(평균 대비 배수), 상장 시장 정보 우측 배치

### 4.3 Watchlist 드래그 앤 드롭

> 📍 `src/components/Watchlist.tsx` + `src/lib/watchlist.ts`

- HTML5 Drag & Drop API (`draggable`, `onDragStart`, `onDragEnter`, `onDragEnd`) 사용
- 시각 피드백: 드래그 중인 항목 반투명화 + 드롭 위치에 황금색 상단 보더라인
- 드롭 완료 시 `reorderWatchlist()`로 LocalStorage 즉시 동기화
- 최대 30개 티커 제한 (야후 API Rate Limit 방어)

---

## 5. 데이터 소스 매핑

| 위젯 | 데이터 소스 | 갱신 주기 | 전송 방식 |
|------|------------|-----------|-----------| 
| Ticker Strip (주식) | Redis (data-pump) → Finnhub WS | 30초 / 실시간 | Redis + WebSocket |
| Ticker Strip (코인) | Redis (data-pump) → Binance WS | 30초 / 실시간 | Redis + WebSocket |
| Sector Strength Bar | Redis (data-pump) | 30초 | Redis 조회 |
| RS Leaderboard | 내부 계산 (indicators.ts) | 30초 | Redis 조회 |
| Market Pulse | 내부 계산 (market-pulse.ts) | 30초 | Redis 조회 |
| Macro Focus | Redis (data-pump) | 30초 | Redis 조회 |
| EOD Alpha Briefing | Redis + /api/returns (온디맨드) | 30초 + 4시간 TTL | Redis + REST |
| Crypto Live | **Binance WebSocket** | ~1초 | WebSocket 직결 |
| Price Chart | TradingView Widget (CFD) | 실시간 | TradingView 내장 |
| Watchlist | /api/quotes (Yahoo 배치) | 5초 | REST 폴링 |
| News | /api/news (Yahoo + Google 번역) | 1분 | REST 폴링 |
| Economic Calendar | /api/calendar | 1시간 | REST 폴링 |

---

## 6. 컴포넌트 구조

```
src/components/
├── DashboardClient.tsx     ← 그리드 레이아웃 관리자 (react-grid-layout) + Graceful Error 화면
├── TickerStripClient.tsx   ← 데이터 병합 (Yahoo + Finnhub + Binance → TickerStrip)
├── TickerStrip.tsx         ← 상단 전광판 UI + Web Animation 불빛
├── MarketPulse.tsx         ← 0-100 게이지 (시장 심리)
├── SectorBar.tsx           ← 11개 섹터 수평 바 차트
├── RSLeaderboard.tsx       ← RS 랭킹 + ETF 가격 + 클릭→차트 연동
├── PriceChart.tsx          ← TradingView 차트 위젯
├── MacroFocusWidget.tsx    ← 매크로 지표 (HOT/금리/원자재/커스텀 탭)
├── MacroRow.tsx            ← 매크로 지표 개별 행
├── CryptoLive.tsx          ← 바이낸스 실시간 코인 카드
├── MarketBreadth.tsx       ← 시장 참여도 분석
├── Watchlist.tsx           ← 사용자 워치리스트 (드래그&드롭 + 자동완성 + 배치 API)
├── WatchlistNews.tsx       ← 야후 뉴스 + 세이브티커 스쿼크 링크
├── EODBriefing.tsx         ← Alpha 브리핑 (전체 섹터 랭킹 + 매크로 드라이버 + 복사)
├── EconomicCalendar.tsx    ← 경제 일정 캘린더
├── ChartPageClient.tsx     ← 개별 종목 차트 (토스 스타일 헤더 포함)
├── TickerSearch.tsx        ← 글로벌 티커 검색 (자동완성)
├── ThemeToggle.tsx         ← 다크/라이트 테마 전환
└── SkeletonCard.tsx        ← 로딩 스켈레톤 UI
```

---

## 7. 캐시 전략 (Redis TTL 체계)

| 캐시 키 패턴 | TTL | 용도 |
|-------------|-----|------|
| `gidne:market-data:v2` | 60초 | 전체 대시보드 데이터 (섹터, 매크로, 인덱스, 홀딩스, 펄스) |
| `gidne:news:<query>:<count>` | 60초 | 뉴스 검색 결과 |
| `gidne_ret_v2_<ticker>` | 4시간 | 1W/1M 과거 수익률 계산 결과 |
| `gidne:quote:<tickers_hash>` | 5초 | 개별 시세 조회 결과 |

**안전장치:**
- 캐시 TTL 만료 시 자동 갱신 (data-pump 30초 주기)
- Redis 연결 실패 시 → 프론트엔드에서 "시황 집계 중" 폴백 화면 (크래시 방지)
- 야후 API 쓰로틀링: 종목당 200~500ms 인위적 딜레이

---

## 8. 보안 & 안정성

| 항목 | 구현 |
|------|------|
| API 키 보호 | `.env` 서버사이드 전용. 클라이언트에 절대 노출 안 됨 |
| CORS 우회 | Astro SSR API Route가 프록시 역할 |
| API 밴 방지 | Redis 캐시 + data-pump 백그라운드 분리 + 쓰로틀링 |
| 부분 실패 대응 | `Promise.allSettled` — 1개 청크 실패해도 나머지 정상 표시 |
| 입력 검증 | `/api/news` : 쿼리 정규식 필터 + 100자 제한 |
| Watchlist 제한 | 최대 30개 → 대량 API 호출 원천 차단 |
| WS 재연결 | 지수 백오프 (5s→10s→20s→60s max, 최대 10회) |
| LocalStorage 무결성 | 파싱 실패 시 자동 리셋 (try/catch + Array.isArray 가드) |

---

## 9. 다음 단계 로드맵

| 우선순위 | 기능 | 상태 |
|----------|------|------|
| ✅ 완료 | 멀티 타임프레임 RS (1D/1W/1M) | ✅ 구현 완료 |
| ✅ 완료 | Redis Data Pump 아키텍처 전환 | ✅ 구현 완료 |
| ✅ 완료 | EOD Alpha Briefing (섹터 전체 랭킹 + 복사) | ✅ 구현 완료 |
| ✅ 완료 | 뉴스 파이프라인 (번역 + 스쿼크 외부 링크) | ✅ 구현 완료 |
| ✅ 완료 | Watchlist 드래그 앤 드롭 순서 변경 | ✅ 구현 완료 |
| ✅ 완료 | 토스증권 스타일 개별 종목 헤더 | ✅ 구현 완료 |
| ✅ 완료 | Graceful Error (Redis 미연결 시 폴백 UI) | ✅ 구현 완료 |
| 🔴 P0 | Flows 탭 (도미넌스, TOTAL3, ETF Inflow) | 미구현 |
| 🟡 P1 | 알림 시스템 (가격 도달, RSI 과열 알림) | 미구현 |
| 🟢 P2 | Cloudflare 프로덕션 배포 + Upstash Redis 전환 | 미구현 |
| 🟢 P2 | VIX 텀스트럭처 곡선 | 미구현 |

> **참고:** 차트 인터랙션(줌, 패닝, 기간 전환)은 TradingView 위젯이 네이티브로 완벽 지원하므로 별도 구현 불필요.
