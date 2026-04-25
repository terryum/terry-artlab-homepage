# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-04-25 (KST)
- 현재 단계: posts 404 회귀 긴급 수정 + R2 URL 상수화 + sync-obsidian R2 호환 + Card/FilterablePostList 리팩토링 4건 마무리 + 배포 검증 완료
- 전체 진행도: v1 100% + 인프라 통합 완료 + 컴포넌트 리팩토링 1차 완료

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: **Cloudflare Workers(OpenNext) + Pages + R2 + GitHub**. Supabase 의존 제거 완료
- Canonical 도메인: **`www.terryum.ai`** (terryum.ai apex → www 308 · 구 terry.artlab.ai → AWS CloudFront 301)
- posts/[slug] 렌더 모드: **순수 SSG + dynamicParams=false**. force-dynamic 은 OpenNext+Workers 에서 fs.readFile 가 죽기 때문에 모든 포스트 404 회귀를 일으켰음. 비공개 포스트가 다시 추가될 때는 dynamicParams 를 다시 켜기 전에 public MDX 본문을 R2 로 옮겨 Workers-safe 데이터 경로를 마련해야 함
- R2 URL 단일 소스: `src/lib/r2-config.ts` (TS) + `scripts/lib/r2-config.mjs` (Node 스크립트). `R2_PUBLIC_URL` 또는 `NEXT_PUBLIC_R2_URL` env 기반
- 비공개 콘텐츠 게이트: `src/lib/access-guard.ts::requireReadAccess` 가 3 도메인 공통

## 3) 완료됨 (이번 세션)
- [x] `src/app/[lang]/posts/[slug]/page.tsx` force-dynamic 제거 + dynamicParams=false → 92 routes prerender, 404 회귀 해결
- [x] `src/lib/r2-config.ts` + `scripts/lib/r2-config.mjs` 신규 — R2 URL 단일 헬퍼
- [x] `src/lib/paths.ts`, `src/lib/r2-private.ts`, `scripts/upload-to-r2.mjs`, `scripts/sync-obsidian.mjs` 가 헬퍼 사용 (sync-obsidian 의 하드코딩 R2 URL 제거)
- [x] `scripts/lib/r2-private.mjs` 신규 — Node 스크립트용 fetchPrivateMdx/Meta. sync-obsidian.mjs 의 죽은 Supabase fetch 를 R2 fetch 로 교체
- [x] `src/components/cards/LockBadge.tsx` 신규 — 🔒 배지 단일 컴포넌트. ContentCard/ProjectCard/SurveyCard 4 사이트 중복 제거
- [x] `src/components/posts/{useFilterableUrlState.ts, useFilteredPosts.ts, Pagination.tsx}` 신규 — FilterablePostList 분할 (407 → 291 줄)

## 4) 알려진 제약 (다음 세션 주의)
- **OpenNext + Next 15 + Workers** + `fs.readFile` 호환 문제: posts/[slug] 가 SSG 로 동작하는 한 정적 HTML 만 서빙되어 안전. dynamicParams=true 로 되돌리거나 force-dynamic 을 다시 켜기 전, public MDX 본문도 R2 로 이전해야 함 (현재 `src/lib/posts.ts:206` 의 `fs.readFile` 가 Workers 런타임에서 실패하고 catch 절이 null 반환 → notFound)
- 비공개 본문 sync: sync-obsidian.mjs 는 R2 의 `private/posts/<type>/<slug>/<lang>.mdx` 와 `meta.json` 을 fetch. R2 에 본문이 없으면 명시적 warning + skip (terry-private repo 가 R2 업로드 전 단계라면 sync 가 빈 결과 반환)

## 5) 다음 작업 후보
1. `src/lib/posts.ts` 의 `fs.readFile` 경로를 webpack raw import 또는 R2 fetch 로 교체 → dynamicParams=true 안전하게 재활성화 가능
2. ContentCard / CompactCard 공통 BaseCard 추출 (LockBadge 만 추출했고 카드 본체 통합은 보류)
3. ProjectList / SurveyList 추출 — 현재 page.tsx 가 직접 map. FilterablePostList 패턴 차용 가능

## 6) 검증 상태 (이번 세션 마지막)
- `https://www.terryum.ai/en/posts/<slug>` 4건 × 2 lang HTTP 200 + 정상 제목 ✅
- 미지의 슬러그 (`/en/posts/zzz-nonexistent`) HTTP 404 깔끔 ✅
- `/en/posts`, `/ko/posts`, `?tab=papers`, `?tab=memos`, `/en/projects`, `/en/surveys` 모두 HTTP 200 ✅
- `npm run build` + `npm run build:cf` + `ci-verify-prerender` 모두 통과 ✅
- `node scripts/sync-obsidian.mjs --dry-run` 공개 포스트 4 sync, 42 skip 정상 ✅

## 7) 컨텍스트 메모 (다음 세션용)
- R2 버킷: `terryum-ai-cache` (incremental cache), `terryum-ai-assets` (public) = `pub-0c3a2ab4c1e34dd1b7abc088a943482d.r2.dev`
- 빌드/배포: `npm run build:cf` → `npx opennextjs-cloudflare deploy` (GitHub push 시 자동, ~2분)
- GitHub 계정: **`gh auth switch --user terryum`** — 기본 활성은 `terry-cosmax` 인 경우가 많음
- `.env.production` 은 `NEXT_PUBLIC_*` 만 commit (번들 인라인), 민감값은 `wrangler secret put`
- 포트: 3040
- 월 비용: ~$3-5
- 심링크 복원: `terry-surveys` clone 후 `scripts/link-private.sh` 1회 실행
