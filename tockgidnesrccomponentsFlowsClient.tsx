[33md7fdd1a[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m feat: implement core market dashboard components and global styles
[33m2280f6c[m[33m ([m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m fix: make segmented control texts fully visible by enabling flex-wrap
[33m4badc7c[m fix: layout overlap and enable nodejs_compat
[33ma1ec119[m feat: implement modular dashboard components and watchlist management system
[33m6818f84[m refactor(ui): unify tab UI with SegmentedControl component - SegmentedControl 공용 컴포넌트 추출 (sm/md/lg 사이즈 지원) - MacroFocusWidget, MacroClient, IndicesClient, WatchlistNews, FlowsClient 탭 통일 - IndicesClient HTML 테이블 → Flexbox 리스트 마이그레이션 - 죽은 CSS 제거 (.region-tabs, .news-tabs, .indices-table) - S&P 500/NASDAQ 차트 탭: SPY/QQQ → ^GSPC/^IXIC 복원 (무료 CFD 캔들) - Progressive Loading: 독립 위젯 즉시 렌더링 + 데이터 의존 위젯 스켈레톤
[33m6a4d2de[m[33m ([m[1;31morigin/feat/macro-upgrade[m[33m, [m[1;32mfeat/macro-upgrade[m[33m)[m feat(macro): finalize TV caching and visual thermometer UI
[33mdc8734a[m feat: add CustomLightweightChart, EconomicCalendar, and supporting components for financial data visualization
[33m6e41eef[m[33m ([m[1;31morigin/feat/indices-upgrade[m[33m, [m[1;32mfeat/indices-upgrade[m[33m)[m feat(ui): GlobalMarketMap 완전 자동 반응형(Aspect-Ratio) 리팩토링 및 커스텀 카드 DnD 도입
[33ma361f4f[m[33m ([m[1;32mfeat/macro[m[33m, [m[1;32mfeat/dashboard-updates[m[33m)[m feat: EOD briefing 전체 섹터 랭킹, watchlist drag-and-drop, 뉴스 파이프라인 정비, 문서 최신화
[33m5397389[m[33m ([m[1;31morigin/feat/dashboard-updates[m[33m)[m chore: add @types/node dependency and include tailored resume documentation
