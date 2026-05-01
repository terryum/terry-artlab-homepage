# POSTING_WORKFLOW.md

> 포스트 퍼블리시 흐름 요약. 스킬은 도메인별 다른 repo에서 canonical 로 관리된다.

## 실행 방법

- **Papers (arXiv / 학술 / 블로그 요약)**: `/paper <url>` — canonical: `terry-papers` repo
- **Essays / Notes (직접 작성 또는 ChatGPT 요약)**: `/post --type=essays|notes --from=#-N` — canonical: `terry-obsidian` repo
- **Surveys 책 발행**: `/survey ...` — canonical: `terry-surveys` repo
- **소셜 공유**: `/share <slug-or-id>` — canonical: 이 repo (`terryum-ai`)
- **포스트 삭제**: `/del <slug-or-id>` — canonical: 이 repo

## 공통 규칙

- **slug**: `YYMMDD-<short-name>` (Papers: 발행/제출일, 직접 작성: 작성일)
- **파일**: `posts/<content_type>/<slug>/ko.mdx`, `en.mdx`, `cover.webp`
- **meta.json**: 언어 무관 필드의 single source of truth
- **커밋**: `feat(post): add <slug> (ko/en)` — 콘텐츠와 사이트 기능 변경을 같은 커밋에 섞지 않음
- **인덱스 갱신**: `node scripts/generate-index.mjs`

## 노출 탭 매핑 (`src/lib/site-config.ts` `TAB_CONFIG`)

| content_type | 탭 |
|---|---|
| `essays` | Essays (`/posts?tab=essays`) |
| `papers` | Papers (`/posts?tab=papers`) |
| `notes` | Notes (`/posts?tab=notes`) — 짧은 메모 + ChatGPT 요약(`source: "chatgpt"` 식별) |

Surveys 는 별도 라우트(`/surveys`)이며 위 탭에 포함되지 않는다.
