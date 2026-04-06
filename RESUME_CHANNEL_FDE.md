# 전정배 (Jeongbae Jun)

    연락처: 010-9339-8785
    이메일: lowshot31@gmail.com
    GitHub: https://github.com/lowshot31

> **"고객의 비즈니스 문제를 기술로 해결하는 Forward Deployed Engineer"**
>
> 유기농 유제품 업체의 수동 CS 프로세스를 Salesforce SaaS 기반 셀프서비스 포털로 전환하고, 가상자산 고객 문의를 n8n + LLM 파이프라인으로 완전 자동화한 경험이 있습니다. 1년 5개월간의 실무에서 고객사(HD현대 그룹) 현장의 기술적 문제를 진단하고 자동화 솔루션으로 해결해왔으며, Salesforce·n8n·Astro 등 낯선 도구를 단기간에 습득하여 프로덕트로 만들어내는 데 자신 있습니다. 채널톡의 AI Agent(ALF)를 고객사에 도입하고 최적화하는 FDE 역할에 이 역량을 직접 기여하고 싶습니다.

---

| Category          | Skills                                                                                                         |
| :---------------- | :------------------------------------------------------------------------------------------------------------- |
| **Languages**     | **Python** (FastAPI, asyncio), **JavaScript/TypeScript** (Astro, React 19, Vanilla JS), Java (Spring Boot 3.4) |
| **AI & LLM**      | **LLM/GPT 서비스 개발** (Ollama 멀티모델 오케스트레이션), **프롬프트 엔지니어링**, n8n 파이프라인              |
| **SaaS & CRM**    | **Salesforce SaaS 도입** (Apex/LWC/Experience Cloud), REST API 통합 아키텍처, Web-to-Lead/Case                 |
| **Data & API**    | Etherscan V2, Yahoo Finance, FRED, Polygon.io, WebSocket, Slack Webhook                                        |
| **Cloud & Infra** | GCP (Cloud Run, Scheduler), Datadog, Docker, Terraform                                                         |

---

## 💼 경력

### 1. ㈜아이비엔티 (IBNT)

**솔루션 개발팀 / 사원** | 2021.11 – 2023.04 (1년 5개월)

- **고객사(HD현대 그룹) 대상 라이선스 모니터링 솔루션 개발 및 기술 지원 (Python, PyQt)**
  - **[상황]** HD현대 그룹 내 300여 개 Siemens NX 라이선스를 담당자 요청 시점에만 수동 파악 → 실시간 정보 취합 불가, 라이선스 비용 누수 발생
  - **[실행]** Python 기반 모니터링 툴을 자체 개발하여 서버 로그를 5분 주기로 자동 집계 + PyQt 실시간 관리자 대시보드 및 Excel 리포팅 구현. **고객사 담당자와 지속적으로 요구사항을 조율하며 기능을 반복 개선**
  - **[성과]** 단발성 수동 파악의 비효율을 근본 해결 → 운영 리소스 대폭 단축 + **고객사 만족도 향상**
  - **💡 FDE 적합성**: 고객 현장의 기술적 문제를 직접 진단하고, 비개발 담당자와 커뮤니케이션하며 솔루션을 도입한 경험

### 2. 국립고궁박물관 (단기 외주)

**전시 콘텐츠 개발** | 2024.07 – 2024.09 (3개월)

- 네트워크 제한 오프라인 전시 환경의 기술적 제약을 분석하고, 프레임워크 종속성 없는 **Vanilla JS 경량 웹 앱**으로 로봇(클로봇) 제어 시스템 구현

---

## 🚀 프로젝트

### 1. Pre Dairy B2B 셀프서비스 포털 (Salesforce SaaS 도입)

**비즈니스 요구사항 분석 → SaaS 기반 포털 구축 및 API 통합** | 2025.09 – 2026.01 (5인)

> 유기농 유제품 업체의 디지털 전환 — **수동 CS 프로세스를 Salesforce SaaS 기반 셀프서비스로 전환**한 엔드투엔드 솔루션

- **역할**: 비즈니스 요구사항 분석, Salesforce 데이터 모델링, 외부 API 연동, 핵심 기능 구현
- **비즈니스 문제 정의 → 기술 솔루션 설계**: 팀원들과의 논의를 통해 비즈니스 기획 의도를 파악하고, Object ERD를 설계·문서화하여 팀 간 협업 기반 마련
- **SaaS(Salesforce) 도입 및 고객 셀프서비스 전환**: LWC 15+ 컴포넌트로 포털 대시보드 구축 → 운영팀의 유선/수기 CS 응대를 **고객이 직접 주문·문의를 조회하는 셀프서비스 구조로 전환**
- **외부 시스템 연동**: FastAPI → Web-to-Lead/Case REST 연동 + 카카오 주소 API로 배송지 매핑 자동화
- **자동 배정 알고리즘**: Geolocation DISTANCE() + Round-Robin으로 리드 배분 병목 해소
- **기술**: Salesforce (Apex 30+클래스, LWC 15+컴포넌트, Experience Cloud, SOQL), Python (FastAPI), REST API

### 2. Crypto CS AI — AI Agent 기반 CS 자동화 엔진

**n8n + LLM 워크플로우 자동화** | 2026.03 (1인)

> 가상자산 고객 문의에서 발생하는 수동 데이터 추출 과정을 AI Agent로 **완전 자동화**

- **고객 문의 → 자동 처리 파이프라인**: 자연어 입력 → LLM 구조화 추출 → Etherscan V2 API 동적 호출 → Slack 자동 리포팅까지 단일 워크플로우
- **환각 방어 및 동적 라우팅**: Regex 검증 + EVM/비EVM 체인 자동 판별로 API 조회 vs 수동 확인 분기 → 오류 원천 차단
- **로컬 LLM 이중 모델 오케스트레이션**: 자연어 파악용(qwen3) + 구조추출 전용(qwen2.5-coder) 태스크별 스와핑
- **기술**: n8n, Ollama, Etherscan V2 API, Slack Webhook, Docker Compose

### 3. Gidne — 실시간 투자 내비게이션 대시보드
**다중 데이터 스트리밍 통합 및 프론트엔드 최적화** | 2026.01 – 현재 (1인)

> 복잡한 실시간 금융 데이터(주식+크립토+매크로)를 동기화 충돌 없이 단일 대시보드로 통합해낸 **기술적 문제 해결** 사례

- **Astro + React Islands 아키텍처 설계**: 정적 셸(SSG) 제공과 백엔드 데이터 프록시(SSR), 동적 UI(React)를 분리하여 초기 로딩 성능 최적화
- **실시간 데이터 동기화 최적화**: REST 브라우저 캐싱 제어(Timestamp Busting)와 이기종 웹소켓(Binance) 병렬 스트리밍을 구현하여 갱신 주기 불일치 최소화
- **RS(상대강도) 지표 고도화**: ETF가 아닌 S&P 500 원본 지수(^GSPC) 대비 11개 섹터의 실시간 상대강도 연산 로직 재작성
- **기술**: TypeScript, Astro 5, React 19, TradingView CFD, Binance WS, REST API, Docker

### 4. Global_in — 이커머스 상품 데이터 통합 파이프라인

**이기종 시스템 간 데이터 수집·정제·적재(ETL)** | 2024.11 – 2025.02 (2인)

- **크롤링 엔진**: Selenium + Pandas로 이마트/GS25/CU 3개 벤더 웹 채널 동시 상품 수집 → Excel 중간 정제
- **RDBMS 정규화 적재**: 비정형 웹 데이터를 Oracle DB 계층형 카테고리 스키마에 맞추어 파싱·자동 적재
- **로컬 플랫폼**: Spring Boot 3.4 + Java 17 기반 백엔드 데이터 호출 구조 구성
- **기술**: Python (Selenium, Pandas), Oracle DB, Spring Boot 3.4, Java 17, AWS (S3, SQS), Redis

### 5. 기타 트러블슈팅 및 기반 기술 경험

- **GCP & Datadog 클라우드 모니터링** (2025.10): Cloud Run Jobs + Scheduler로 온디맨드 모의 로그 생성 → Datadog 커스텀 메트릭 전송
- **로컬 LLM 하드웨어 제약 대응** (2026.02): WSL2 내 Qwen3-TTS 한국어 토크나이저 에러 → 오디오 파이프라인 로그 분석으로 근본 원인 해결. 6GB VRAM 제약 → 동적 모델 스와핑 + FastAPI 비동기 청크 스트리밍 서버 개발

---

## 💡 자기소개

### 🚀 "고객 현장의 기술적 장벽을 낮추는 엔지니어"

IBNT에서 HD현대 그룹 내 300여 개 라이선스의 수동 모니터링 병목을 자동화 솔루션으로 해결하며 고객사 담당자와 지속적으로 커뮤니케이션한 경험, Pre Dairy 프로젝트에서 비개발 직군이 직접 활용할 수 있는 Salesforce 포털을 기획·구축한 경험은 FDE가 현장에서 해야 하는 일 — "고객의 비즈니스 문제를 기술로 정의하고 실행 가능한 솔루션으로 만드는 것" — 과 직결됩니다.

### 🧠 "새 도구를 빠르게 습득하여 프로덕트로 만드는 유연함"

Salesforce(Apex/LWC), n8n, Astro, Ollama, TradingView Charts — 모두 처음 접하는 도구였지만 공식 문서와 AI 에이전트를 활용하여 단기간에 습득하고 실제 동작하는 프로덕트를 완성했습니다. 채널톡의 AI Agent(ALF)를 고객사별 비즈니스 요구에 맞게 커스텀하고, 도입 과정의 기술적 난제를 빠르게 해결해내겠습니다.

---

## 📚 교육 & 자격

- **교육**: AI CRM Developer Training Program (Salesforce 생태계) | 2025.09 – 2026.01 수료
- **교육**: Global IT Talent Development Center (Java Full-Stack) | 2021.02 – 2021.08 수료
- **학위**: 전남도립대학교 미래자동차과 (전문학사) | 2021.02 졸업
- **자격**: 자동차 정비 기능사 (한국산업인력공단, 2017)
