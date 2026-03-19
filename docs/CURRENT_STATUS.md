# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-19 (KST)
- 현재 단계: 2512-unitachand 포스팅 완료 + 푸시 완료
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
- [x] 2409-3dtactile-dex, 2602-robopaint 포스팅
- [x] **2512-unitachand 포스팅 완료** (커밋 7b13a9a):
  - "UniTacHand: Unified Spatio-Tactile Representation for Human to Robotic Hand Skill Transfer"
  - Chi Zhang et al. (Peking University / BeingBeyond), arXiv 2025-12-24
  - 13 figures (x1~x9 + section/imgs/* 혼합 명명), cover = fig-1 (파이프라인 개요)
  - Taxonomy: robotics/hand/tactile (primary)
  - 총 16개 포스트

## 4) 진행 중 / 막힘
- 없음

## 5) 다음 3개 작업 (우선순위)
1. **Admin Graph UI 검증**: `/admin/graph`에서 노드/엣지 확인 (Supabase 연결 필요)
2. **posts/tech/260315-rebalancing/** 블로그 포스트 작업 (`/post --type=blog 260315-rebalancing`)
3. **GA4 설정**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 환경변수 추가

## 6) 검증 상태 (요약)
- 빌드: `npm run build` 성공 (2026-03-19, 16 posts)
- validate-post: 0 errors, 0 warnings ✅

## 7) 컨텍스트 메모 (다음 세션용)
- arXiv HTML figures가 x1-x9 + section/imgs/* 혼합 사용하는 경우 있음 → 10번 이상은 실제 img src 확인 필요
- Supabase: fyrgooabpegysrcawtdm.supabase.co (terry-paper-graph-db)
- dev 서버: Turbopack 사용 중 (`npm run dev`, 포트 3040)
