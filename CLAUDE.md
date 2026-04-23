# CLAUDE.md

## 워크스페이스 역할 분리
- **이 폴더 (terryum-ai)**: 홈페이지 코드/기능 개발, 인프라, 지식시스템 코딩. 공유 스킬 canonical: `/project`, `/share`, `/del`, `/infra-optimize`, `/defuddle`, `/paper-search`
- **terry-obsidian**: Obsidian 운영 + 직접 초안 발행(essays/memos/threads). **`/post` 스킬 canonical** (여기서 유지관리). Obsidian 스킬도 이쪽
- **terry-surveys**: Survey 콘텐츠 생성/수정 + 홈페이지 surveys.json 업데이트. **`/survey` 스킬 canonical**
- **terry-papers**: 외부 논문·학술지·블로그 요약 + 지식그래프. **`/paper` 스킬 canonical** + 관련 docs(`POST_LOADING_*`, `PAPERS_SUMMARY_RULES.md`, `POST_GENERATOR_PAPERS.md`)
- 콘텐츠 스킬은 각 도메인 repo에서 canonical로 유지, 다른 repo에서는 심링크로 참조 (원칙: `docs/SKILLS_MANAGEMENT.md`)

### 동시 작업 시 충돌 방지
- 다른 워크스페이스에서 이 repo에 push할 때는 반드시 `git pull --rebase origin main` 후 push
- surveys.json, posts/index.json 등 공유 파일은 동시 수정 시 rebase로 해결

## 시작 순서
`CLAUDE.md` → `docs/CURRENT_STATUS.md` → 현재 작업 관련 `docs/*.md`만 읽기

## Papers 포스팅 fast path
- arXiv/학술지/블로그 요약: `/paper` 스킬(terry-papers canonical) 사용
- 규칙 변경 시: `~/Codes/personal/terry-papers/docs/PAPERS_SUMMARY_RULES.md` 참조
- 로딩 세부사항: arXiv → `~/Codes/personal/terry-papers/docs/POST_LOADING_ARXIV.md` / 비-arXiv → `~/Codes/personal/terry-papers/docs/POST_LOADING_ETC.md` / 블로그 → `~/Codes/personal/terry-papers/docs/POST_LOADING_BLOG.md`

## v1 범위 (절대)
- v1은 **자체사이트만 개발**
- **뉴스레터/Substack 기능은 v2** (v1에 구현하지 않음)
- 과도한 CMS/복잡한 백엔드 기능은 v1에 넣지 않음

## 구현 절대 규칙
- `Ideas` / `Papers`는 **공용 템플릿**으로 구현 (경로: `/posts?tab=ideas`, `/posts?tab=papers`)
- 차이는 최소 필드만 허용 (예: Papers의 arXiv 원문 링크/출처)
- i18n 라우팅/fallback은 `docs/I18N_ROUTING.md` 기준으로 구현
- **하드코딩 자제**: 비슷한 구조의 코드/콘텐츠는 최대한 재사용하여 구현하고, 중복이 발견되면 리팩토링을 제안할 것
- 리팩토링 원칙은 `docs/REFACTOR_PRINCIPAL.md` 참조

## i18n 콘텐츠 규칙
- 한글 또는 영어 중 하나의 콘텐츠 변경을 요청받으면 **양쪽 언어 모두** 반영할 것

## 콘텐츠/자동화 규칙
- 콘텐츠 구조 기준: `posts/{research,idea}/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
- 퍼블리시 시 이미지 파일명 자동 정규화 가능 (반드시 본문 경로 치환까지 완료)
- `meta.json`은 v1 optional (없으면 frontmatter 기준)
- 콘텐츠 삭제/대량 변경은 기본 금지, 필요 시 분리 커밋 + 검증 후 진행
- 대량 리네임/이동/포맷변환은 백업 브랜치/분리 커밋으로 수행
- 퍼블리시 자동화는 기존 포스트 덮어쓰기 전 변경 요약(diff) 확인

## 인프라/배포 규칙
- 인프라 고정: **Cloudflare(도메인/DNS/CDN/Workers/Pages/R2) + GitHub**
- 시크릿/토큰 하드코딩 금지 (`.env.example`만 생성)
- 핵심 테스트/검증 실패 시 배포 금지
- 로컬 개발 서버 포트: **3040~3049** 사용 (`next dev -p 3040`)
- **`.next` 캐시**: 파일 이동/이름 변경/라우트 구조 변경 후 반드시 `rm -rf .next` 실행

## Git 규칙
- 콘텐츠 발행 변경과 사이트 기능 변경을 같은 커밋/PR에 섞지 않기
- 푸시 전 `git diff`로 변경 범위 확인
- 자동화가 기존 콘텐츠를 예상 밖으로 변경하면 중단 후 확인

## 세션 종료
`docs/CURRENT_STATUS.md`만 짧게 갱신 (append 금지, 항상 덮어쓰기)

## 금지사항
- 문서 스펙 무시 후 임의 구조 변경
- 테스트 없이 배포/인프라 변경
- v1 범위를 넘는 기능 추가
- 시크릿/개인정보를 코드/문서/커밋에 기록
