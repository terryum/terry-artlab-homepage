# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-31 (KST)
- 현재 단계: Bluesky 소셜미디어 공유 추가 + X 카드 캐시 버스팅 수정 완료. 대기 중.
- 전체 진행도(대략): 100%

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- AI Memory: `posts/index.json` + Supabase Graph DB (papers, graph_edges, node_layouts)
- Paper Graph: Supabase + React Flow, sync-papers.mjs로 동기화
- content_type: `papers`/`notes`/`tech`/`essays` = 탭 슬러그 = 디렉토리명

## 3) 완료됨
- [x] v1 전체 기능 + AI Memory 시스템 + Research 포스팅 자동화
- [x] Papers 사이드바 outside-container (3c9c18b)
- [x] **Bluesky 소셜미디어 공유 추가**: publish-social.py에 Bluesky(AT Protocol) 지원
  - OG 태그 fetch + 이미지 blob 업로드 → external embed 링크 카드 표시
  - `.env.example`, GitHub Actions workflow, `/post-share` 스킬 모두 반영
- [x] **X 카드 캐시 버스팅**: `build_x_text()`에서 URL에 `?v=YYYYMMDD` 추가 (크롤러 캐시로 og:image 미표시 문제 해결)
- [x] **`/post-share` content_type 검증**: essays/tech 외 글 공유 시 사용자 확인 요청

## 4) 진행 중 / 막힘
- 없음

## 5) 다음 3개 작업 (우선순위)
1. **posts/tech/260315-rebalancing/** 블로그 포스트 작업
2. **Admin Graph UI 검증**: `/admin/graph`에서 노드/엣지 확인 (Supabase 연결 필요)
3. **GA4 설정**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 환경변수 추가

## 6) 검증 상태 (요약)
- Bluesky dry-run + 실제 발행 테스트 ✅
- X 토큰 재설정 + 발행 테스트 ✅ (`.env.local` \r 제거 필요했음)
- X 카드 캐시 버스팅(`?v=YYYYMMDD`) 이미지 표시 확인 ✅

## 7) 컨텍스트 메모 (다음 세션용)
- 소셜미디어 플랫폼: Facebook, Threads, LinkedIn, X, **Bluesky** (5개)
- Bluesky: app password 인증 (만료 없음), `BLUESKY_IDENTIFIER` + `BLUESKY_APP_PASSWORD`
- X: OAuth 1.0a, `.env.local`에 Windows 줄바꿈(\r) 혼입 주의
- Supabase: fyrgooabpegysrcawtdm.supabase.co (terry-paper-graph-db)
- dev 서버: Turbopack (`npm run dev`, 포트 3040)
