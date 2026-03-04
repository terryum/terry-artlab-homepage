# Research Post Generator 스펙

> arXiv 링크 → Research 포스트 파일 세트를 생성하는 파이프라인.
> 논문 요약 품질/스타일 규칙은 `docs/RESEARCH_SUMMARY_RULES.md` 참조.

---

## 입력 / 출력

### 입력
- arXiv 링크 (예: `https://arxiv.org/abs/2505.22159`)

### 출력 (필수)
- `ko.mdx`, `en.mdx`, `cover.webp`

### 출력 (옵션)
- `cover_thumb.webp` (카드 썸네일용, 1:1 크롭)
- `fig-*.png` (본문용 이미지)

### 논문 PDF 보관
- `paper/<slug>.pdf` (`.gitignore` 포함)

---

## 파이프라인

### Step 0) 입력 정규화
- `abs/<id>` / `pdf/<id>.pdf` 모두 허용 → arXiv ID 추출

### Step 1) 메타데이터 수집
- 제목, 저자 목록 (이름+소속), 초록, 카테고리
- v1 제출일 → slug 날짜 (YYMM)
- PDF URL, Project 페이지 URL

### Step 2) PDF 다운로드
- `paper/<slug>.pdf`에 저장

### Step 3) 논문 읽기 및 콘텐츠 추출
- **`docs/RESEARCH_SUMMARY_RULES.md`에 따라** 수행
- 입력: PDF 전문
- 출력: TL;DR, 문제, 핵심 아이디어, 주요 결과, 한계점, 참조논문, card_summary

### Step 4) Cover 이미지 선택 및 다운로드
- 선택 우선순위:
  1. 캡션 키워드: `overview`, `framework`, `pipeline`, `method`, `architecture`
  2. Figure 1 우선 (동점이면 1 > 2 > 3)
  3. 전체 개념 그림 > 세부 그래프/표
  4. 가독성 (너무 작은 텍스트 감점)
- 소스 우선순위: arXiv HTML → 프로젝트 사이트 → placeholder
- 출력: `cover.webp`
- `cover_caption`: 선택한 figure의 원문 캡션 그대로 (번역하지 않음)

### Step 4-1) Cover Thumbnail (선택)
- `cover.webp`에서 핵심 영역을 1:1 크롭 → `cover_thumb.webp`
- 최소 해상도: 192×192px (2× 대응)
- 없으면 `cover.webp`가 center crop으로 대체됨

### Step 5) MDX 파일 생성
- `ko.mdx`: 한국어 요약 본문 + frontmatter
- `en.mdx`: 영어 번역본 (`locale: "en"`, `translation_of: "<slug>:ko"`)
- **MDX body에 Source 블록/참조논문 섹션 작성하지 않음** (frontmatter → 컴포넌트 자동 렌더링)

### Step 6) 검증 + Git push
- `POSTING_WORKFLOW.md` 공통 검증 체크리스트 수행

---

## Frontmatter 스키마

### 필수 키
| 키 | 설명 |
|---|---|
| `post_id` | slug과 동일 |
| `locale` | `"ko"` 또는 `"en"` |
| `title` | 제목 |
| `summary` | 2-3문장 요약 |
| `slug` | 폴더명과 동일 |
| `published_at` | ISO 8601 |
| `updated_at` | ISO 8601 |
| `status` | `"draft"` 또는 `"published"` |
| `content_type` | `"reading"` (참고용; 폴더가 실제 결정) |
| `tags` | 문자열 배열 |
| `cover_image` | `"./cover.webp"` |

### 권장 키
| 키 | 설명 |
|---|---|
| `cover_caption` | 원문 figure 캡션 (번역 안 함) |
| `cover_thumb` | `"./cover_thumb.webp"` |
| `card_summary` | 카드용 짧은 요약 (작성 규칙은 RESEARCH_SUMMARY_RULES.md) |

### Research 전용 키
| 키 | 설명 |
|---|---|
| `source_url` | arXiv abs URL |
| `source_title` | 원문 논문 제목 |
| `source_author` | `"First Author et al."` |
| `source_type` | `"arXiv"` |
| `source_project_url` | 프로젝트 페이지 URL (optional) |
| `source_authors_full` | 전체 저자 목록 (이름+소속, 배열) |
| `references` | 주요 참조논문 배열 (1-3개) |

### 선택 키
- `reading_time_min`, `seo_title`, `seo_description`
- `translation_of`, `translated_to`
- `newsletter_eligible` (`false`, v1 미사용), `featured` (`false`)

---

## UI 렌더링 구조 (참고)

### Source Box (`SourceInfoBlock`)
frontmatter 기반으로 포스트 상단에 자동 렌더링.

### Reference Card (`ReferenceCard`)
frontmatter `references` 기반으로 MDX body 아래에 자동 렌더링.

---

## 검수 체크리스트

- [ ] `ko.mdx`, `en.mdx`, `cover.webp` 생성
- [ ] `cover_thumb.webp` 생성 (선택)
- [ ] `paper/<slug>.pdf` 저장
- [ ] 필수 frontmatter 키 모두 존재
- [ ] `cover_caption`, `card_summary` 작성 (권장)
- [ ] `post_id == slug == 폴더명` 일치
- [ ] `posts/research/<slug>/`에 배치
- [ ] `references` 존재 (1-3개)
- [ ] MDX body에 Source/참조논문 섹션 없음

### 예외 처리
- Figure 추출 실패 → placeholder cover
- 숫자 추출 실패 → `정량 비교 수치 확인 불가` 명시
- arXiv 링크 미확인 → `arxiv_url` 생략, `scholar_url`만 제공
- Project 페이지 미확인 → `source_project_url` 생략
