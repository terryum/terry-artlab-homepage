# POSTING_WORKFLOW.md

> 포스트를 퍼블리시하는 전체 흐름을 정의하는 라우팅 문서.
> 각 탭별 상세 스펙은 전용 Generator 문서를 참조한다.

---

## Research 탭 퍼블리시

1. 사용자가 **arXiv 링크**를 Claude Code에 전달
2. Claude Code가 `docs/POST_GENERATOR_RESEARCH.md`에 따라 자동 생성
   - 논문 읽기 + 요약 규칙: `docs/RESEARCH_SUMMARY_RULES.md`
3. 출력: `posts/research/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
4. 로컬 검증 후 Git push → Vercel 자동 배포

## Ideas 탭 퍼블리시

1. 사용자가 **Google Doc 또는 .md 파일**을 Claude Code에 전달
2. Claude Code가 `docs/POST_GENERATOR_IDEAS.md`에 따라 자동 생성 (예정)
   - 한국어 원문 → 영어 번역, cover/태그/메타데이터 자동 생성
3. 출력: `posts/idea/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
4. 로컬 검증 후 Git push → Vercel 자동 배포

> **참고**: `POST_GENERATOR_IDEAS.md`는 아직 미작성. 첫 Ideas 포스트 작성 시점에 스펙을 확정할 예정.

---

## 공통 규칙

### 디렉토리 구조
```text
posts/
  research/<slug>/   ← content_type: reading
  idea/<slug>/       ← content_type: writing
```
- **폴더가 content_type의 source of truth** (`src/lib/posts.ts`가 자동 판별)
- `post_id == slug == 폴더명` (항상 동일)

### slug 규칙
- 형식: `YYMM-<short-name>-<additional-context>`
- Research: arXiv v1 제출일 기준 / Ideas: 작성일 기준

### 파일명 규칙
- 모두 소문자 + 하이픈: `cover.webp`, `cover_thumb.webp`, `fig-1.png`
- 사용자가 임의 파일명 첨부 시 퍼블리시 단계에서 자동 정규화 + 본문 경로 치환

### 로컬 검증 (푸시 전)
- [ ] `ko.mdx`, `en.mdx` 모두 존재
- [ ] 필수 frontmatter 키 존재, ko/en 공통 필드 정합
- [ ] 본문 이미지 경로가 실제 파일과 일치
- [ ] `cover.webp` 존재
- [ ] `npm run build` 성공

### Git 커밋 규칙
- 신규 포스트: `feat(post): add <slug> (ko/en)`
- 포스트 수정: `chore(post): update <slug>`
- **콘텐츠 변경과 사이트 기능 변경을 같은 커밋에 섞지 않는다**

### 역할 분담
- **사용자**: 원고/링크 준비, 퍼블리시 요청, 최종 검토
- **Claude Code**: 요약/번역, 메타/커버 생성, 이미지 정규화, 파일 생성, Git 푸시
