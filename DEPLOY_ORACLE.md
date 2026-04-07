# Gidne → Oracle Free Tier 배포 설계 문서

> 상세 문서 참조: artifacts/DEPLOY_ORACLE.md

이 문서는 Gidne를 Oracle Free Tier ARM VM에 배포하고 Cloudflare DNS 프록시로 서빙하는 마이그레이션 계획입니다.

## 아키텍처

```
유저 → Cloudflare (DNS 프록시, SSL, CDN) → Oracle VM
                                            ├── Nginx (리버스 프록시, :80)
                                            ├── Astro Node SSR (:4321)
                                            ├── Data Pump (24/7 워커)
                                            └── Redis (로컬, 무제한)
```

## 핵심 변경

1. `@astrojs/cloudflare` → `@astrojs/node` (어댑터 교체)
2. `@upstash/redis` → `ioredis` (로컬 Redis TCP 연결)
3. Docker Compose (Redis + Astro + Data Pump)
4. Cloudflare = DNS 프록시만 (SSL + CDN + DDoS)

## 비용: $0/월 (영구 무료)
