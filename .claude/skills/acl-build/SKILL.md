---
name: acl-build
description: 그룹 기반 접근 제어(ACL) 시스템 빌드 오케스트레이터. 4개 에이전트 팀(acl-architect, acl-backend, acl-frontend, acl-qa)을 파이프라인+incremental QA 패턴으로 조율하여 비공개 콘텐츠 시스템을 구현한다. '/acl-build', 'ACL 구현', '접근 제어 빌드', '비공개 포스트 시스템 구축' 요청 시 트리거.
---

# ACL Build Orchestrator

그룹별 비밀번호 기반 접근 제어 시스템을 구축하는 오케스트레이터.

## 아키텍처 개요

```
[공개 콘텐츠]                    [비공개 콘텐츠]
posts/ (파일시스템)               Supabase (private_content)
SSG at build time                SSR at runtime
/ko/posts/papers/slug            /co/[group]/posts/slug
누구나 접근                       그룹 비밀번호 필요
```

## 팀 구성

| 에이전트 | 타입 | 역할 |
|----------|------|------|
| **acl-architect** | general-purpose | Supabase 스키마, RLS, 타입 정의 |
| **acl-backend** | general-purpose | 인증 로직, API 라우트, 세션 관리 |
| **acl-frontend** | general-purpose | 로그인 UI, 비공개 콘텐츠 페이지 |
| **acl-qa** | general-purpose | 보안 검증, 경계면 교차 비교 |

모든 에이전트는 `model: "opus"` 사용.

## 실행 파이프라인

### Phase A: Schema (acl-architect)

**목표**: 데이터 레이어 완성

1. Supabase 마이그레이션 생성 (`supabase/migrations/002_acl_schema.sql`)
   - `access_groups` 테이블
   - `private_content` 테이블
   - RLS 정책 (anon 읽기 차단, service_role만 쓰기)
2. TypeScript 타입 확장 (`src/types/post.ts`, `src/types/project.ts`)
   - `visibility?: 'public' | 'group'`
   - `allowed_groups?: string[]`
3. Supabase에 마이그레이션 적용 (MCP 사용 가능 시)

**산출물**: `_workspace/phase-a_schema.md` (테이블 DDL + RLS 정책 요약)

**→ QA**: acl-qa가 Phase A 체크리스트 실행

### Phase B: Backend Auth (acl-backend)

**목표**: 인증 + API 레이어 완성

1. `src/lib/group-auth.ts` 생성
   - 그룹 비밀번호 검증 (`CO_{GROUP}_PASSWORD` 환경변수)
   - 세션 토큰 서명/검증 (`group:{slug}:{timestamp}.{hmac}`)
   - 쿠키 관리 (`group-session`, 24시간 TTL)
   - Admin 세션이면 모든 그룹 접근 허용
2. API 라우트 생성
   - `POST /api/co/login` — 그룹 + 비밀번호 → 세션 쿠키
   - `POST /api/co/logout` — 세션 삭제
   - `GET /api/co/content?group=snu` — 해당 그룹 콘텐츠 목록
   - `GET /api/co/content/[slug]?group=snu` — 콘텐츠 상세
3. `.env.example` 업데이트 (그룹 비밀번호 키 추가)

**산출물**: `_workspace/phase-b_api-spec.md` (엔드포인트, 요청/응답 스펙)

**→ QA**: acl-qa가 Phase B 체크리스트 실행 (API 보안 테스트)

### Phase C: Frontend (acl-frontend)

**목표**: UI 레이어 완성

1. 그룹 포털 라우트 생성
   - `src/app/co/[group]/layout.tsx` — 세션 가드
   - `src/app/co/[group]/page.tsx` — 로그인/포스트 목록
   - `src/app/co/[group]/posts/[slug]/page.tsx` — 포스트 상세
   - `src/app/co/[group]/projects/[slug]/page.tsx` — 프로젝트 상세
2. 컴포넌트 생성
   - `src/components/co/GroupLoginForm.tsx`
   - `src/components/co/PrivatePostList.tsx`
3. i18n 번역 추가 (`src/dictionaries/{ko,en}.json`)
4. 기존 `ContentDetailPage` 재활용하여 MDX 렌더링

**산출물**: `_workspace/phase-c_routes.md` (라우트 목록 + 컴포넌트 트리)

**→ QA**: acl-qa가 Phase C 체크리스트 실행

### Phase D: Integration & Final QA (acl-qa)

**목표**: 전체 시스템 통합 검증

1. 전체 흐름 테스트 (로그인 → 목록 → 상세 → 로그아웃)
2. Admin 교차 접근 테스트
3. Git 노출 검증 (`git status`에 비공개 파일 없음)
4. 빌드 검증 (`npm run build` 성공)
5. 사이트맵/RSS 비공개 미포함 확인
6. 기존 공개 페이지 회귀 없음

**산출물**: `_workspace/phase-d_qa-report.md` (전체 QA 결과)

## 데이터 전달

| From | To | 매체 | 내용 |
|------|----|------|------|
| acl-architect | acl-backend | 파일 (`_workspace/phase-a_schema.md`) | 테이블 DDL, RLS 정책 |
| acl-backend | acl-frontend | 파일 (`_workspace/phase-b_api-spec.md`) | API 엔드포인트, 세션 구조 |
| 각 에이전트 | acl-qa | SendMessage | Phase 완료 알림 |
| acl-qa | 각 에이전트 | SendMessage | QA 결과 (pass/fail + 수정 요청) |

## 에러 핸들링

- **Phase 실패**: QA에서 critical 실패 발견 시 해당 에이전트에 수정 요청 → 1회 재시도 → 재실패 시 사용자에게 보고
- **Supabase 미연결**: Phase A를 SQL 파일 생성만으로 완료, Phase B/C는 목업 데이터로 진행
- **상충 데이터**: 삭제하지 않고 출처 병기, 사용자 결정 요청

## 비공개 콘텐츠 발행 흐름 (구축 후)

```
1. Admin이 비공개 포스트 작성 (또는 Claude Code로 생성)
2. Supabase private_content에 저장 (Git 커밋 안 함)
3. 공동연구자에게 그룹 비밀번호 + URL 공유
   예: "terry.artlab.ai/co/snu 접속 후 비밀번호 입력하세요"
4. 연구자가 로그인 → 비공개 포스트 열람
```

## 수정 대상 파일 목록

### 새로 생성
- `supabase/migrations/002_acl_schema.sql`
- `src/lib/group-auth.ts`
- `src/app/api/co/login/route.ts`
- `src/app/api/co/logout/route.ts`
- `src/app/api/co/content/route.ts`
- `src/app/api/co/content/[slug]/route.ts`
- `src/app/co/[group]/layout.tsx`
- `src/app/co/[group]/page.tsx`
- `src/app/co/[group]/posts/[slug]/page.tsx`
- `src/app/co/[group]/projects/[slug]/page.tsx`
- `src/components/co/GroupLoginForm.tsx`
- `src/components/co/PrivatePostList.tsx`

### 수정
- `src/types/post.ts` — visibility 필드 추가
- `src/types/project.ts` — visibility 필드 추가
- `src/dictionaries/ko.json` — 번역 키 추가
- `src/dictionaries/en.json` — 번역 키 추가
- `.env.example` — 그룹 비밀번호 키 추가
- `src/middleware.ts` — `/co` 경로 제외 추가 (locale middleware 스킵)

### 변경 없음 (확인만)
- `src/lib/admin-auth.ts` — 기존 코드 그대로
- `posts/` — 공개 콘텐츠 변경 없음
- `next.config.ts` — 필요 시 `/co` redirect만 추가

## 테스트 시나리오

### 정상 흐름
1. `/co/snu` 접근 → 로그인 폼 표시
2. 올바른 비밀번호 입력 → 비공개 포스트 목록 표시
3. 포스트 클릭 → MDX 상세 렌더링
4. 로그아웃 → 다시 로그인 폼

### 에러 흐름
1. 잘못된 비밀번호 5회 → rate limit ("Too many attempts")
2. co-snu 세션으로 `/co/kaist/posts/slug` 접근 → 403 또는 로그인 폼
3. 세션 만료 후 접근 → 로그인 폼으로 리다이렉트
4. 존재하지 않는 `/co/xyz` → 404

### Admin 교차 흐름
1. Admin 로그인 상태로 `/co/snu` 접근 → 바로 콘텐츠 목록 (비밀번호 불필요)
2. Admin이 `/co/kaist/posts/slug` 접근 → 정상 표시
