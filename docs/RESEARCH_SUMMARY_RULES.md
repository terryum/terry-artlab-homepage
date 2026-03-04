# Research Post 요약 규칙

> 이 파일은 논문을 어떻게 읽고 요약하는가에 대한 규칙을 정의한다.
> 포스팅의 톤, 깊이, 섹션 구조를 조정하려면 이 파일만 수정하면 된다.
> 기술적 구현 스펙은 `docs/POST_GENERATOR_RESEARCH.md` 참조.

---

## 핵심 원칙

1. **요약 생성 전에 구조화 추출 먼저**
   - 메타데이터, 섹션, figure/caption, 결과 숫자 후보를 먼저 추출하고, 그 후 요약 생성
2. **근거 기반 요약**
   - 결과 숫자(1~3개)는 표/본문/캡션에서 확인된 수치만 사용
   - 불확실하면 `확인 불가` 또는 `추정` 명시
3. **허위 수치 생성 절대 금지**
   - 검증되지 않은 숫자, 단위/metric 불명확한 수치의 단정적 사용 금지

---

## MDX 본문 섹션 구조

아래 섹션 순서를 기본값으로 한다. **Source 블록과 주요 참조 논문은 frontmatter에서 컴포넌트가 자동 렌더링하므로 MDX body에 작성하지 않는다.**

### 1. TL;DR (1-2문장)
- 전체 내용 생성 후 최종 압축 요약
- **문제와 해결의 key insight** 위주로 짧게
- 구체적인 숫자 불필요
- 예: "VLA 모델에 힘 감지가 빠져있어 접촉이 많은 조작에서 한계를 보이는 문제를, MoE 기반 힘-비전-언어 융합으로 해결했다."

### 2. 문제 (Problem / Why now?)
- 기존 문제 / 연구적 한계
- 왜 지금 중요한지
- 본 논문이 해결하려는 문제 정의

### 3. 핵심 아이디어 (Key Idea)
- 기존 방법 대비 차별점이 드러나는 1~2문장으로 시작
- 핵심 구성 요소를 bullet point로 나열

### 4. 주요 결과 (숫자 1~3개)
- 가장 중요한 정량 결과를 숫자로 제시
- 비교 대상(baseline)과 함께 표기
- 수치 출처를 본문/표/캡션에서 확인

### 5. 한계점
두 부분으로 나누어 작성:
- **저자가 언급한 한계점** (future work / discussion 등 기반)
- **AI 분석 한계점** (구현/재현성/범용성/데이터 편향 등, 추론임을 명시)

### 6. Terry's memo
- 기본값 비워두기 (`{/* empty */}`) — MDX에서는 `<!-- -->` 대신 `{/* */}` 주석 사용
- 사용자가 나중에 직접 작성

---

## 주요 결과 추출 규칙

### 우선순위 소스
1. 결과 표(Table) 캡션 + 표 본문
2. 실험 결과 문단
3. 그림 캡션 (정량 결과가 있는 경우)
4. Abstract의 숫자 (보조용)

### 출력 형식 예시
- `Task X에서 성공률 68.2% → 79.4% (+11.2%p), baseline Y 대비 향상`
- `Inference latency 120ms, prior method 대비 2.1× faster`

---

## 한계점 작성 규칙

### A. 저자가 언급한 한계점
- `Limitations`, `Discussion`, `Future Work`, `Conclusion`에 근거

### B. AI 분석 한계점
아래 관점에서만 추론하고, **추론임을 명시** (예: "(추론)" 표기):
- 재현성 (코드/하이퍼파라미터/실험 세부조건 부족)
- 범용성 (단일 환경/단일 로봇/데이터 편향)
- 실제 적용성 (센서/비용/실시간성/안전성)
- 비교 공정성 (baseline 수/튜닝 수준)

---

## 주요 참조 논문 선택 규칙 (1-3개)

### 선택 기준
- 본문에서 자주 언급된 비교 대상
- 핵심 베이스라인/직전 SOTA
- 방법론적으로 직접적인 선행연구

### frontmatter 필수 필드
- `title` — 논문 제목
- `author` — `"First Author et al. (YYYY)"` 형식
- `description` — 한줄 설명 (ko/en 각각 해당 언어로)
- `arxiv_url` — arXiv 링크 (확인 가능한 경우)
- `scholar_url` — Google Scholar 제목 기반 검색 URL

---

## 본문 이미지 규칙 (`fig-*.png`)

### 후보 우선순위
- 로봇 실제 실험 장면(실사진)
- 추가 overview / 시스템 구성 이미지
- qualitative results (성공/실패 예시)

### 개수 (권장)
- 1~3개

### 파일명 규칙
- `fig-1.png`, `fig-2.png`, `fig-3.png`

---

## `card_summary` 작성 규칙

- 목록 카드에 표시되는 짧은 요약 (summary의 축약 버전)
- 카드 line-clamp: 모바일 4줄 / 데스크톱 3줄
- **ko**: 85-100자 (모바일 4줄 이내 기준)
- **en**: 150-180자 (모바일 4줄 이내 기준)
- 핵심 문제 + 핵심 해결 방법 + 대표 수치 1개 포함
- 예시 (ko): `"시각·언어에만 의존하던 VLA 모델에 6축 힘-토크 피드백을 MoE로 융합하여, 접촉이 잦은 5가지 로봇 조작에서 기존 대비 평균 23.2%p 성능 향상을 달성했다."`
- 예시 (en): `"VLA models struggle with contact-heavy tasks due to missing force feedback. ForceVLA fuses 6-axis force-torque sensing via MoE, achieving 23.2%p avg. gain on five manipulation tasks."`

---

## Cover 이미지 규칙

### 상세 페이지 (`cover_image`)
- 원본 비율 유지 (crop 없음)
- max-height 384px 제한, 가로는 콘텐츠 영역에 맞춤
- `cover_caption`: 선택한 figure의 원문 캡션을 그대로 사용 (**번역하지 않음**)

### 카드 썸네일 (`cover_thumb`)
- `cover_thumb.webp`: 1:1 크롭, 최소 192×192px
- 텍스트가 아닌 다이어그램/그림 중심 부분을 선택
- 없으면 `cover_image`가 center crop으로 대체

---

## 한국어/영어 작성 원칙

- 제목/고유명사/기술 용어는 원문 유지 우선
- summary/섹션 설명만 자연스럽게 해당 언어로 작성
- en.mdx의 `references` → `description`도 영어로 작성
