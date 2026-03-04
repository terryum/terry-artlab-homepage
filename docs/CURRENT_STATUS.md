# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-04 (KST)
- 현재 단계: 코드베이스 리팩토링 완료
- 전체 진행도(대략): 100% (v1 기능 완료 + 리팩토링 완료)

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare + Vercel + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- 콘텐츠 구조: `posts/{research,idea}/<slug>/meta.json`, `ko.mdx`, `en.mdx`, `cover.webp`
- 메타데이터: `meta.json` (언어 무관) + MDX frontmatter (언어별), shallow merge
- 라우트: `/research` (읽기), `/ideas` (쓰기) — 폴더가 content_type의 source of truth

## 3) 완료됨
- [x] v1 전체 기능 (스캐폴딩~ForceVLA 포스팅~UI 개선)
- [x] 리팩토링: 유틸 추출 (LinkBadge, paths.ts, references.ts, localize.ts)
- [x] 리팩토링: 라우트 페이지 통합 (content-page-helpers.ts, 스켈레톤 통합)
- [x] 리팩토링: 대형 컴포넌트 분리 (AppendixSection, AuthorList, normalizeMeta 분해)
- [x] 리팩토링: 설정 중앙화 (site-config.ts), dev 포트 3040, .next 자동 정리
- [x] 리팩토링: 문서 정리 (스키마 정본 지정, Newsletter v2 명시, 참조 정리)

## 4) 진행 중 / 막힘
- 진행 중: 없음
- 막힘/리스크: 없음

## 5) 다음 3개 작업 (우선순위)
1. Vercel 배포 확인
2. 다음 논문 포스팅 추가 (새 규칙 기반)
3. Ideas 탭 첫 포스트 작성

## 6) 검증 상태 (요약)
- 빌드: `npm run build` 성공 (리팩토링 후 전체 검증 완료)
- 타입체크: `tsc --noEmit` 에러 없음
- 전체 16페이지 SSG 정상 생성

## 7) 컨텍스트 메모 (다음 세션용)
- `.next` 캐시: `npm run build`에서 자동 정리 (scripts/clean-next.mjs)
- 공유 유틸: `src/lib/paths.ts`, `src/lib/references.ts`, `src/lib/localize.ts`, `src/lib/site-config.ts`
- 공유 컴포넌트: `LinkBadge`, `AppendixSection`, `AuthorList`, `skeletons/ListSkeleton`, `skeletons/DetailSkeleton`
- 라우트 헬퍼: `src/lib/content-page-helpers.ts` (Index + Detail 공통 로직)
- 메타데이터 스키마 정본: `docs/POST_GENERATOR_RESEARCH.md`
