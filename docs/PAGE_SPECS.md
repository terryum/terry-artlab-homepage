# PAGE_SPECS.md

## 목적
- v1 화면 구현용 페이지/컴포넌트 요구사항 정의
- 정책/라우팅/콘텐츠모델 상세는 다른 문서 참조

## 공통 규칙 (모든 페이지)
- 모바일 우선 반응형
- 상단 네비: Home / Essays / Surveys / Papers / Notes / About (PC/모바일 동일)
- 언어 스위처: 원형 버튼 (KO / EN)
- 테마 토글: 원형 버튼 (라이트/다크 전환, localStorage 저장, 시스템 프리퍼런스 fallback)
- 외부 링크 새 탭 열기
- 더미 개발 모드 지원 (더미 카드/더미 상세)

## 핵심 구조 원칙 (중요)
- 모든 포스트 타입(Essays / Papers / Notes의 memos·threads)은 **동일한 정보 구조/레이아웃** 을 사용한다.
- 목록은 `/posts?tab=...` 탭 필터 한 종류만 사용한다 (`TAB_CONFIG` in `src/lib/site-config.ts`).
- 상세는 `/posts/[slug]` 단일 템플릿을 사용한다 (`ContentDetailPage`).
- 차이는 표시 필드만 분기한다 (예: Papers의 출처 배지, Threads의 ChatGPT source line).
- Surveys는 별도 라우트(`/surveys`, `/surveys/[slug]`)를 사용하지만 시각 언어는 공통 유지.
- 목적: 유지보수 단순화 + 독자 읽기 경험 일관성 확보

## 1) Home
### 섹션 구성 (위→아래)
1. Hero / Intro (이름, 소개, 프로필 사진, 소셜 아이콘)
2. Latest Essays (카드 3개 + View all → `/posts?tab=essays`)
3. Recent Papers (카드 3개 + View all → `/posts?tab=papers`)
4. Latest Notes (카드 3개 + View all → `/posts?tab=notes`)
5. Surveys 갤러리 (카드 + View all → `/surveys`)
6. Footer

## 2) Posts Index Template (공용 — Essays / Papers / Notes 탭)

### 공용 레이아웃
- 탭 헤더 (Essays · Papers · Notes)
- 페이지/탭 소개 문구 (`tabs_index.<slug>.description` from dictionaries)
- 카드 리스트(최신순)
- 페이지네이션 또는 Load more (v1 단순 리스트 가능)
- TagFilterBar (탭 태그는 자동 숨김 — `TAB_TAG_SLUGS`)

### 공용 카드 필드 (기본)
- 썸네일(cover.webp)
- 제목
- 요약
- 발행일
- 태그(최대 3개)
- 카드 전체 클릭 가능

### 탭별 차이 (목록)
- **Essays**: 기본 카드 사용
- **Papers**: 기본 카드 + 출처 배지(arXiv 등) + 원문 링크 아이콘(선택)
- **Notes**: 기본 카드 (memos/threads 모두 동일 카드, threads는 ChatGPT source 메타 표시)

## 3) Posts Detail Template (공용 — `/posts/[slug]`)

### 공용 레이아웃 (위→아래)
1. 헤더 메타 영역 (제목, 발행일, 태그, 언어 전환 링크)
2. 커버 이미지 (있을 때)
3. 본문(MDX 렌더링)
4. 본문 이미지/캡션
5. 하단 내비게이션 (이전/다음, 선택)
6. 하단 CTA (다른 탭/About 링크)

### 타입별 차이 (상세)
- **Essays**: 공용 레이아웃 그대로 사용
- **Papers**: 공용 레이아웃 + 상단 원문 정보 블록 추가
  - arXiv/원문 링크
  - 원문 제목(선택)
  - 저자/출처(선택)
- **Memos**: 공용 레이아웃 그대로 사용 (Notes 탭으로 노출)
- **Threads**: 공용 레이아웃 + ChatGPT source line (compact)

## 4) Surveys
### 목록 (`/surveys`)
- 갤러리 형태 (커버 + 제목 + 짧은 설명)
- 외부 책 URL로 직접 연결되는 카드도 허용

### 상세 (`/surveys/[slug]`)
- Survey 메타 + 책 표지
- 외부 빌드된 책 사이트로 진입하는 CTA

## 5) About
### 섹션 구성
1. Bio (짧은 소개)
2. 상세 Bio / Career Highlights (선택)
3. Contact (이메일/소셜)
4. 프로필 사진
5. Around the Web (Books / 대표 Papers (Research 섹션) / Code)

## 공통 컴포넌트 사양 (v1)
- Header/Nav
- ThemeToggle (다크/라이트 전환 원형 버튼)
- LanguageSwitcher (한/영 전환 원형 버튼)
- ProfileIntroBlock
- ContentIndexPage (공용 템플릿 — `/posts` 탭 페이지)
- ContentDetailPage (공용 템플릿 — `/posts/[slug]`)
- ContentCard (공용 카드 + source badge 옵션)
- SourceBadge / ExternalSourceLink (Papers/Threads 옵션)
- TagChip
- Footer

## 더미 콘텐츠 개발 규칙 (초기 개발용)
- 각 탭(Essays / Papers / Notes) 더미 카드 최소 4개
- 각 타입별 더미 상세 포스트 1개 (essays / papers / memos / threads)
- 모든 탭이 동일 템플릿에 더미 데이터만 연결해 UI 검증

## 비범위 (v1 제외)
- 사이트 내 검색
- 댓글 시스템 외 정교한 토론 기능
- Substack 직접 연동 UI
- 고급 태그/카테고리 페이지
- 유료 구독/멤버십
- Newsletter 구독 블록
