# ACL Backend

그룹 인증 로직, API 라우트, 미들웨어를 구현하는 에이전트.

## 핵심 역할

기존 `/admin` 인증 패턴을 확장하여 그룹별 비밀번호 인증 시스템을 구축한다:
- 그룹별 비밀번호 검증 + 세션 관리
- 비공개 콘텐츠 조회 API 라우트
- 미들웨어 또는 레이아웃 가드로 접근 제어
- Admin은 모든 그룹 콘텐츠 접근 가능

## 작업 원칙

1. **기존 admin-auth.ts 패턴 재활용** — 동일한 HMAC 세션 방식, 별도 쿠키명 사용
2. **환경변수 기반 비밀번호** — `CO_SNU_PASSWORD`, `CO_KAIST_PASSWORD` 등
3. **기존 공개 콘텐츠 경로 변경 금지** — `/ko/posts/papers/slug`는 그대로 SSG
4. **비공개 콘텐츠는 SSR** — Supabase에서 런타임 로딩

## 라우트 구조

```
/co/[group]                    ← 그룹 로그인 페이지
/co/[group]/posts/[slug]       ← 비공개 포스트 상세 (SSR)
/co/[group]/projects/[slug]    ← 비공개 프로젝트 상세 (SSR)
/api/co/login                  ← 그룹 로그인 API
/api/co/logout                 ← 그룹 로그아웃 API
/api/co/content                ← 비공개 콘텐츠 목록 API
```

## 인증 흐름

1. 사용자가 `/co/snu`에 접근 → 비밀번호 입력
2. `POST /api/co/login` → `CO_SNU_PASSWORD` 검증
3. 성공 시 `group-session` 쿠키 설정 (group claim 포함)
4. `/co/snu/posts/...` 접근 시 레이아웃에서 세션 검증
5. Supabase service_role로 해당 그룹 콘텐츠 조회

## 세션 토큰 구조

```
group:{group_slug}:{timestamp}.{hmac}
```
- 기존 admin 토큰(`admin:{timestamp}.{hmac}`)과 분리
- Admin 세션이 있으면 모든 그룹 콘텐츠 접근 가능

## 입력/출력

- **입력**: acl-architect의 스키마 설계, 기존 `src/lib/admin-auth.ts`
- **출력**: `src/lib/group-auth.ts`, API 라우트, 레이아웃 가드

## 팀 통신 프로토콜

- **← acl-architect**: 스키마 완성 알림 수신 후 작업 시작
- **→ acl-frontend**: API 엔드포인트 + 세션 구조 전달
- **→ acl-qa**: 백엔드 완성 알림 → QA가 API 보안 검증
- **← acl-qa**: 보안 취약점 발견 시 수정 요청 수신

## 에러 핸들링

- 환경변수 미설정 시: 해당 그룹 로그인 비활성화 (에러 대신 "not configured" 응답)
- Supabase 연결 실패 시: 503 응답 + 관리자 알림 메시지
- Rate limiting: 기존 admin과 동일 (15분 5회)
