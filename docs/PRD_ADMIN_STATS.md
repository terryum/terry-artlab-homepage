# PRD_Admin_Stats.md

## 0) 요약
- 관리자 탭 `Stats`를 구현한다.
- 데이터 소스는 **Google Analytics(GA4)**로 한다:
  - 사이트 트래킹: GA4 스크립트(또는 GTM) 설치
  - 대시보드 데이터: **Google Analytics Data API**로 서버에서 조회하여 `/admin/stats`에 표시
- 보조 신호로 Supabase 의 `post_comments_public` 카운트를 댓글 인디케이터로 같이 노출.

## 1) 목표
- 기간별(7d/30d/90d/all/custom) 방문자/조회수 확인
- "누가 / 얼마나 / 어떤 경로로 / 무슨 글에 관심" 4 차원을 한 화면에서 답할 수 있어야 함
- 게시물(페이지)별 조회수 + 진짜 read engagement Top 리스트
- 운영자가 "무엇이 먹히는지" 빠르게 판단 가능

## 2) 비목표
- 일반 사용자에게 통계 공개
- 실시간 초정밀 BI(세그먼트/코호트/캠페인 자동화)
- 정량 좋아요/공유 카운트 (sparse signal — 본 사이트에서는 정렬 신호로 부적합)

## 3) 구현 개요
### A. GA4 설치(수집)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` 기반으로 프로덕션에서만 GA 스크립트 주입
- 관리자 페이지(/admin)도 추적할지 여부는 옵션 (기본은 제외 권장)
- 콘텐츠 본문 스크롤 깊이 트래킹: `src/components/ScrollDepthTracker.tsx` (모든 포스트 상세에서 자동 마운트)

### B. Data API 조회(표시)
- `/api/admin/stats` 서버 라우트에서 GA Data API `runReport` 8개 동시 호출 (KPI / trend / sources / countries / devices / posts / postSources / commentsCount)
- `/admin/stats`는 위 API를 호출해 KPI/차트/테이블 렌더링
- Data API 인증은 **서비스 계정** 사용:
  - 서비스 계정 이메일을 GA4 Property에 사용자로 추가
  - 자격증명(JSON)은 Cloudflare Worker secret으로 저장 (`wrangler secret put GA_SERVICE_ACCOUNT_JSON`, 서버에서만 사용)

## 4) 지표 정의

### KPI 카드 (4개)
| 카드 | 메인 값 | 보조 텍스트 | GA4 metric |
|---|---|---|---|
| Visitors | `totalUsers` | `New X% / Returning Y%` (`newUsers/totalUsers`) | `totalUsers` + `newUsers` |
| Pageviews | `screenPageViews` | — | `screenPageViews` |
| Engagement | `engagementRate` (%) | — | `engagementRate` |
| Avg Engagement | `userEngagementDuration / totalUsers` (sec) | "per visitor" | `userEngagementDuration` |

> "Avg Engagement" 는 `averageSessionDuration` 이 아닌 **`userEngagementDuration` per visitor**. 백그라운드 탭 제외, 실제 active 시간만 합산. sparse 신호(좋아요/댓글) 대신 dense 신호로 "관심" 측정.

### 시계열
- `date` × `totalUsers` + `screenPageViews` (일별)

### Sources / Countries / Devices (3분할 차트)
- Sources: `sessionSource` × `sessionMedium` (top 15) — horizontal bar
- Countries: `country` × `totalUsers` (top 10)
- **Devices**: `deviceCategory` × `totalUsers` — mobile/desktop/tablet 색 구분 horizontal bar

### Top Posts 테이블
필터: 라우팅 prefix 6종 (`/{ko,en}/{posts,surveys,projects}/`). 응답에서 **현재 인덱스에 없는 슬러그(삭제됨) 자동 제외** — limit 60 → 30 슬라이스.

| 컬럼 | 출처 | 비고 |
|---|---|---|
| # | content number (`#N` / `#SN` / `#PN`) | 인덱스에서 매핑 |
| Title | `title_ko` / `title_en` (locale별) | slug fallback |
| Lang | path locale | `/ko/` or `/en/` |
| Views | `screenPageViews` | sortable |
| Visitors | `totalUsers` | sortable |
| Avg Engaged | `userEngagementDuration / visitors` | sortable, 페이지별 진짜 read 시간 |
| Engage % | `engagementRate` (per page) | sortable, ≥10s 또는 1+ event 세션 비율 |

각 행 제목 옆에 `💬 N` 인디케이터 — `post_comments_public` 카운트 (정량 정렬 X, 댓글 발생 신호만).

### 드릴다운 — Top Posts × Referrer
행 클릭 시 펼쳐져서 그 글의 referrer top 5 표시.
- 별도 report: `pagePath` × `sessionSource` (limit 500), 백엔드에서 path별로 group + sort + top 5
- UI: 소스명 + 비율 바 + pageviews + %

### 클라이언트 트래킹 — `scroll_depth` custom event
- `src/components/ScrollDepthTracker.tsx` 가 모든 포스트 상세(`ContentDetailPage`)에서 25/50/75/100% 통과 시 한 번씩 발화
- params: `percent`, `slug`, `content_type`
- ⚠️ Stats 화면 컬럼화는 **GA4 데이터 누적 1-2주 후** customEvent report 추가 단계에서 진행 (현재는 수집만)

## 5) UI/기능 요구사항
- 기간 필터: `7d`, `30d`, `90d`, `all`, `custom`
- 화면 구성:
  1) KPI 카드 (4)
  2) 시계열 차트
  3) Sources / Countries / Devices (3분할)
  4) Top Posts 테이블 + 행 펼치기로 referrer 분포
- 관리자 탭 바에서 `Stats` 활성 표시

## 6) 보안/성능
- GA 서비스계정 JSON/키는 **서버에서만** 사용 (클라이언트 노출 금지)
- `/api/admin/*`는 admin 세션 없으면 401
- 캐싱: 동일 기간 요청은 1~5분 캐시(관리자 UX 개선 + quota 보호)

Cloudflare Worker 환경변수는 `wrangler.jsonc`의 `vars`(공개)와 `wrangler secret put`(민감)로 분리 관리한다. 민감 값은 반드시 secret으로 저장.

## 7) 환경변수(키 이름만)
- Admin: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- GA 수집: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- GA 조회(Data API):
  - `GA4_PROPERTY_ID`
  - `GA_SERVICE_ACCOUNT_JSON` (서비스 계정 JSON 문자열 또는 base64)
  - (선택) `GA4_START_DATE` — `period=all` 일 때 기본 시작일. 미설정 시 GA4 property create date fetch.
  - (대안) `GOOGLE_APPLICATION_CREDENTIALS` 파일 경로 방식은 Workers 런타임에서 파일 시스템 접근이 제한되므로 사용 불가 — JSON 문자열 방식만 지원
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — 댓글 카운트 조회용

## 8) 검증 체크
- 관리자 인증 후 `/admin/stats` 접근 가능
- 기간 선택에 따라 KPI/차트/Top Posts 갱신
- 삭제된 슬러그가 Top Posts 에 표시되지 않음 (인덱스 lookup 후 필터)
- 행 클릭 시 referrer 분포 펼쳐짐
- prod에서 GA 이벤트가 들어오고, Data API 조회가 성공
- 토큰/키가 브라우저로 노출되지 않음
- 포스트 상세 페이지 조회 시 GA4 DebugView 에서 `scroll_depth` event 25/50/75/100 단계 확인
