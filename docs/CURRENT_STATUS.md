# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-04-08 (KST)
- 현재 단계: 워크스페이스 분리 완료. Obsidian 운영은 terry-obsidian, 홈페이지 개발은 이곳.
- 전체 진행도(대략): 100%

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- ACL: Git 파일 기반 inline visibility — meta.json에 `visibility`/`allowed_groups` 필드
- 워크스페이스 분리: Obsidian 스킬 → `terry-obsidian`, 콘텐츠 스킬 → 심링크로 공유
- content_type: `papers`/`notes`/`memos`/`essays` = 탭 슬러그 = 디렉토리명

## 3) 완료됨
- [x] v1 전체 기능 + AI Memory 시스템 + Research 포스팅 자동화
- [x] Inline visibility ACL 시스템 + #26 TacScale, #27 TacPlay (group: snu)
- [x] 워크스페이스 분리: Obsidian 스킬 8개 → terry-obsidian, 콘텐츠 스킬 5개 심링크

## 4) 진행 중 / 막힘
- (없음)

## 5) 다음 3개 작업 (우선순위)
1. **Admin Graph UI 검증**: `/admin/graph`에서 노드/엣지 확인 (Supabase 연결 필요)
2. **GA4 설정**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 환경변수 추가
3. **README ACL 섹션 업데이트**: inline visibility 반영

## 6) 검증 상태 (요약)
- ACL inline visibility 전체 플로우 ✅
- 워크스페이스 분리 + 심링크 정상 동작 ✅

## 7) 컨텍스트 메모 (다음 세션용)
- 워크스페이스: terry-obsidian (Obsidian+포스팅), terry-artlab-homepage (홈페이지 개발)
- 콘텐츠 스킬(post, project 등)은 이곳에서 관리, terry-obsidian에서 심링크 참조
- Supabase private_content 테이블은 deprecated (inline visibility로 전환됨)
- dev 서버 포트: 3040
