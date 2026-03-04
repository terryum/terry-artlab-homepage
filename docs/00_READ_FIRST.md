# 00_READ_FIRST.md

## 목적
- 이 폴더 문서를 **전부 읽지 않고**, 작업에 필요한 문서만 골라 읽기 위한 안내 파일
- 절대 규칙은 루트 `CLAUDE.md`에 있다. 이 파일은 **목차/우선순위만** 담는다.

## 기본 읽기 순서 (항상)
1. `CLAUDE.md` (루트, 절대 규칙)
2. `docs/00_READ_FIRST.md` (이 파일)
3. `docs/CURRENT_STATUS.md` (현재 스냅샷)
4. 작업 유형에 맞는 문서만 추가로 읽기

## 문서 중요도
### P0 (항상 우선)
- `CURRENT_STATUS.md`
- `PRD.md`

### P1 (작업별 핵심)
- `SITEMAP_IA.md` (정보구조/경로)
- `PAGE_SPECS.md` (화면 요구사항)
- `I18N_ROUTING.md` (언어 라우팅)
- `POSTING_WORKFLOW.md` (발행 절차 + 콘텐츠 구조)
- `TECH_ARCHITECTURE.md` (배포/인프라)
- `DESIGN_SYSTEM.md` (디자인 톤/규칙)
- `POST_GENERATOR_RESEARCH.md` (Research 포스트 생성 파이프라인)
- `RESEARCH_SUMMARY_RULES.md` (논문 요약 품질 규칙)

### P2 (필요 시에만)
- `QA_CHECKLIST.md` (검증 체크리스트)
- `DISCOVERABILITY_ANALYTICS.md` (SEO/OG/분석 — 해당 작업 시에만 읽기)

## 작업 유형별 추천 읽기 순서
- UI/페이지 구현: `PRD` → `SITEMAP_IA` → `PAGE_SPECS` → `DESIGN_SYSTEM`
- 다국어 라우팅: `PRD` → `I18N_ROUTING` → `SITEMAP_IA` → `PAGE_SPECS`
- 콘텐츠 파이프라인: `POSTING_WORKFLOW` → `POST_GENERATOR_RESEARCH` / `RESEARCH_SUMMARY_RULES` → `QA_CHECKLIST`
- 배포/CI/인프라: `TECH_ARCHITECTURE` → `QA_CHECKLIST`
- SEO/OG/분석: `DISCOVERABILITY_ANALYTICS` → `TECH_ARCHITECTURE`

## 세션 시작/종료 최소 루틴
- 시작: `CURRENT_STATUS.md` 최신 여부 확인 후 작업 문서만 선별
- 종료: `CURRENT_STATUS.md`만 짧게 갱신 (길어지면 즉시 축약)
