---
name: infra-optimize
description: "코드베이스 리팩토링 + Cloudflare R2 마이그레이션 + 성능 최적화 + Git 히스토리 정리. 이미지/PDF를 R2로 이전하고, public/posts/ 이중 저장을 제거하며, 전 세계 로딩 속도를 개선한다. '/infra-optimize', '리팩토링', 'R2 마이그레이션', '성능 최적화', 'Git 정리' 요청 시 사용."
---

# Infra Optimize — 코드베이스 리팩토링 + R2 마이그레이션

## 실행 모드: 파이프라인 (에이전트 팀)

```
[Architect] → [Engineer] → [QA]
  분석/설계     구현/변경     검증/측정
```

## 사전 조건

1. Cloudflare R2 버킷이 생성되어 있어야 함 (사용자에게 확인)
2. `.env.local`에 R2 자격증명이 설정되어야 함
3. `feat/r2-migration` 브랜치에서 작업

## Phase 1: Architect — 분석 + 설계

### 1-1. 코드 구조 분석
- `src/` 디렉토리 구조 분석 (컴포넌트, 라이브러리, 유틸리티)
- 중복 코드/미사용 코드 식별
- 이미지 경로 참조 체인 추적 (MDX → paths.ts → Figure.tsx → public/)
- 빌드 파이프라인 분석 (package.json scripts)

### 1-2. 리팩토링 계획 수립
- 중복 제거, 미사용 코드 삭제, 타입 정리
- `src/lib/paths.ts` — R2 CDN URL 생성 로직 추가
- `scripts/copy-post-images.mjs` — R2 업로드로 전환
- `next.config.ts` — R2 도메인 추가 + 캐시 헤더 강화

### 1-3. R2 아키텍처 설계
- 버킷 구조: `posts/<slug>/fig-*.png`, `posts/<slug>/cover.webp`
- CDN URL 패턴: `https://assets.artlab.ai/posts/<slug>/fig-1.png`
- Fallback: R2 실패 시 로컬 이미지 사용
- OG 이미지: R2에서 서빙 (Next.js OG 태그 경로 변경)

**출력**: `_workspace/01_architect_*.md` 파일 3개

## Phase 2: Engineer — 구현

### 2-1. R2 설정
- `@aws-sdk/client-s3` 설치 (R2는 S3 호환)
- `scripts/upload-to-r2.mjs` 작성 — 기존 이미지를 R2에 업로드
- `.env.local`에 R2 자격증명 추가 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)

### 2-2. 이미지 경로 변경
- `src/lib/paths.ts` — `resolvePostAssetPath()`를 R2 URL로 변경
- `src/lib/posts.ts` — `cover_image`, `cover_thumb` 경로 변경
- `src/components/Figure.tsx` — R2 이미지 로딩
- `next.config.ts` — `images.remotePatterns`에 R2 도메인 추가

### 2-3. 이중 저장 제거
- `scripts/copy-post-images.mjs` 수정: 프로덕션에서는 복사 불필요
- `public/posts/` 를 `.gitignore`에 추가
- 로컬 dev에서만 fallback으로 복사

### 2-4. 캐시 + 성능 최적화
- R2 이미지에 `Cache-Control: public, max-age=31536000, immutable`
- `next.config.ts`에 `/posts/*` 경로도 캐시 헤더 추가
- OG 이미지도 R2에서 서빙

**출력**: 실제 코드 변경 + `_workspace/02_engineer_changes.md`

## Phase 3: QA — 검증

### 3-1. 빌드 검증
```bash
rm -rf .next && npm run build
```

### 3-2. 이미지 로딩 검증
- 모든 포스트의 cover, figure, thumbnail이 R2에서 정상 로딩
- OG 이미지가 소셜 미디어에서 정상 표시

### 3-3. 성능 측정 (After)
```bash
# TTFB 측정
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s, Total: %{time_total}s\n" \
  "https://www.terryum.ai/ko"

# Git repo 크기
du -sh .git/ posts/ public/posts/
```

### 3-4. Before vs After 비교
| 지표 | Before | After | 변화 |
|---|---|---|---|
| Repo total | ~824 MB | ? | |
| posts/ | 302 MB | ? | |
| public/posts/ | 245 MB | ? | |
| .git/ | 277 MB | ? | |
| TTFB (홈) | 0.605s | ? | |
| TTFB (포스트) | 0.378~0.634s | ? | |

**출력**: `_workspace/03_qa_*.md` 파일 2개

## Phase 4: Git 히스토리 정리 (선택)

R2 마이그레이션 완료 + main merge 후:
```bash
# 이미지/PDF 히스토리에서 제거
pip install git-filter-repo
git filter-repo --strip-blobs-bigger-than 500K
# force push 필요 — 사용자 확인 후 실행
```

## 테스트 시나리오

### 정상 흐름
1. Architect가 분석/설계 완료 → `_workspace/01_*` 생성
2. Engineer가 R2 설정 + 코드 변경 → 빌드 성공
3. QA가 이미지 로딩 + 성능 측정 → 모든 검증 통과
4. main에 merge

### 에러 흐름
1. R2 API 키 미설정 → Engineer가 사용자에게 설정 요청
2. 빌드 실패 → Engineer가 에러 수정 후 재빌드
3. 이미지 404 → R2 업로드 누락 확인 + 재업로드
4. 성능 저하 → Architect에게 캐시 전략 재검토 요청
