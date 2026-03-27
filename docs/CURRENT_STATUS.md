# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-27 (KST)
- 현재 단계: 이전 글/다음 글 네비게이션 추가 완료 + 푸시 완료
- 전체 진행도(대략): 100%

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- AI Memory: `posts/index.json` + Supabase Graph DB (papers, graph_edges, node_layouts)
- Paper Graph: Supabase + React Flow, sync-papers.mjs로 동기화
- content_type 완전 정렬: `papers`/`notes`/`tech`/`essays` = 탭 슬러그 = 디렉토리명

## 3) 완료됨
- [x] v1 전체 기능 + AI Memory 시스템 + Research 포스팅 자동화
- [x] Paper Graph DB + Figure 투명배경 변환
- [x] **2201-mano-hand-model** (e6607da): MANO foundational paper, PDF fallback, 17번
- [x] **2512-osmo-tactile-glove 포스팅 완료** (d385a29): 18번
- [x] **이전 글/다음 글 네비게이션 추가** (3afbc42):
  - 포스트 하단에 저자 그룹별(AI/Terry) 이전·다음 글 네비게이션
  - `TAB_CONFIG.author` 기반 그룹핑 → 신규 카테고리 추가 시 자동 포함
  - 변경 파일: `posts.ts`, `content-page-helpers.ts`, `ContentDetailPage.tsx`, `page.tsx`

## 4) 진행 중 / 막힘
- 없음

## 5) 다음 3개 작업 (우선순위)
1. **posts/tech/260315-rebalancing/** 블로그 포스트 작업 (`/post --type=blog 260315-rebalancing`)
2. **Admin Graph UI 검증**: `/admin/graph`에서 노드/엣지 확인 (Supabase 연결 필요)
3. **GA4 설정**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 환경변수 추가

## 6) 검증 상태 (요약)
- 빌드: `npm run build` 성공 (2026-03-26, 18 posts)
- tsc --noEmit: 오류 없음 ✅
- validate-post: 0 errors, 0 warnings ✅

## 7) 컨텍스트 메모 (다음 세션용)
- arXiv HTML figures: x1-xN 다운로드 후 fig-1~N으로 리네임 (기존 모든 포스트 동일 규칙)
- MANO: 2017년 고전 논문 PDF 2열 레이아웃 → pymupdf text 직접 파싱으로 캡션 복원
- OSMO: Jessica Yin이 2407-tactile-skin-inhand-translation과 동일 1저자 (Meta FAIR)
- Supabase: fyrgooabpegysrcawtdm.supabase.co (terry-paper-graph-db)
- dev 서버: Turbopack 사용 중 (`npm run dev`, 포트 3040)
