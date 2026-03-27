# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-27 (KST)
- 현재 단계: Papers 분야별 탐색 사이드바 + 태그 연동 완료 + 푸시 완료
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
- [x] **이전 글/다음 글 네비게이션** (3afbc42): TAB_CONFIG.author 기반 저자 그룹별 이동
- [x] **Papers 분야별 탐색 사이드바** (최신):
  - PC(lg+): 왼쪽 sticky 사이드바 (w-52, top-24)
  - 모바일: 기존 inline card 유지
  - 필터 파이프라인 재정렬: tab → taxonomy → tag → starred
  - taxonomy 선택 시 태그·카운트가 해당 범위 내 포스팅 기준으로 갱신
  - taxonomy 재클릭 시 필터 해제 (onSelect null)
  - taxonomy 변경 시 선택된 태그 자동 초기화
  - TaxonomyFilter에 variant='sidebar'|'inline' prop 추가

## 4) 진행 중 / 막힘
- 없음

## 5) 다음 3개 작업 (우선순위)
1. **posts/tech/260315-rebalancing/** 블로그 포스트 작업
2. **Admin Graph UI 검증**: `/admin/graph`에서 노드/엣지 확인 (Supabase 연결 필요)
3. **GA4 설정**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 환경변수 추가

## 6) 검증 상태 (요약)
- 빌드: `npm run build` 성공 (2026-03-26, 18 posts)
- tsc --noEmit: 오류 없음 ✅
- 필터 파이프라인 로직 시뮬레이션 통과 ✅

## 7) 컨텍스트 메모 (다음 세션용)
- arXiv HTML figures: x1-xN 다운로드 후 fig-1~N으로 리네임 (기존 모든 포스트 동일 규칙)
- Supabase: fyrgooabpegysrcawtdm.supabase.co (terry-paper-graph-db)
- dev 서버: Turbopack 사용 중 (`npm run dev`, 포트 3040)
- Papers 사이드바 sticky top: 24 (= 96px) — 헤더 높이 맞게 조정 필요 시 변경
