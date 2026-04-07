# 김민수 (또는 본인 이름) | Automation & API Integration Engineer

**"파편화된 시스템과 API를 결합하여 기업의 생산성 병목을 해소하는 통합(Integration) 엔지니어입니다."**

단순한 화면 개발을 넘어, **노코드/로우코드 툴(n8n), LLM 오케스트레이션, 외부 REST API**를 활용해 반복적인 백오피스 업무와 데이터를 자동화하는 파이프라인 설계에 강점이 있습니다. 프론트엔드 플랫폼 설계부터 백엔드 데이터베이스 적재, 클라우드 배포까지 엔드투엔드(End-to-End) 구동 원리를 이해하며, **비즈니스 문제를 가장 빠른 기술로 타격하여 해결하는 것**을 목표로 합니다.

---

## 🛠 Tech Stack
- **Languages**: Python, TypeScript, JavaScript, Java, Apex (Salesforce)
- **Integration & Automation**: n8n, Slack Webhooks, Telegram Bot API, Selenium
- **Backend & Cloud**: FastAPI, Spring Boot, Node.js, Oracle DB, GCP (Cloud Run, Scheduler)
- **Frontend**: Astro, React, Node.js, HTML/CSS

---

## 🚀 Projects

### 1. 대규모 CS 인입 자동화를 위한 AI 워크플로우 오케스트레이션 설계 (개인 프로젝트)
*API 통합 전주기 워크플로우 자동화 엔진 (n8n & LLM 멀티라우팅)* | 2026.03

가상자산 플랫폼 등에서 다량으로 발생하는 비정형 자연어 문의 데이터를 정형 데이터로 자동 추출하고, 외부 오픈 API 체인망과 교차 검증하여 사내 메신저로 즉각 리포팅하는 **완전 자동화 파이프라인**입니다.

- **Situation (상황):** 특정 서비스 문의 시 트랜잭션/지갑 주소 등 데이터를 수동으로 복사해 시스템에 확인해야 하는 심각한 운영 병목(Toil) 존재.
- **Task (과제):** 유저의 비정형 텍스트에서 데이터를 추출하고 블록체인 노드 API와 자동 통신하여 결과를 사내망(Slack 등)으로 쏴주는 로우 레이턴시 파이프라인 구축.
- **Action (행동):**
  - **n8n 기반 마이크로서비스 연결:** 텍스트 인입 → LLM 라우팅 → API 호출 → 메신저 발송의 워크플로우 통합 설계.
  - **환각(Hallucination) 방어 동적 라우팅:** 단순 생성 모델의 오류를 막기 위해 정규표현식(Regex) 검증 레이어를 태우고, EVM/Non-EVM 판별 등 동적 분기 로직 적용.
  - **다중 LLM 오케스트레이션:** 응답 안정성을 위해 의도 파악용 모델(qwen3)과 구조화 추출 전담 로컬 모델(qwen2.5-coder) 두 개의 Ollama 모델 환경 결합.
  - **외부 REST API 연동:** 추출된 값을 기반으로 **Etherscan V2 API**를 동적 호출(REST)하여 온체인 상태 실시간 검증.
- **Result (결과):** 운영 담당자의 수동 조회-검색-공유 프로세스를 100% 무인화하는 아키텍처 증명. 외부 API와 LLM의 매끄러운 통합 파이프라인 달성.

### 2. Gidne - 글로벌 금융/매크로 실시간 통합 대시보드 (진행중)
*Websocket & REST API 기반 고성능 데이터 파이프라인* | 2026.01 ~ 현재

거시경제 통계, 주식 시세, 암호화폐 등 5종 이상의 파편화된 다중 벤더 API를 클라이언트 단일 인터페이스로 통합해낸 데이터 서비스입니다.

- **Action & Result:**
  - **다중 API 연동/캐싱:** 외부 시스템(Finnhub, Polygon)의 엄격한 제한(Rate-Limit)을 우회하기 위해 Redis 기반 큐잉(Queue) 딜레이 및 서킷 브레이커 통신 백엔드 스크립트 작성.
  - **실시간 스트리밍:** API Polling 부하를 줄이기 위해 클라이언트-서버 간 Websocket 시스템을 구축해 지연 없는 시각화 달성.
  - 하이브리드 웹 아키텍처(Astro) 방식 도입을 통해 아일랜드 패턴을 구현하고 구글 Lighthouse 측정 FCP 1.6s 의 압도적 성능 등급 확인.

### 3. 클라우드 모니터링 기반 서버리스 자동화 (DevSecOps PoC)
*GCP & Datadog 연동 클라우드 인프라 파이프라인* | 2026.02

- **Action & Result:**
  - Python 기반 모의 로그 제너레이터를 만들고, 상시 구동 인스턴스 대신 **Cloud Run(Jobs) + Cloud Scheduler**를 결합하여 필요할 때만 구동되는 온디맨드(On-Demand) 파이프라인 설계.
  - 웹 시스템 로그를 외부 모니터링 SaaS(Datadog)에 커스텀 메트릭으로 전송/수집하여 클라우드 파이프라인 관측(Observability) 및 통신 로직 습득.

### 4. B2B 인터페이스-DB 데이터 자동 적재 (Pre Dairy)
*Salesforce CRM 연동 및 Python 데이터 파이프라인 구축* | 2025.12 ~ 2026.01

- **Action & Result:**
  - (웹 → 데이터베이스 연동) 외부 파트너사 웹사이트(FastAPI)에서 일어난 B2B 견적 접수 데이터를 내부 데이터베이스(Salesforce)로 즉각 적재하는 **REST 당김 파이프라인(Web-to-Lead)** 구축.
  - 접수된 데이터를 바탕으로 카카오 주소 API(거리 연산)를 자동 호출하여 내부 영업사원/배송지로 티켓(Case)을 라우팅하는 백엔드 프로세스 개발.
