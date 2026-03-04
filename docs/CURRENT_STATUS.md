# CURRENT_STATUS.md

> 목적: `/clear` 이후에도 이전 작업을 빠르게 재개하기 위한 **짧은 스냅샷** (append 금지, 매번 덮어쓰기)

## 1) 세션 스냅샷
- 마지막 업데이트: 2026-03-04 (KST)
- 현재 단계: Research 포스트 생성 워크플로우 구현 완료
- 이번 세션 목표: arXiv Research Post Generator 구현 + 첫 실제 포스팅
- 전체 진행도(대략): 95%

## 2) 지금 기준 핵심 결정 (최대 5개)
- 인프라: Cloudflare + Vercel + GitHub
- 스택: Next.js 15.5 (App Router) + TypeScript + Tailwind CSS v4 + next-mdx-remote v5
- 콘텐츠 구조: `posts/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
- Ideas/Research: 공용 템플릿 (ContentIndexPage, ContentDetailPage, ContentCard)
- 논문 PDF 보관: `papers/<slug>/source.pdf` (.gitignore 포함)

## 3) 완료됨
- [x] 프로젝트 스캐폴딩, i18n 라우팅, 콘텐츠 파이프라인
- [x] 레이아웃 & 네비게이션, 공용 목록/상세 템플릿
- [x] Home & About 페이지, SEO, 다크/라이트 테마
- [x] 로딩 성능 최적화
- [x] POST_GENERATOR_RESEARCH.md 코드베이스 불일치 수정
- [x] 더미 포스트 6개 전체 삭제
- [x] ForceVLA 첫 실제 포스팅 생성 (arXiv 2505.22159)
- [x] 빌드 성공 확인 (16페이지 SSG)

## 4) 진행 중 / 막힘
- 진행 중: 없음
- 막힘/리스크: 없음
- 필요한 결정: 커밋/푸시 시점 (사용자 결정)

## 5) 다음 3개 작업 (우선순위)
1. Git 커밋 3개 (docs 수정 / 더미 삭제 / 첫 포스팅)
2. GitHub push + Vercel 배포 확인
3. 다음 논문 포스팅 추가

## 6) 검증 상태 (요약)
- 빌드/린트/테스트: `npm run build` 성공 (16페이지 SSG)
- 콘텐츠 파이프라인: ForceVLA ko/en 포스팅 정상 렌더링
- 배포(Preview/Prod): 준비전

## 7) 컨텍스트 메모 (다음 세션용)
- MDX 주석: `<!-- -->` 사용 불가, `{/* */}` 사용 필수
- slug 규칙: `YYYY-MM-DD-<short-name>` (arXiv v1 날짜 기준)
- `post_id == slug == 폴더명` 동일 유지
- 다음 세션 시작 시 먼저 읽을 문서:
  - `docs/CURRENT_STATUS.md`
  - `docs/POST_GENERATOR_RESEARCH.md`
