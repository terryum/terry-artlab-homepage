# NEXT_SESSION_PLAN.md

> 작성: 2026-04-25 KST. **/clear 직후 새 세션에서 이 문서를 읽고 Phase 1 → Phase 2 순서대로 진행.**
> 모든 단계 완료 시 이 파일은 `git rm` 으로 삭제.

## 환경 사전 준비 (모든 R2 작업 전에)

```bash
# 셸에 옛 R2 export 가 남아있을 수 있음 — 반드시 unset 후 .env.local 로딩
unset R2_BUCKET_NAME R2_PUBLIC_URL R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PRIVATE_BUCKET
set -a; source .env.local; set +a
echo "R2_ACCOUNT_ID=$R2_ACCOUNT_ID  bucket=$R2_BUCKET_NAME"  # 확인
```

`.env.local` 에 `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` 있음 (이번 세션에 확인됨).

**Git push 정책:** harness 가 main 직접 push 를 차단하므로 모든 commit 은 만들어주되 push 는 사용자가 `! git push origin main` 으로 직접 실행.

---

## Phase 1 — ISR cache stale 사고 처리 (긴급)

### 배경
이번에 `commit e204a64` 로 6개 포스트의 cover/figure 자산을 `-v2` 키로 우회 처리했지만, OpenNext ISR cache 가 R2 `terryum-ai-cache` 버킷의 `incremental-cache/<buildId>/<sha256>.cache` 에 옛 데이터를 박제. `https://www.terryum.ai/en` 등 일부 라우트가 여전히 옛 `cover.webp` 서빙 중 (`x-nextjs-cache: HIT`).

**영향 슬러그 (5개):**
- `2407-tactile-skin-inhand-translation`
- `2505-dexumi`
- `260310-on-the-manifold-first-post`
- `2604-harnessing-claude-intelligence` (cover + fig-1 둘 다)
- `2505-forcevla-force-aware-moe`

**현재 prod build id:** `45MhlY2KmupPQi_KCs_kg` (HTML 코멘트 `<!--45MhlY2KmupPQi_KCs_kg-->` 에서 확인). **단계 1-1 첫 줄에서 다시 확인할 것 — 그동안 새 deploy 가 일어났을 수 있음.**

**진단 도구 (이미 존재):**
- `scripts/_tmp-list-cache.mjs` — R2 list
- `scripts/_tmp-diag-cache.mjs` — cache 내용 sample 확인

이미 진단 끝남: 154 cache 항목 중 본문 페이지 cache 는 `cover-v2.webp` 정상 ✅, 다른 페이지가 2407 을 related-posts/카드로 참조하는 cache 만 옛 `cover.webp` ❌.

---

### 1차 — prod ISR cache 강제 invalidate (옵션 A: 일괄)

**의도:** 현재 build prefix 154개 일괄 삭제. 다음 요청에서 ISR 자동 재생성. 첫 hit 만 살짝 느림.

#### 단계
```bash
# 1) 현재 prod build id 재확인 (deploy 일어났으면 prefix 갱신)
CURRENT_BUILD=$(curl -s "https://www.terryum.ai/en" | grep -oE '<!--[A-Za-z0-9_-]{15,}-->' | head -1 | sed 's/<!--//; s/-->//')
echo "Current build: $CURRENT_BUILD"

# 그리고 wrangler 확인
wrangler deployments list 2>&1 | head -10

# 2) 해당 prefix 객체 일괄 삭제
PREFIX="incremental-cache/${CURRENT_BUILD}/"
node scripts/_tmp-list-cache.mjs "$PREFIX" > /tmp/keys.txt
wc -l /tmp/keys.txt  # 154 정도 기대

# wrangler 로 일괄 삭제 (또는 S3 SDK DeleteObjects 1000 배치)
while IFS= read -r key; do
  wrangler r2 object delete "terryum-ai-cache/${key}" --remote
done < /tmp/keys.txt
```

#### 검증
```bash
# cache busting 으로 fresh request → 어떤 자산이 박혀있는지 확인
curl -sL "https://www.terryum.ai/en?_cb=$(date +%s)" \
  | grep -oE 'r2\.dev/posts/2407-tactile-skin-inhand-translation/[a-z0-9.-]+\.(webp|png)' | sort -u
# 기대: cover-v2.webp, cover-thumb-v2.webp 만 (cover.webp 없음)

# 다른 영향 슬러그 4개도 같은 방식으로
for slug in 2505-dexumi 260310-on-the-manifold-first-post 2604-harnessing-claude-intelligence 2505-forcevla-force-aware-moe; do
  echo "=== $slug ==="
  curl -sL "https://www.terryum.ai/en?_cb=$(date +%s)" \
    | grep -oE "r2\\.dev/posts/${slug}/[a-z0-9.-]+\\.(webp|png)" | sort -u
done

# 2604 fig-1 도 따로 확인
curl -sL "https://www.terryum.ai/en/posts/2604-harnessing-claude-intelligence?_cb=$(date +%s)" \
  | grep -oE 'r2\.dev/posts/2604-harnessing-claude-intelligence/[a-z0-9.-]+\.(webp|png)' | sort -u

# x-nextjs-cache 동작 확인
curl -sI "https://www.terryum.ai/en?_cb=A" | grep -i "x-nextjs-cache"  # MISS 또는 STALE
curl -sI "https://www.terryum.ai/en?_cb=A" | grep -i "x-nextjs-cache"  # HIT (재생성 후)
```

**예상 소요:** 5-10분.

---

### 2차 — 영구 처치 (재발 방지)

**문제:** R2 cache 버킷에 **약 50개 buildId prefix 누적, ~7570 객체**. OpenNext 가 deploy 후 옛 prefix 자동 정리 안 함. 새 stale cache 가 또 생기면 매번 수동 처치 필요.

#### 2-1. R2 cache GC 스크립트 작성

`scripts/r2-cache-gc.mjs` 신규 — 영구 스크립트:
- ListObjectsV2 prefix=`incremental-cache/` delimiter=`/` → CommonPrefixes 로 buildId 목록
- 각 buildId 의 객체 중 LastModified 최댓값 기준으로 정렬
- 가장 최근 N개 (default 3) 만 보존, 나머지 prefix 의 모든 객체 일괄 삭제
- 옵션: `--keep <N>`, `--dry-run`, `--apply`
- AWS S3 SDK 사용 (`@aws-sdk/client-s3` 이미 deps 에 있음)
- DeleteObjects 1000개씩 배치

```bash
# 검증 단계
node scripts/r2-cache-gc.mjs --dry-run --keep 3
# 출력 예: "Would delete: 47 buildId prefixes, ~7400 objects"

node scripts/r2-cache-gc.mjs --apply --keep 3
# 출력 예: "Deleted 47 buildId prefixes, 7400 objects in 14s"

# 결과 확인
node scripts/r2-cache-gc.mjs --dry-run --keep 3  # 다시 돌려서 0 buildId 삭제 예정 보여야
```

#### 2-2. deploy 후 자동 GC hook

`.github/workflows/deploy.yml` 의 deploy 단계 **다음에** 추가:

```yaml
- name: GC stale ISR cache buildIds (keep last 3)
  env:
    R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
    R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
    R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
  run: node scripts/r2-cache-gc.mjs --apply --keep 3
```

이 step 은 deploy 가 success 일 때만 도는 위치에 둘 것 (continue-on-error: true 로 GC 실패가 deploy 를 fail 시키지 않게).

#### 2-3. 옵션: OpenNext 자체 옵션 확인

`@opennextjs/cloudflare` 1.11+ 가 deploy 시 옛 buildId cache 자동 invalidate 옵션을 내장했는지 릴리즈노트 확인. 있으면 GC 스크립트 대신 (또는 보완으로) 옵션 활성화.

확인처:
- https://github.com/opennextjs/opennextjs-cloudflare/releases
- `open-next.config.ts` 에서 `incrementalCache` 관련 옵션

**예상 소요:** 30-60분 (GC 스크립트 + workflow + 검증 + 옵션 확인).

---

### 3차 — 정리

#### 3-1. 임시 스크립트 처리
```bash
# 결정: r2-cache-gc.mjs 가 _tmp-list-cache 의 기능 흡수했으면 삭제
rm scripts/_tmp-list-cache.mjs scripts/_tmp-diag-cache.mjs
# .gitignore 에 scripts/_* 패턴 이미 있어 이 두 파일은 어차피 untracked
```

#### 3-2. 미커밋 변경 처리 (이번 사고와 무관)
이번 세션 중에는 다음 파일들이 stash pop 됐었으나 모두 커밋함:
- `.claude/skills/project/SKILL.md` (gemini-3-image-generation → image-gen)
- `.gitignore` (scheduled_tasks.lock 추가, post-bodies.ts 추가, cover*.webp 패턴 broaden)
- `docs/SKILLS_MANAGEMENT.md`
- `scripts/sync-obsidian.mjs` (이번 세션의 R2 fetch 교체로 처리됨)

**다음 세션에서 위 파일들이 다시 working tree 에 나타나면**: 다른 워크스페이스에서 또 변경된 거라 `git pull --rebase origin main` 후 별도 chore commit 으로 처리.

#### 3-3. CURRENT_STATUS.md 갱신
- "완료됨" 에 ISR cache stale 사고 + 영구 GC hook 추가
- "다음 작업 후보" 에 Phase 2 항목 우선순위로 명시
- 이 NEXT_SESSION_PLAN.md 는 Phase 2 끝나면 `git rm`

**예상 소요:** 15분.

---

## Phase 2 — 후속 작업 4건 (priority 순, /clear 후 Phase 1 끝나면 진행)

### 우선순위 #1: 비공개 본문 자동 R2 업로드 🟠 중간-높음

**문제:** 비공개 포스트 발행 시 4단계 수동 (terry-private push → index-private.json 갱신 → R2 본문 업로드 → 필요 시 redeploy). R2 업로드 누락 시 dynamicParams=true 로 on-demand 렌더 시도해도 본문 없어 404.

**작업 위치:** **terry-obsidian 워크스페이스** (`/post` 스킬 canonical).

**작업:**
- `/post --visibility=group/private` 발행 흐름 끝에 R2 업로드 단계 추가
  - 대상: `private/posts/<type>/<slug>/<lang>.mdx` (그리고 메타 필요 시 `meta.json` 도)
  - 이미 `scripts/upload-private-content.mjs` (gitignored) 있을 가능성 — 활용 검토
- 실패 시 명확한 에러 + retry 제안

**검증:**
- 더미 비공개 포스트 발행 → R2 에 객체 존재 (`wrangler r2 object get terryum-ai-assets/private/posts/<...>` 또는 fetch 200)
- 그룹 멤버 세션으로 페이지 접근 → 정상 렌더

**예상 소요:** 1-2시간.

### 우선순위 #2: SEO 404 (soft 404 → hard 404) 🟡 중간

**문제:** 미지의 슬러그가 HTTP 200 + Not Found 템플릿 반환. Google "soft 404" 페널티.

**작업:**
1. `app/[lang]/not-found.tsx` 와 `app/not-found.tsx` 에 `metadata.robots = { index: false, follow: false }` 추가 (즉시 부분 완화)
2. `notFound()` 가 OpenNext+Workers 에서 status 404 propagate 못하는 본질 원인 파악
   - Next.js 15 + App Router 표준 동작 확인
   - OpenNext GitHub issues 검색
   - 필요 시 middleware.ts 에서 라우트 매칭 실패 시 명시적 404 응답
3. `PostDetailPage` 에서 `notFound()` 호출 직전에 status 강제 옵션 검토

**검증:**
```bash
curl -sI "https://www.terryum.ai/en/posts/zzz-nonexistent" | head -1
# 기대: HTTP/2 404
```

**예상 소요:** 1-3시간 (OpenNext 디버깅 시간 변동성).

### 우선순위 #3: outputFileTracingIncludes 정리 🟢 낮음 (15분)

**문제:** `next.config.ts:6-15` 의 `outputFileTracingIncludes` 가 `posts/**/*.mdx`, `content/**/*.mdx` 를 worker 번들 추적에 포함. 이제 fs 안 읽고 ?raw 로 번들되니 불필요.

**작업:**
```ts
// next.config.ts
outputFileTracingIncludes: {
  '*': [
    './posts/**/*.json',         // 정적 import 로 이미 들어감 — 제거 가능
    // './posts/**/*.mdx',       // 제거: ?raw 로 번들됨
    // './posts/**/*.md',        // 제거: 사용처 검증 후
    './projects/**/*.json',
    // './content/**/*.mdx',     // 제거: about.tsx 가 ?raw 로 import
    // './content/**/*.md',      // 제거: 사용처 검증 후
    './content.config.json',
  ],
},
```

**검증:**
```bash
grep -rn "fs\.readFile\|fs\.access\|fs\.readdir" src/ scripts/ | grep -v node_modules
# posts.ts 의 fs 호출은 build-time fallback 만 — 번들 추적 불필요

# 빌드 + worker 사이즈 비교
du -sh .open-next/server-functions/default 2>/dev/null
# (전: ?MB) → (후: 더 작아져야)
```

**예상 소요:** 15분.

### 우선순위 #4: 번들 사이즈 모니터링 🟢 낮음 (트리거 도달 시)

**현재 상태:** 46 posts × 2 langs ≈ 1MB 인라인. Workers 한도 (압축 10MB) 여유.

**조치 트리거:** 포스트 100+ 또는 worker 압축 사이즈 5MB 초과.

**즉시 할 만한 일 (선택):**
- `scripts/check-bundle-size.mjs` 추가 — `.open-next/server-functions/default` 디렉토리 사이즈 측정 + 5MB 임계 시 경고. CI deploy step 후 실행 가능.

**트리거 도달 시 옵션:**
- a. R2 fetch 전환 (`posts/<type>/<slug>/<lang>.mdx` 업로드 + runtime fetch)
- b. Chunked imports (content_type 별 분리)
- c. Hybrid (최근 N 개만 인라인)

**예상 소요:** 0 (대기). 트리거 시 2-4시간.

---

## 진행 체크리스트

- [ ] **Phase 1 1차** — prod ISR cache 154 객체 일괄 삭제 + 5 슬러그 검증
- [ ] **Phase 1 2-1** — `scripts/r2-cache-gc.mjs` 작성 + 7000 객체 dry-run / apply
- [ ] **Phase 1 2-2** — `.github/workflows/deploy.yml` 에 GC step 추가
- [ ] **Phase 1 2-3** — OpenNext 자체 옵션 릴리즈노트 확인 (선택)
- [ ] **Phase 1 3** — `_tmp-*.mjs` 삭제 + 미커밋 정리 + CURRENT_STATUS 갱신
- [ ] **Phase 2 #1** — `/post` 스킬 R2 업로드 (terry-obsidian)
- [ ] **Phase 2 #2** — SEO hard 404
- [ ] **Phase 2 #3** — outputFileTracingIncludes 정리
- [ ] **Phase 2 #4** — (트리거 도달 시) 번들 사이즈 대응

전 항목 완료 시: `git rm docs/NEXT_SESSION_PLAN.md` + 마지막 커밋 메시지에 "completed plan" 언급.
