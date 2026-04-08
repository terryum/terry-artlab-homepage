# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-04-08 (KST)
- 현재 단계: 비공개 콘텐츠를 Supabase로 이전 완료. Git에 흔적 없음.
- 전체 진행도(대략): 100%

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- ACL: 비공개 콘텐츠는 Supabase `private_content` 테이블 + Storage 버킷. Git에 흔적 없음.
- 워크스페이스: terry-obsidian (Obsidian+포스팅), terry-artlab-homepage (홈페이지 개발)
- content_type: `papers`/`notes`/`memos`/`essays` = 탭 슬러그 = 디렉토리명

## 3) 완료됨
- [x] v1 전체 기능 + AI Memory 시스템 + Research 포스팅 자동화
- [x] Inline visibility ACL: 로그인 시 group 포스트/프로젝트 메인 사이트에 표시
- [x] 비공개 콘텐츠 Supabase 이전 (Git에서 완전 제거)
- [x] Header Login/Logout 버튼 상시 표시

## 4) 진행 중 / 막힘
- Git history rewrite: 과거 커밋에 비공개 콘텐츠 흔적 남아있음 (BFG/filter-branch 필요)

## 5) 다음 3개 작업 (우선순위)
1. **Git history 정리**: BFG Repo Cleaner로 과거 커밋에서 비공개 콘텐츠 제거
2. **지식 그래프 스크립트 업데이트**: generate-index --include-private, sync-obsidian.mjs
3. **Vercel 배포 테스트**: 라이브 사이트에서 Supabase 기반 비공개 콘텐츠 동작 확인

## 6) 검증 상태 (요약)
- 로컬 dev: 비인증→숨김, SNU→보임, 로그아웃→숨김 ✅
- 커버 이미지 API: 인증 필요, Supabase Storage에서 서빙 ✅
- Build 성공 ✅
- Git 추적 파일에 비공개 콘텐츠 참조 없음 ✅

## 7) 컨텍스트 메모 (다음 세션용)
- Supabase: private_content + private-covers 버킷
- 비공개 이미지: /api/co/image/[slug] API 라우트로 서빙
- dev 서버: NODE_TLS_REJECT_UNAUTHORIZED=0 필요 (회사 네트워크)
- 포트: 3040
