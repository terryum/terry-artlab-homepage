# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-04 (KST)
- 현재 단계: 커버 이미지/카드 요약 개선 완료, 푸시 예정
- 전체 진행도(대략): 100% (v1 기능 완료)

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare + Vercel + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v6
- 콘텐츠 구조: `posts/{research,idea}/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
- 라우트: `/research` (읽기), `/ideas` (쓰기) — 폴더가 content_type의 source of truth
- 카드/상세 커버: 원본 비율 유지 + `card_summary` + `cover_caption` + `cover_thumb` 지원

## 3) 완료됨
- [x] 프로젝트 스캐폴딩, i18n 라우팅, 콘텐츠 파이프라인
- [x] 레이아웃 & 네비게이션, 공용 목록/상세 템플릿
- [x] Home & About 페이지, SEO, 다크/라이트 테마
- [x] ForceVLA 첫 실제 포스팅 생성 (arXiv 2505.22159)
- [x] Source Box + Reference Card 컴포넌트 (frontmatter 기반 자동 렌더링)
- [x] 라우트 리네이밍: /read→/research, /write→/ideas
- [x] 커버 이미지 개선: 상세 페이지 원본 비율 유지 + max-h-96 + figcaption
- [x] 카드 개선: cover_thumb fallback, card_summary fallback, line-clamp 모바일4/데스크톱3
- [x] 썸네일 112px + gap-6으로 홈/목록 페이지 세로 정렬 통일
- [x] 문서 업데이트: POST_GENERATOR_RESEARCH, RESEARCH_SUMMARY_RULES, CONTENT_MODEL

## 4) 진행 중 / 막힘
- 진행 중: 없음
- 막힘/리스크: 없음

## 5) 다음 3개 작업 (우선순위)
1. Vercel 배포 확인
2. 다음 논문 포스팅 추가
3. Ideas 탭 첫 포스트 작성

## 6) 검증 상태 (요약)
- 빌드/린트: `npm run build` 성공 (SSG 정상)
- 콘텐츠 파이프라인: ForceVLA ko/en 포스팅 정상 렌더링
- 새 필드: card_summary, cover_caption, cover_thumb 정상 동작 확인

## 7) 컨텍스트 메모 (다음 세션용)
- `.next` 캐시: 파일 이동/라우트 변경 후 반드시 `rm -rf .next`
- MDX 주석: `{/* */}` 사용 (`<!-- -->` 불가)
- slug 규칙: `YYMM-<short-name>-<additional-context>`
- `post_id == slug == 폴더명` 동일 유지
- 요약 품질 조정: `docs/RESEARCH_SUMMARY_RULES.md`만 수정
- 카드 요약 글자수: ko 85-100자, en 150-180자 (모바일 4줄 / 데스크톱 3줄)
- 홈/Research/Ideas 목록 모두 `ContentCard` 공유 (레이아웃 통일)
