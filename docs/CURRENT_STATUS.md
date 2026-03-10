# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-10 (KST)
- 현재 단계: Nature Communications 논문 포스팅 추가 + 비-arXiv 소스 문서화
- 전체 진행도(대략): 100% (v1 기능 완료 + 지속 개선)

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare(도메인/DNS/CDN) + Vercel(배포+SSL) + GitHub
- 도메인: `terry.artlab.ai` (Namecheap CNAME → cname.vercel-dns.com)
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- AI Memory: 글번호(`post_number`) + `ai_summary` + `relations` + `concept_index` → `posts/index.json`
- 비-arXiv 소스: `source_type`에 저널명 사용, 코드 변경 불필요 (동적 렌더링)

## 3) 완료됨
- [x] v1 전체 기능 (스캐폴딩~ForceVLA 포스팅~UI 개선)
- [x] 리팩토링: 유틸 추출, 라우트 통합, 컴포넌트 분리, 설정 중앙화, 문서 정리
- [x] Ideas 탭 첫 포스트: `260310-on-the-manifold-frist-post` 생성
- [x] AI Memory 시스템: `PostMeta` 타입 확장, 5개→6개 meta.json, UI #N 표시, `generate-index.mjs` 스크립트
- [x] Research #6: `2407-stretchable-glove-hand-pose` (Nature Communications, ko/en)
- [x] 비-arXiv 소스 문서: `docs/POST_GENERATOR_RESEARCH_ETC.md`

## 4) 진행 중 / 막힘
- 막힘/리스크: 없음

## 5) 다음 3개 작업 (우선순위)
1. Essays 탭 첫 포스트 작성
2. 커밋 후 Vercel 배포 확인
3. 추가 Research 논문 포스팅

## 6) 검증 상태 (요약)
- 빌드: 성공 (네트워크 TLS 이슈로 Google Fonts fetch 실패 시 `NODE_TLS_REJECT_UNAUTHORIZED=0` 필요 — 로컬 환경 문제)
- `posts/index.json`: 6개 포스트
- `2407-stretchable-glove-hand-pose`: ko/en SSG 렌더링 확인, 7 figures, source_type: "Nature Communications"

## 7) 컨텍스트 메모 (다음 세션용)
- AI Memory 필드: `post_number`, `domain`, `subfields`, `key_concepts`, `methodology`, `contribution_type`, `relations`, `ai_summary`, `idea_status`, `related_posts`
- 인덱스 스크립트: `scripts/generate-index.mjs` — 모든 meta.json → `posts/index.json` (knowledge_graph, concept_index, domain_stats)
- 비-arXiv 소스: `docs/POST_GENERATOR_RESEARCH_ETC.md` — Nature/Springer Figure URL 패턴, 새 소스 추가 체크리스트
- `.next` 캐시: `npm run build`에서 자동 정리 (scripts/clean-next.mjs)
- dev 서버: Turbopack 사용 중 — `⚠ Webpack is configured` 경고는 무해함
