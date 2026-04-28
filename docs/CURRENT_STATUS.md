# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-04-28 (KST)
- 현재 단계: (1) 옛 IA(Ideas/Research/Tech) 잔재 정리 + (2) admin Stats 개선 (engagement 신호 + Devices + Top Posts × Referrer 드릴다운 + scroll_depth 트래킹) 완료
- 전체 진행도: v1 100% + 인프라 완성 + 컴포넌트 리팩토링 2차 완료 + ISR cache 운영 자동화 + IA/Stats 정리

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: **Cloudflare Workers(OpenNext) + Pages + R2 + GitHub**. Supabase 는 댓글/좋아요/그래프 등 데이터 레이어로만 유지
- Canonical 도메인: **`www.terryum.ai`**
- 사용자 노출 카테고리: **Essays / Surveys / Papers / Notes** (Notes 탭 = `memos` + `threads` content_type 자동 병합 in `TAB_CONFIG`). 옛 라우팅(`?tab=memos|threads`, `?author=`)은 `middleware.ts` 308 리다이렉트로 호환
- Stats 의 "관심" 신호: 좋아요/공유 같은 sparse 카운트 정렬 X. Dense 한 GA4 metric (`userEngagementDuration` per visitor, `engagementRate` per page) + `scroll_depth` 이벤트(누적 1-2주 후 컬럼화)로 측정
- 발행 파이프라인: `posts/{essays,memos,threads}/<slug>/` 폴더 구조와 `content_type` 메타는 Obsidian 동기화 의존. terry-obsidian `/post` canonical (변경 금지 영역)

## 3) 완료됨 (이번 세션)
- [x] **IA 잔재 정리** — 코드 4건(`KnowledgeGraph.tsx` 죽은 `/research` 라우트 매핑 제거 → `/posts/[slug]`, `GraphPopup.tsx` 범례 "Essays/Memos" → "Essays/Notes", `generate-index.mjs` `tech` 데드 분기 제거, `post.ts` 주석) + docs 11개 파일 갱신 (`SITEMAP_IA`/`DESIGN_SYSTEM`/`PRD`/`PRD_ADMIN`/`PAGE_SPECS`/`QA_CHECKLIST`/`POST_GENERATOR_BLOG`(deprecated 헤더)/`POSTING_WORKFLOW`/`REFACTOR_PAPER_DB`/`IMAGE_LOADING_STRATEGY`/`DISCOVERABILITY_ANALYTICS`)
- [x] **admin Stats 개선** — `/api/admin/stats` posts 응답에서 삭제된 슬러그 자동 제외 + slug → title (locale별), Top Posts에 `userEngagementDuration / visitors` ("Avg Engaged") + `engagementRate` per page ("Engage %") 컬럼, KPI Visitors 카드에 신규/재방문 비율 부가, 새 **Devices** 차트 (Sources/Countries 옆 3분할), 행 클릭 시 **referrer 드릴다운** (pagePath × sessionSource), 댓글 인디케이터 💬 N (`post_comments_public` 카운트, 정량 정렬 X)
- [x] **`scroll_depth` GA4 이벤트 트래킹 시작** — `src/components/ScrollDepthTracker.tsx` (25/50/75/100% 한 번씩 발화) 가 `ContentDetailPage` 에 자동 마운트. 1-2주 누적 후 stats 컬럼화 가능
- [x] `docs/PRD_ADMIN_STATS.md` 새 KPI/Devices/드릴다운/scroll_depth 반영

## 4) 알려진 제약
- 비공개 슬러그 on-demand 렌더링: 메타 (index-private.json) + 본문 (R2 `private/posts/...`) 모두 R2 에 업로드돼야 동작
- 미지의 dynamic 슬러그 (`/en/posts/zzz`): noindex 적용되지만 HTTP status 200 (Next.js 15 + dynamicParams 한계)
- Cloudflare CDN edge cache (`s-maxage=31536000`) 는 deploy 자동 갱신 X — 사고 시 R2 ISR cache + CF dashboard URL purge 모두 필요할 수 있음
- `scroll_depth` 데이터는 GA4 collection → Data API 반영까지 24시간+, 의미 있는 트렌드는 1-2주 후

## 5) 다음 작업 후보
- **#1 (1-2주 뒤)** `scroll_depth` 데이터 누적 후 stats route 에 customEvent report 추가 + Top Posts에 "Read 75%+" 컬럼 합치기 (사용자가 필요 시 수동 트리거 — `/schedule` 미설정)
- **#2** 비공개 본문 자동 R2 업로드 (`/post --visibility=group/private` 흐름 끝에 R2 업로드 단계 추가) — terry-obsidian 워크스페이스에서 진행
- **Hard HTTP 404**: middleware 에서 known-slug 검증 후 rewrite 또는 Next.js issue 진척 확인
- **5-repo 코드베이스 정리**: C2 (vitest 도입) → C1 (큰 파일 분리) 순. 백로그: `~/.claude/plans/terryum-ai-terry-surveys-toasty-zephyr.md` § C

## 6) 검증 상태 (이번 세션 마지막)
- `npx tsc --noEmit` 모든 단계 통과 ✅
- 잔재 grep: 유지 항목(About 페이지의 research 섹션 라벨, TECH_ARCHITECTURE 파일명, sync-obsidian vault 폴더, SocialIcons Threads, deprecated 헤더 설명) 외 0건 ✅
- `node scripts/generate-index.mjs` 재실행 시 `posts/global-index.json` 변경 없음 = `tech` 분기 데드 코드 확인 ✅
- 로컬 dev (`http://localhost:3041`):
  - `/ko/posts?tab={essays|papers|notes}`, `/ko/surveys`, `/ko` → 200 ✅
  - `?tab=memos|threads` → 308 → `?tab=notes` ✅
  - `/api/admin/stats` → 401, `/admin/stats` → 307 → `/login` (인증 게이트 정상) ✅
  - `/ko/posts/<slug>` → 200, `ScrollDepthTracker` 마운트 확인 ✅
- ⚠️ admin 로그인 후 실제 stats UI 검증은 수동 (사용자 직접)

## 7) 컨텍스트 메모
- R2 버킷: `terryum-ai-cache` (incremental cache), `terryum-ai-assets` (public) = `pub-0c3a2ab4c1e34dd1b7abc088a943482d.r2.dev`
- 빌드/배포: GitHub push 시 CF Workers 자동 (~2분) + 그 직후 GC step 실행
- GitHub 계정: **`gh auth switch --user terryum`** — 기본 활성은 `terry-cosmax` 인 경우가 많음
- 포트: 3040~3049
- 월 비용: ~$3-5
- 심링크 복원: `terry-surveys` clone 후 `scripts/link-private.sh` 1회 실행
