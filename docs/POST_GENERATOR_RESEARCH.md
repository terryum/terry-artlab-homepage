# Research Post Generator 스펙

> 요약 품질/스타일 규칙은 `docs/RESEARCH_SUMMARY_RULES.md` 참조

## 목적

arXiv 링크를 입력으로 받아, 논문 PDF/메타데이터를 읽고 **Research 탭용 포스팅 파일 세트**를 생성하는 워크플로우 스펙이다.

---

## 입력 / 출력 계약

### 입력 (필수)
- arXiv 링크 (예: `https://arxiv.org/abs/2505.22159`)

### 출력 (필수)
- `ko.mdx`, `en.mdx`, `cover.webp`

### 출력 (옵션)
- `fig-*.png` (본문용 이미지)

### 파일명 규칙
- **모두 소문자 + 하이픈**, 예: `cover.webp`, `fig-1.png`

---

## 디렉토리 구조

```text
posts/
  research/          ← Research 탭 (content_type: reading)
    <slug>/
      ko.mdx
      en.mdx
      cover.webp
      fig-1.png      # optional
  idea/              ← Ideas 탭 (content_type: writing)
    <slug>/
      ko.mdx
      en.mdx
      cover.webp
```

- **폴더가 content_type의 source of truth**: `research/` → `reading`, `idea/` → `writing`
- `src/lib/posts.ts`가 양쪽 폴더를 자동 스캔하여 `content_type`을 결정한다
- frontmatter `content_type`은 참고용으로 유지하되, 폴더 위치가 우선한다

### slug 규칙
- 형식: `YYMM-<short-name>-<additional-context>`
- `YY`: 2자리 연도, `MM`: 2자리 월 (arXiv v1 최초 제출일 기준)
- 예시: `2505-forcevla-force-aware-moe` (2025년 5월, ForceVLA 논문)

### `post_id` == `slug` == 폴더명
- 세 값은 항상 동일해야 한다.

### 논문 PDF 보관
- 다운로드한 원본 PDF: `paper/<slug>.pdf`
- `paper/` 폴더는 `.gitignore`에 포함 (대용량 PDF를 git에 넣지 않음)
- 예시: `paper/2505-forcevla-force-aware-moe.pdf`

---

## Frontmatter 스키마

### 필수 키
- `post_id` — slug과 동일
- `locale` — `"ko"` 또는 `"en"`
- `title`
- `summary`
- `slug` — 폴더명과 동일
- `published_at` — ISO 8601 (예: `"2025-05-28T00:00:00Z"`)
- `updated_at` — ISO 8601
- `status` — `"draft"` 또는 `"published"`
- `content_type` — `"reading"` (참고용; 실제로는 폴더 위치로 결정)
- `tags` — 문자열 배열
- `cover_image` — `"./cover.webp"` (상대경로)

### Research 전용 추가 키
- `source_url` — arXiv abs URL
- `source_title` — 원문 논문 제목
- `source_author` — **단일 문자열** (예: `"First Author et al."`)
- `source_type` — `"arXiv"`
- `source_project_url` — 프로젝트 페이지 URL (optional)
- `source_authors_full` — **전체 저자 목록** (이름+소속, 문자열 배열)

### 주요 참조 논문 (`references`)
- frontmatter에 구조화된 배열로 저장 (MDX body가 아닌 frontmatter)
- `ReferenceCard` 컴포넌트가 MDX body 아래에 카드 스타일로 렌더링
- 각 항목 필드:
  - `title` — 논문 제목
  - `author` — `"First Author et al. (YYYY)"` 형식
  - `description` — 한줄 설명
  - `arxiv_url` — arXiv 링크 (optional)
  - `scholar_url` — Google Scholar 검색 URL

### 선택 키
- `reading_time_min`, `seo_title`, `seo_description`
- `translation_of` — `null` (ko가 원본) 또는 `"<slug>:ko"`
- `translated_to` — `["en"]`
- `newsletter_eligible` — `false` (v1 미사용)
- `featured` — `false`

### 예시 (ko.mdx)
```yaml
---
post_id: "2505-forcevla-force-aware-moe"
locale: "ko"
title: "ForceVLA: 접촉이 많은 조작을 위한 힘 인식 MoE 기반 VLA 모델"
summary: "2-3문장 요약"
slug: "2505-forcevla-force-aware-moe"
published_at: "2025-05-28T00:00:00Z"
updated_at: "2026-03-04T00:00:00Z"
status: "published"
content_type: "reading"
tags:
  - "Robotics"
  - "VLA"
cover_image: "./cover.webp"
source_url: "https://arxiv.org/abs/2505.22159"
source_title: "ForceVLA: Enhancing VLA Models with a Force-aware MoE for Contact-rich Manipulation"
source_author: "Jiawen Yu et al."
source_type: "arXiv"
source_project_url: "https://sites.google.com/view/forcevla2025"
source_authors_full:
  - "Jiawen Yu (Fudan University)"
  - "..."
references:
  - title: "π₀: A Vision-Language-Action Flow Model for General Robot Control"
    author: "Black et al. (2024)"
    description: "ForceVLA의 베이스 프레임워크."
    arxiv_url: "https://arxiv.org/abs/2410.24164"
    scholar_url: "https://scholar.google.com/scholar?q=..."
translation_of: null
translated_to:
  - "en"
---
```

---

## UI 렌더링 구조

### Source Box (`SourceInfoBlock`)
frontmatter 기반으로 포스트 상단에 자동 렌더링. **MDX body에 Source 섹션 작성하지 않는다.**

```
┌─────────────────────────────────────────────────┐
│ [arXiv]  [Google Scholar]  [Project]   ← 링크 배지
│                                                 │
│ ForceVLA: Enhancing VLA Models with...  ← 제목  │
│                                                 │
│ Jiawen Yu et al. (2025. 5) ▸            ← 저자  │
│   (펼치면: 전체 저자 이름+소속)                    │
└─────────────────────────────────────────────────┘
```

### Reference Card (`ReferenceCard`)
frontmatter `references` 기반으로 MDX body 아래에 카드 목록 자동 렌더링. **MDX body에 참조논문 섹션 작성하지 않는다.**

```
┌─────────────────────────────────────────────────┐
│ [arXiv]  [Google Scholar]               ← 배지  │
│                                                 │
│ π₀: A Vision-Language-Action Flow Model...      │
│ Black et al. (2024)                             │
│ ForceVLA의 베이스 프레임워크...                    │
└─────────────────────────────────────────────────┘
```

---

## arXiv/논문 처리 워크플로우

### Step 0) 입력 정규화
- `https://arxiv.org/abs/<id>` / `https://arxiv.org/pdf/<id>.pdf` 모두 허용
- arXiv ID 추출 (`2505.22159` 등)

### Step 1) 메타데이터 수집
- 제목, 저자 목록 (이름+소속), 초록, 카테고리
- v1 제출일 → slug 날짜 (YYMM)
- PDF URL, Project 페이지 URL

### Step 2) PDF 다운로드
- `paper/<slug>.pdf`에 저장

### Step 3) PDF 읽기 및 정보 추출
- Introduction: 문제 정의, 기존 한계
- Method: 핵심 아이디어
- Experiments: 정량 결과 숫자
- Discussion/Conclusion: 저자 언급 한계점
- References: 비교 논문 1-3개

### Step 4) Cover 이미지 선택 및 다운로드
- arXiv HTML → 프로젝트 사이트 → placeholder fallback
- `cover.webp`로 저장

### Step 5) MDX 렌더링
- `ko.mdx`, `en.mdx` 생성
- MDX body에 Source/참조논문 섹션 작성하지 않음 (frontmatter → 컴포넌트 자동 렌더링)
- MDX 본문 섹션 구조 및 요약 규칙은 `docs/RESEARCH_SUMMARY_RULES.md` 참조

---

## Cover 이미지 생성 규칙

### 선택 규칙 (우선순위)
1. 캡션 키워드: `overview`, `framework`, `pipeline`, `method`, `architecture`
2. Figure 1 우선 (동점이면 1 > 2 > 3)
3. 전체 개념 그림 > 세부 그래프/표
4. 가독성 (너무 작은 텍스트 감점)

### 이미지 소스 우선순위
1. arXiv HTML (`https://arxiv.org/html/<id>`)
2. 프로젝트 사이트
3. 타이틀 텍스트 기반 placeholder

### 처리 규칙
- 출력 포맷: `webp`, 파일명: `cover.webp`

---

## en.mdx 생성 규칙

- `locale: "en"`, `translation_of: "<slug>:ko"`
- 섹션명/설명 영어, 기술 용어 원문 유지
- `references`의 `description`도 영어로 작성

---

## 검수 체크리스트

### 파일 생성
- [ ] `ko.mdx`, `en.mdx`, `cover.webp` 생성
- [ ] `paper/<slug>.pdf` 저장

### 형식/구조
- [ ] 필수 frontmatter 키 모두 존재
- [ ] `post_id == slug == 폴더명` 일치
- [ ] `posts/research/<slug>/`에 배치
- [ ] Research 추가 frontmatter 존재
- [ ] `references` 존재 (1-3개)
- [ ] MDX body에 Source/참조논문 섹션 없음

### 예외 처리
- Figure 추출 실패 → placeholder cover (파일은 반드시 생성)
- 숫자 추출 실패 → `정량 비교 수치 확인 불가` 명시
- arXiv 링크 미확인 → `arxiv_url` 생략, `scholar_url`만 제공
- Project 페이지 미확인 → `source_project_url` 생략
