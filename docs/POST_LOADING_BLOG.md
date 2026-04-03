# Research Post — 블로그 소스 로딩 가이드

> 기술 블로그 URL에서 Research 포스트를 생성할 때의 절차를 정리한다.
> 공통 파이프라인/스키마/MDX 구조는 arXiv/학술 저널과 동일하다.
> arXiv 전용: `docs/POST_LOADING_ARXIV.md` / 학술 저널: `docs/POST_LOADING_ETC.md`
> 요약 품질/톤 규칙은 `docs/RESEARCH_SUMMARY_RULES.md` 참조.

---

## 블로그 vs arXiv 차이점

| 항목 | arXiv | 블로그 |
|---|---|---|
| `source_type` | `"arXiv"` | 사이트명 (예: `"Generalist AI Blog"`, `"Anthropic Blog"`) |
| PDF | ✓ 자동 다운로드 | ✗ 없음 |
| 콘텐츠 수집 | arXiv API + HTML | WebFetch로 HTML 수집 |
| Figure 추출 | arXiv HTML/PDF | HTML `<img>` 태그에서 다운로드 |
| Video | ✗ 거의 없음 | ✓ 흔함 → `<Video>` 컴포넌트 사용 |
| slug 날짜 | arXiv v1 제출일 | 블로그 발행일 |
| `source_date` | arXiv v1 제출일 | 블로그 발행일 |
| 메타데이터 | arXiv API | OG tags + HTML meta tags |
| 구체적 방법 섹션 | ✓ 필수 | △ 선택 (기술적 디테일 있을 때만) |
| `source_project_url` | GitHub 등 | 블로그 원문 URL과 동일할 수 있음 |

---

## 블로그 파이프라인 절차

### 1) URL 입력 및 판별
- 입력: `/post <blog-url> [--tags=TAG1,TAG2] [--memo=메모]`
- URL이 `arxiv.org`도 아니고 학술 저널(nature.com, ieee.org 등)도 아닌 경우 → 블로그로 판별

### 2) 메타데이터 수집
WebFetch로 HTML을 가져온 후:
- `<meta property="og:title">` → 제목
- `<meta property="og:description">` → 요약
- `<meta property="og:image">` → 커버 이미지 후보
- `<meta property="article:published_time">` 또는 `<time>` → 발행일
- `<meta name="author">` 또는 byline → 저자
- 사이트명: `<meta property="og:site_name">` 또는 도메인에서 추출

### 3) Figure/Video 추출
- HTML에서 `<img>` 태그 수집 → 유의미한 이미지만 선별 (아이콘/로고 제외)
- HTML에서 `<video>`, `<iframe src="youtube...">` 수집 → Video 임베딩 후보
- 이미지 다운로드: `posts/papers/<slug>/fig-N.{ext}`
- 비디오: 다운로드 대신 URL을 MDX에 `<Video src="..." />` 로 임베딩

### 4) slug 생성
- `YYMM-<short-name>` 형식 (발행 월 기준)
- 예: `2511-gen0-embodied-foundation-model`, `2604-harnessing-claude-intelligence`

### 5) source_type 결정
- 사이트명 또는 도메인 기반
- 예: `"Generalist AI Blog"`, `"Anthropic Blog"`, `"Google DeepMind Blog"`
- 사용자가 직접 지정할 수도 있음

### 6) MDX 작성
arXiv와 동일한 구조이되, 블로그 특성 반영:
- **TL;DR**: 1-2문장
- **문제**: 기존 한계 또는 동기
- **핵심 아이디어**: 주요 기여 + Figure
- **구체적 방법**: 기술 디테일이 있을 때만 (Collapsible). 없으면 생략
- **주요 결과**: 정량적 결과 또는 주요 성과
- **달성점과 한계점**: 성과 + 제한점 (🤖 AI 분석 포함)
- **Terry's memo**: 선택
- **Video**: 블로그에 영상이 있으면 `<Video src="..." caption="..." />` 삽입

### 7) Video 사용법
MDX에서:
```mdx
<Video src="https://www.youtube.com/watch?v=XXXXX" caption="데모 영상: 장기 작업 수행" />
```
- YouTube, Vimeo URL → 자동으로 embed iframe 변환
- 직접 비디오 URL → `<video>` 태그 렌더링
- `type` prop으로 강제 지정 가능: `type="youtube"`, `type="vimeo"`, `type="direct"`

---

## meta.json 필드

블로그 소스의 meta.json은 arXiv와 동일한 스키마이지만 아래 필드가 다르다:

```json
{
  "source_type": "Generalist AI Blog",
  "source_url": "https://generalistai.com/blog/...",
  "source_title": "GEN-0: Embodied Foundation Models...",
  "source_author": "Generalist AI Team",
  "source_date": "2025-11-04T00:00:00Z",
  "source_project_url": null,
  "google_scholar_url": null
}
```

- `source_project_url`: 프로젝트 페이지가 별도로 있으면 기입
- `google_scholar_url`: 블로그는 대부분 null
- PDF 관련 필드 없음 (paper/ 디렉토리 불필요)
