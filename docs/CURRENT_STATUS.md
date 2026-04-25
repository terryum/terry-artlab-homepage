# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-04-25 (KST)
- 현재 단계: Workers-safe 데이터 경로 + dynamicParams=true 재활성화 완료. Card/리스트 컴포넌트 리팩토링 마무리. 비공개 콘텐츠 재발행 시 redeploy 없이 on-demand 렌더 가능
- 전체 진행도: v1 100% + 인프라 완성 + 컴포넌트 리팩토링 2차 완료

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: **Cloudflare Workers(OpenNext) + Pages + R2 + GitHub**. Supabase 의존 제거 완료
- Canonical 도메인: **`www.terryum.ai`**
- posts/[slug] 데이터 경로: **3 단계 fallback** — (1) fs.readFile (build-time SSG, Node.js) → (2) `src/data/post-bodies.ts` 의 inline ?raw 임포트 (Workers runtime, fs-free) → (3) R2 `private/posts/<type>/<slug>/<lang>.mdx` (group/private 슬러그). dynamicParams=true 안전 활성화
- post-bodies 생성기: `scripts/generate-post-bodies.mjs` 가 dev/build/build:cf/type-check 모두에서 자동 실행. 출력은 gitignored
- R2 URL 단일 소스: `src/lib/r2-config.ts` + `scripts/lib/r2-config.mjs`

## 3) 완료됨 (이번 세션)
- [x] **긴급:** posts force-dynamic 제거 + dynamicParams=false → 모든 포스트 404 회귀 해결
- [x] R2 URL 헬퍼 (`src/lib/r2-config.ts` + `scripts/lib/r2-config.mjs`) 단일화 → paths/r2-private/sync-obsidian/upload-to-r2 모두 사용
- [x] sync-obsidian.mjs 의 죽은 Supabase fetch 를 R2 fetch 로 교체 (`scripts/lib/r2-private.mjs` 신규)
- [x] LockBadge 추출 (3 카드 4 사이트 중복 제거)
- [x] FilterablePostList 분할 (407 → 291 줄, hook+Pagination 신설)
- [x] **post-bodies 인라인 번들** + dynamicParams=true 재활성화 (Workers-safe)
- [x] BaseCard 추출 (ContentCard 117→71, CompactCard 81→44)
- [x] ProjectList / SurveyList 추출 (페이지 마크업 단순화)
- [x] CI: type-check 가 generate-post-bodies 자동 호출

## 4) 알려진 제약
- 비공개 슬러그 on-demand 렌더링: 메타 (index-private.json) + 본문 (R2 `private/posts/...`) 모두 R2 에 업로드돼야 동작. terry-private repo 의 본문이 R2 미업로드면 sync-obsidian 도 R2 fetch 가 빈 결과 반환
- 미지의 슬러그: `notFound()` 가 HTTP 200 + `<title>Not Found>` 템플릿 렌더 (OpenNext+Workers 동작). 깔끔한 HTTP 404 가 필요하면 후속 작업 필요

## 5) 다음 작업 후보
- 미지의 슬러그가 HTTP 200 대신 HTTP 404 반환하도록 OpenNext 동작 점검
- post-bodies 번들 사이즈 모니터링 (현재 46 posts × 2 langs ≈ 1MB 인라인). 100+ 포스트 도달 시 chunked 또는 R2 fetch 전환 검토
- 비공개 본문 자동 R2 업로드 (terry-private push hook → R2 sync)

## 6) 검증 상태 (이번 세션 마지막)
- 8개 포스트 (4 슬러그 × 2 lang) HTTP 200 + 정상 제목 ✅
- 리스트 페이지 (posts, papers tab, projects, surveys, /en) 모두 HTTP 200 ✅
- 미지의 슬러그 HTTP 200 + Not Found 템플릿 (documented behavior) ✅
- `npm run build`, `npm run build:cf`, `ci-verify-prerender`, `npm run type-check` 모두 통과 ✅
- CF Pages 자동배포 success ✅

## 7) 컨텍스트 메모
- R2 버킷: `terryum-ai-cache` (incremental cache), `terryum-ai-assets` (public) = `pub-0c3a2ab4c1e34dd1b7abc088a943482d.r2.dev`
- 빌드/배포: GitHub push 시 CF Pages 자동 (~2분)
- GitHub 계정: **`gh auth switch --user terryum`** — 기본 활성은 `terry-cosmax` 인 경우가 많음
- 포트: 3040
- 월 비용: ~$3-5
- 심링크 복원: `terry-surveys` clone 후 `scripts/link-private.sh` 1회 실행
