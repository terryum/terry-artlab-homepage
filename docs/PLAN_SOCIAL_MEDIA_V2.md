# Social Media 자동 공유 — 운영 가이드 (V2)

## 개요

`scripts/publish-social.py`는 `posts/index.json`의 `essays|tech` 포스트를 4개 플랫폼에 자동 공유한다.

| 플랫폼 | 언어 | 계정 | 토큰 만료 |
|--------|------|------|-----------|
| Facebook Page | 한국어 | Page | 없음 (Long-lived Token) |
| Threads | 한국어 | 개인 계정 | 60일 |
| LinkedIn | 영어 | 개인 계정 | 60일 |
| X (Twitter) | 영어 | @TerryUm_ML | 없음 (OAuth 1.0a) |

---

## 사용법

```bash
# 최신 미발행 포스트를 전체 플랫폼에 발행
python scripts/publish-social.py

# Dry run (실제 API 호출 없음)
python scripts/publish-social.py --dry-run

# 특정 slug 발행
python scripts/publish-social.py --slug=260310-on-the-manifold-first-post

# 특정 플랫폼만 발행
python scripts/publish-social.py --platform=facebook,threads

# 조합
python scripts/publish-social.py --slug=my-post --platform=linkedin,x --dry-run
```

---

## 캐시 파일: `.social-published.json`

플랫폼별로 독립 추적. 한 플랫폼 실패 시 다른 플랫폼은 정상 발행된다.

```json
{
  "facebook": ["slug1", "slug2"],
  "threads": ["slug1"],
  "linkedin": ["slug1"],
  "x": ["slug1"]
}
```

- `.gitignore`에 등록됨 (로컬 상태 파일)
- GitHub Actions에서는 커밋으로 유지됨

---

## 토큰 갱신 방법

### Facebook Page Access Token (만료 없음)

1. [Meta for Developers](https://developers.facebook.com/) → 앱 선택
2. Tools → Graph API Explorer
3. User Token → **Get Page Access Token** 선택
4. **Access Token Debugger**에서 Long-lived token으로 교환
5. `FACEBOOK_PAGE_ACCESS_TOKEN` 업데이트

필요 권한: `pages_manage_posts`, `pages_read_engagement`

---

### Threads Access Token (60일 만료)

Threads는 자체 OAuth 서버를 사용한다 (`graph.threads.net`).

1. [Meta for Developers](https://developers.facebook.com/) → 앱 → Threads 제품 추가
2. Threads API → Access Tokens → Generate Token
3. 스코프: `threads_basic`, `threads_content_publish`
4. Short-lived token (1시간) → Long-lived token (60일)으로 교환:
   ```
   GET https://graph.threads.net/access_token?
     grant_type=th_exchange_token
     &client_secret={APP_SECRET}
     &access_token={SHORT_LIVED_TOKEN}
   ```
5. `THREADS_ACCESS_TOKEN` 업데이트 + `THREADS_TOKEN_CREATED` 날짜 갱신

> **주의**: Threads는 refresh token을 지원하지 않음. 60일마다 수동 재발급 필요.

---

### LinkedIn Access Token (60일 만료, refresh 없음)

LinkedIn OAuth 2.0은 refresh token을 지원하지 않는다 (일반 개인 계정 기준).

1. [LinkedIn Developer Portal](https://developer.linkedin.com/) → 앱 → Auth
2. OAuth 2.0 tools → Request access token
3. 스코프: `w_member_social`
4. `LINKEDIN_ACCESS_TOKEN` 업데이트 + `LINKEDIN_TOKEN_CREATED` 날짜 갱신
5. `LINKEDIN_PERSON_URN` 확인:
   ```bash
   curl -H "Authorization: Bearer {TOKEN}" https://api.linkedin.com/v2/me
   # → {"id": "xxxxxxx", ...} → urn:li:person:xxxxxxx
   ```

---

### X (Twitter) OAuth 1.0a (만료 없음)

1. [X Developer Portal](https://developer.twitter.com/) → 앱 → Keys and Tokens
2. **User authentication settings** → OAuth 1.0a 활성화, **Read and Write** 권한
3. Access Token & Secret 재생성 (필요 시)
4. `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` 업데이트

> X Free tier: 월 1,500 트윗 무료 (충분)

---

## 환경변수 목록

| 변수 | 설명 | 필수 |
|------|------|------|
| `FACEBOOK_PAGE_ID` | Facebook Page 숫자 ID | Facebook 발행 시 |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Long-lived Page Access Token | Facebook 발행 시 |
| `THREADS_ACCESS_TOKEN` | Long-lived User Access Token | Threads 발행 시 |
| `THREADS_USER_ID` | Threads 사용자 숫자 ID | Threads 발행 시 |
| `THREADS_TOKEN_CREATED` | 토큰 발급일 `YYYY-MM-DD` | 만료 경고용 |
| `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 Bearer Token | LinkedIn 발행 시 |
| `LINKEDIN_PERSON_URN` | `urn:li:person:{ID}` | LinkedIn 발행 시 |
| `LINKEDIN_TOKEN_CREATED` | 토큰 발급일 `YYYY-MM-DD` | 만료 경고용 |
| `X_API_KEY` | OAuth 1.0a App Key | X 발행 시 |
| `X_API_SECRET` | OAuth 1.0a App Secret | X 발행 시 |
| `X_ACCESS_TOKEN` | OAuth 1.0a User Access Token | X 발행 시 |
| `X_ACCESS_TOKEN_SECRET` | OAuth 1.0a User Access Secret | X 발행 시 |
| `SITE_BASE_URL` | 홈페이지 URL (기본값: `https://terry.artlab.ai`) | 선택 |

---

## GitHub Secrets 등록

Repository → Settings → Secrets and variables → Actions → New repository secret

위 표의 모든 변수를 Secret으로 등록한다.

---

## GitHub Actions 수동 트리거

Actions 탭 → **Social Media Publish** → **Run workflow**

- `slug`: 특정 포스트 (비우면 최신 미발행)
- `platform`: 특정 플랫폼만 (비우면 전체)
- `dry_run`: `true`로 먼저 확인 권장

---

## 검증 체크리스트

```bash
# 1. 각 플랫폼 dry run
python scripts/publish-social.py --dry-run --platform=facebook
python scripts/publish-social.py --dry-run --platform=threads
python scripts/publish-social.py --dry-run --platform=linkedin
python scripts/publish-social.py --dry-run --platform=x

# 2. 특정 포스트 전체 플랫폼 dry run
python scripts/publish-social.py --slug=<slug> --dry-run

# 3. 실제 발행 (토큰 준비 완료 후)
python scripts/publish-social.py --slug=<slug>
```

---

## 포스트 포맷 미리보기

**Facebook / Threads (한국어):**
```
{ko_title}

{ko_summary — 1~3문장}

전체 글 읽기 👉 {url}
#{tag1} #{tag2} #{tag3}
```

**LinkedIn (영어):**
```
{en_title}

{ai_summary — 2~3 sentences}

Read more → {url}
#{tag1} #{tag2} #{tag3}
```

**X (영어, 280자):**
```
{en_title (truncated if needed)} → {url}
#{tag1} #{tag2} #{tag3}
```
