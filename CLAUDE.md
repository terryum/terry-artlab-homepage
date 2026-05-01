# CLAUDE.md

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Mention unrelated dead code; don't delete it.
- Remove imports/variables your changes orphaned.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

- "Add validation" → write tests for invalid inputs, then make them pass.
- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Refactor X" → ensure tests pass before and after.

For multi-step tasks, state a brief plan with verifiable checks per step.

---

## Workspace: terryum-ai (homepage code + infra)

Homepage code, infra, knowledge-system code. Canonical for: `/project`, `/share`, `/del`, `/infra-optimize`, `/defuddle`, `/paper-search`. Other content skills are canonical in their domain repo and symlinked here (rule: `docs/SKILLS_MANAGEMENT.md`).

### Sibling workspaces
- `terry-obsidian` — Obsidian ops + essays/notes. **`/post` canonical.**
- `terry-surveys` — survey content + `surveys.json`. **`/survey` canonical.**
- `terry-papers` — paper/journal/blog summaries + KG. **`/paper` canonical** (+ `POST_LOADING_*`, `PAPERS_SUMMARY_RULES.md`, `POST_GENERATOR_PAPERS.md`).

### Read order on session start
`CLAUDE.md` → `docs/CURRENT_STATUS.md` → only the `docs/*.md` relevant to the current task.

### v1 scope (absolute)
v1 = own site only. Newsletter/Substack = v2. No heavy CMS or backend complexity in v1.

### Implementation rules
- `Ideas` and `Papers` share a template (`/posts?tab=ideas`, `/posts?tab=papers`); only minimal field deltas (e.g., Papers' arXiv link/source).
- i18n routing/fallback: see `docs/I18N_ROUTING.md`. A change to KO **or** EN content must be applied to **both**.
- Reuse first; flag duplicates and refactor per `docs/REFACTOR_PRINCIPAL.md`.
- Content layout: `posts/{research,idea}/<slug>/{ko,en}.mdx`, `cover.webp`. `meta.json` is optional in v1.
- Bulk rename/move/format-conversion: backup branch + separate commit + verification.

### Infra/deploy
- Cloudflare (DNS / CDN / Workers / Pages / R2) + GitHub. No Vercel.
- Local dev port: 3040–3049.
- After file moves / route changes: `rm -rf .next` before next build.
- Concurrent push from sibling workspaces: always `git pull --rebase origin main` first. Shared files (`posts/index.json`, `surveys.json`) resolve via rebase.

### Git
- Don't mix content publish + site code in one commit.
- `git diff` before push.
- Halt automation that touches existing content unexpectedly.

### Session end
Update `docs/CURRENT_STATUS.md` (overwrite, never append).

### Forbidden
Doc-spec-ignoring restructures, deploy/infra changes without tests, v1-out-of-scope features, secrets in code/docs/commits.
