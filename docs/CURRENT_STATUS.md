# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-16 (KST)
- 현재 단계: Social Media 자동 공유 v2 구현 완료 (main 브랜치)
- 전체 진행도(대략): 100% (dry run 검증 완료)

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 도메인: `terry.artlab.ai` (Namecheap CNAME → cname.vercel-dns.com)
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- AI Memory: 글번호(`post_number`) + `ai_summary` + `relations` + `concept_index` + `taxonomy` → `posts/index.json`
- content_type 완전 정렬: `papers`/`notes`/`tech`/`essays` = 탭 슬러그 = 디렉토리명

## 3) 완료됨
- [x] v1 전체 기능 (스캐폴딩~ForceVLA 포스팅~UI 개선)
- [x] AI Memory 시스템: `PostMeta` 타입 확장, `generate-index.mjs` 스크립트
- [x] Research #6~#11 포스팅 (arXiv + Nature Communications)
- [x] 포스팅 자동화: `.claude/commands/post.md` 슬래시 커맨드 + `scripts/extract-paper-pdf.py`
- [x] 리팩토링: 웹 포스팅 UI/API 제거, Container 컴포넌트, display.ts 헬퍼, TagItem 단일화
- [x] Knowledge Graph Phase 1~3 (taxonomy, clusters, RelatedPapers, TaxonomyFilter)
- [x] 탭명·디렉토리·content_type 완전 정렬
- [x] Substack 연동 v1 (SubstackSubscribe, publish-substack.py, GitHub Actions)
- [x] **Social Media 자동 공유 v2**:
  - `scripts/publish-social.py` — Facebook/Threads/LinkedIn/X 공유
  - `.github/workflows/social-publish.yml` — posts/index.json 변경 시 자동 트리거
  - 플랫폼별 독립 캐시 (`.social-published.json`)
  - 토큰 만료 경고 (45일 warn / 60일 skip)
  - `docs/PLAN_SOCIAL_MEDIA_V2.md` — 토큰 갱신 가이드 포함

## 4) 진행 중 / 막힘
- 없음 (코드 구현 완료, 토큰 등록 대기 중)

## 5) 다음 3개 작업 (우선순위)
1. **소셜미디어 사전 조건 완료** (사용자 직접 수행):
   - Facebook Page 생성 → Page ID 확인 → Long-lived Token 발급
   - Threads OAuth 토큰 발급 (graph.threads.net)
   - LinkedIn OAuth 2.0 토큰 발급 (w_member_social 스코프)
   - X Developer Portal → App 생성 → OAuth 1.0a Access Token
2. **GitHub Secrets 등록** (13개 환경변수)
3. **실제 발행 테스트**: `python scripts/publish-social.py --slug=<slug>`

## 6) 검증 상태 (요약)
- 빌드: 성공 (TypeScript OK, 2026-03-15 기준)
- Social publish dry run: 4개 플랫폼 모두 통과 (2026-03-16)
- `posts/index.json`: 11개 포스트, 3 clusters, 3 bridge papers, 1 outlier

## 7) 컨텍스트 메모 (다음 세션용)
- ai_summary 필드: dict 구조 (`one_liner`, `problem`, `solution`) — publish-social.py에서 `extract_ai_summary()` 헬퍼로 처리
- 소셜 캐시: `.social-published.json` (gitignore됨, CI에서 커밋으로 유지)
- 토큰 만료: Threads/LinkedIn 60일, `*_TOKEN_CREATED` 환경변수 기준 자동 경고
- dev 서버: Turbopack 사용 중 (`npm run dev`, 포트 3040)
- 운영 가이드: `docs/PLAN_SOCIAL_MEDIA_V2.md`
