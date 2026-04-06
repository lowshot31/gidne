# 전정배 (Jeongbae Jun)

    연락처: 010-9339-8785
    이메일: lowshot31@gmail.com
    GitHub: https://github.com/lowshot31

> **"n8n + LLM 기반 워크플로우 자동화로 사내 AX를 구현하는 개발자"**
>
> n8n 플랫폼 위에서 LLM 다중 라우팅 파이프라인을 설계하고, 수동 CS 데이터 추출 프로세스를 완전 자동화한 경험이 있습니다. Python과 TypeScript를 중심으로 API 통합 아키텍처를 구축하며, 블록체인·핀테크 도메인에서 온체인 데이터 조회부터 실시간 금융 대시보드까지 다양한 데이터 파이프라인을 다뤄왔습니다. 코인원 AX 팀에서 AI 에이전트 설계와 사내 구성원의 기술 장벽을 낮추는 도구 개발에 이 역량을 직접 기여하고 싶습니다.

---

| Category               | Skills                                                                                                                     |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **AI & Workflow**      | **n8n (전주기 파이프라인 설계/운영)**, **LLM API (Ollama, OpenAI 호환)**, **프롬프트 엔지니어링**, AI Agent 오케스트레이션 |
| **Languages**          | **Python** (FastAPI, asyncio), **JavaScript/TypeScript** (Astro, React 19), Apex                                           |
| **Low-Code & SaaS**    | **n8n**, Salesforce (Apex/LWC/Experience Cloud), Docker Compose                                                            |
| **Blockchain/Fintech** | Etherscan V2 API, Upbit API, Polygon.io, FRED API, CryptoQuant, WebSocket 실시간 스트리밍                                  |
| **Cloud & Infra**      | GCP (Cloud Run, Scheduler), Datadog, Docker, Terraform                                                                     |

---

## 💼 경력

### 1. ㈜아이비엔티 (IBNT)

**솔루션 개발팀 / 사원** | 2021.11 – 2023.04 (1년 5개월)

- **기업용 라이선스 모니터링 자동화 파이프라인 개발 (Python, PyQt)**
  - **[상황]** HD현대 그룹 내 300여 개 Siemens NX 라이선스를 담당자 요청 시점에만 수동 파악 → 실시간 정보 취합 불가, 비용 누수 발생
  - **[실행]** Python 기반 모니터링 툴을 자체 개발하여 서버 로그를 5분 주기로 자동 집계 + PyQt 실시간 관리자 대시보드 및 Excel 리포팅 기능 구현
  - **[성과]** 단발성 수동 파악의 비효율을 근본 해결, 라이선스 배치 최적화 기반 수립 → **IT 자산 관리 및 운영 리소스 대폭 단축**

### 2. 국립고궁박물관 (단기 외주)

**전시 콘텐츠 개발** | 2024.07 – 2024.09 (3개월)

- 네트워크 제한 오프라인 전시 환경에서 로봇(클로봇) 제어용 **Vanilla JS 경량 웹 앱** 구현

---

## 🚀 프로젝트

### 1. Crypto CS AI — 전주기 API 통합 워크플로우 자동화 엔진

**n8n 기반 LLM 다중 라우팅 및 온체인 API 통합** | 2026.03 (1인)

> 가상자산 고객 문의(CS)에서 발생하는 수동 데이터 추출·대조 과정을 **n8n** + 로컬 LLM + 외부 온체인 API로 **완전 자동화**한 구조화 추출 AI 챗봇

- **[상황]** 고객이 자연어로 전달하는 트랜잭션 해시(txid), 체인 종류 등을 CS 담당자가 수동으로 복사·붙여넣기하여 블록 익스플로러에서 조회 → 대응 지연 및 휴먼 에러 발생
- **n8n 전주기 파이프라인 설계**: 자연어 입력 → LLM 구조화 추출 → Regex 검증 → **Etherscan V2 API 동적 호출(REST)** → Slack 웹훅 자동 리포팅까지 단일 워크플로우로 구축
- **환각(Hallucination) 방어 설계**: 정규표현식 검증 레이어 + JSON Validation으로 LLM 오류 데이터 원천 차단. EVM/비EVM 체인 자동 판별 → API 조회 vs 수동 확인 트랙 동적 라우팅
- **Task-Specific 로컬 LLM 오케스트레이션**: Ollama 위에서 자연어 뉘앙스 파악 모델(qwen3)과 JSON 구조추출 전용 모델(qwen2.5-coder) 두 개를 태스크별 스와핑 → 단일 모델 대비 응답 안정성 확보
- **기술**: n8n, Ollama (qwen3, qwen2.5-coder), Etherscan V2 API, Slack Webhook, Docker Compose, Regex

### 2. Gstack-Antigravity — AI Agent 워크플로우 시스템 포팅

**에이전트 시스템 프롬프트 역설계 및 맞춤 워크플로우 이식** | 2026.03 (1인)

> Garry Tan의 'gstack' 에이전트 워크플로우를 분석하여 Google Antigravity 엔진 문법으로 변환, 맞춤형 워크플로우 룰셋을 설계·이식

- **AI Agent 구조 역설계**: 복잡한 시스템 프롬프팅 구조를 해체하고, 명령어 기반 체인을 새 플랫폼에 안정적으로 빌드업
- **자율 행동 에이전트 워크플로우 수립**: 브레인스토밍(/office-hours)부터 디버깅(/investigate), 코드 리뷰(/review), 보안 감사(/security-audit)까지 자동화 체계 구축
- **기술**: Prompt Engineering, Agent Orchestration, Bash Script, YAML

### 3. Pre Dairy B2B 셀프서비스 포털 (Salesforce 기반)

**Salesforce Experience Cloud 통합 및 외부 웹 서비스 연동** | 2025.09 – 2026.01 (5인)

> 유기농 유제품 업체의 디지털 전환을 위한 Salesforce CRM 기반 B2B 포털 — **비개발 직군도 활용 가능한 고객 셀프서비스 도구**

- **역할**: Salesforce 데이터 모델링, 외부 API 연동, 핵심 기능(Apex, LWC) 구현
- **SaaS(Salesforce) 연동 도구 개발**: LWC 기반 포털 대시보드를 구축하여 운영팀이 유선/수기로 응대하던 단순 조회 업무를 고객 셀프서비스로 전환 → **비개발 직군의 기술 장벽 해소**
- **외부 API 통합 파이프라인**: FastAPI 서버 → Web-to-Lead/Case REST 연동 + 카카오 주소 API로 고객 위치 데이터 자동 유입
- **거리 기반 리드 자동 배정**: Geolocation DISTANCE() SOQL + Round-Robin 결합 → 수동 배분 병목 해소
- **기술**: Salesforce (Apex 30+클래스, LWC 15+컴포넌트, Experience Cloud, SOQL), Python (FastAPI), REST API

### 4. Gidne — 투자 내비게이션 대시보드

**실시간 금융 데이터 통합 플랫폼** | 2026.01 – 현재 (1인, 개발 진행중)

> 파편화된 금융 데이터(매크로+주식+크립토)를 하나의 Bento Grid 대시보드로 통합하는 실시간 투자 분석 도구

- **Astro + React Islands 하이브리드 아키텍처 설계**: SSG 정적 셸 + SSR API Routes(데이터 프록시/캐싱) + React 동적 컴포넌트 분리로 최적 성능 구현
- **다중 스트리밍 통합 및 프론트엔드 캐싱 제어**: Yahoo Finance(REST 폴링)와 Binance WebSocket을 분리/융합. 브라우저 캐싱과 API 데이터 Freeze 충돌 문제를 타임스탬프 캐시 버스팅 및 데이터 파이프라인 이원화로 근본 해결하여 100% 실시간(Millisecond 지연) 동기화 달성
- **RS(상대강도) 분석 엔진**: 실제 S&P500 지수(^GSPC) 대비 11개 스파이더 섹터 ETF의 상대 강도를 실시간 연산, 어제 대비 순위 변동(▲▼)으로 섹터 로테이션 신호 감지
- **기술**: TypeScript, Astro 5, React 19, TradingView CFD, Binance WebSocket, REST API, Docker

### 5. coinbot — 업비트 암호화폐 급등 알림 봇

**실시간 시세 모니터링 + 텔레그램 자동 알림** | 2025.08 (1인)

- 업비트 API Rate Limit 준수하며 비동기(asyncio) 처리로 KRW 전 마켓 실시간 모니터링
- 급등 감지 알고리즘 + 텔레그램 봇 연동으로 알림 지연 1초 이내 달성
- **기술**: Python, asyncio, Upbit API, python-telegram-bot

---

## 💡 자기소개

### 🤖 "워크플로우 자동화로 사내 AX를 가속하는 개발자"

n8n 위에서 LLM 다중 라우팅 파이프라인을 설계하고, 수작업 데이터 추출 CS 프로세스를 완전 자동화한 경험은 코인원 AX 팀이 추구하는 'AI Agent 개발'과 '워크플로우 자동화'에 직결됩니다. 단순 생성형 챗봇이 아닌, Regex 검증 레이어와 동적 라우팅으로 환각을 차단하는 견고한 시스템을 설계했습니다. AI 에이전트의 시스템 프롬프팅 구조를 역설계하고 새 플랫폼에 이식한 경험까지 보유하고 있어, AX 팀에서 사내 구성원의 기술 장벽을 낮추는 도구를 빠르게 만들어낼 수 있습니다.

### ⛓️ "블록체인·핀테크 도메인을 깊이 이해하는 엔지니어"

Etherscan V2 온체인 API 통합, 업비트 API 비동기 실시간 모니터링, 6개 금융 데이터 소스를 통합하는 투자 대시보드까지 — 가상자산과 핀테크 데이터를 다루는 일이 저의 일상입니다. 코인원의 도메인 맥락을 빠르게 흡수하고, 보안(데이터 마스킹)과 운영 효율을 동시에 고려하는 AX 도구를 만들겠습니다.

---

## 📚 교육 & 자격

- **교육**: AI CRM Developer Training Program (Salesforce 생태계) | 2025.09 – 2026.01 수료
- **교육**: Global IT Talent Development Center (Java Full-Stack) | 2021.02 – 2021.08 수료
- **학위**: 전남도립대학교 미래자동차과 (전문학사) | 2021.02 졸업
- **자격**: 자동차 정비 기능사 (한국산업인력공단, 2017)
