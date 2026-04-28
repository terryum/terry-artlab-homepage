# Blog Post Generator 스펙 (DEPRECATED)

> ⚠️ **이 문서는 deprecated.** 직접 작성한 글의 발행은 더 이상 이 문서가 아니라 **`/post` 스킬 (terry-obsidian repo canonical)** 을 통해 수행한다.
>
> 이 문서는 옛 IA(Ideas / Research / Essays)를 전제로 작성되어 있어 현재 구조와 모순된다. 자세한 내용은 아래 "현재 구조"를 참조하고, 파이프라인 상세는 `~/Codes/personal/terry-obsidian/.claude/skills/post/SKILL.md` 를 본다.

---

## 현재 구조 (요약)

### 콘텐츠 타입과 폴더

| 타입 | 폴더 | content_type | 노출 탭 | 소스 |
|---|---|---|---|---|
| **Essays** | `posts/essays/<slug>/` | `"essays"` | Essays 탭 (`/posts?tab=essays`) | 직접 작성한 장문 |
| **Memos** | `posts/memos/<slug>/` | `"memos"` | Notes 탭 (`/posts?tab=notes`) | 직접 작성한 단문 메모 |
| **Threads** | `posts/threads/<slug>/` | `"threads"` | Notes 탭 (`/posts?tab=notes`) | ChatGPT 대화 요약 |
| **Papers** | `posts/papers/<slug>/` | `"papers"` | Papers 탭 (`/posts?tab=papers`) | 외부 논문/블로그 요약 (`/paper` 스킬, terry-papers canonical) |

- `publishableTypes` (in `content.config.json`): `["essays", "memos", "threads"]`
- Notes 탭은 `memos` + `threads` 두 content_type 을 `TAB_CONFIG` (in `src/lib/site-config.ts`) 의 `matchTags` 로 자동 병합.
- 모든 포스트 상세는 단일 라우트 `/posts/[slug]` 와 단일 템플릿 `ContentDetailPage` 사용.

### 발행 파이프라인은 `/post` 스킬에서 관리

- Canonical: `terry-obsidian/.claude/skills/post/SKILL.md`
- Obsidian Drafts → 발행 → `posts/{essays,memos,threads}/<slug>/` 디렉터리 생성
- 인덱스 갱신: `node scripts/generate-index.mjs`
- 이미지/썸네일: `node scripts/copy-post-images.mjs`, `node scripts/generate-thumbnails.mjs`
- Obsidian vault 동기화: `node scripts/sync-obsidian.mjs` (`TYPE_TO_FOLDER` 매핑)

### 출력 파일 세트 (참고용)

| 파일 | 필수 | 설명 |
|---|---|---|
| `meta.json` | ✓ | 언어 무관 메타데이터 (post_number, content_type, tags, …) |
| `ko.mdx` | ✓ | 한국어 본문 + frontmatter |
| `en.mdx` | ✓ | 영문 본문 + frontmatter |
| `cover.webp` | ✓ | 커버 이미지 (1200px, WebP q90) |

---

## 잔존 정보 (Papers 와의 차이만 간단히)

- **Papers 전용 필드** (`source_url`, `source_title`, `source_author`, `source_authors_full`, `cover_caption`) 는 essays/memos/threads 에 사용하지 않는다.
- **Threads 전용**: ChatGPT source line (compact) — `source: "chatgpt"`, `source_url`, `source_captured_at`.
- **Essays 메타** `idea_status` 는 `hypothesis | exploring | validated | abandoned | incorporated` 중 하나 또는 `null` (essays 일부에서 사용 중).
