# TECH_ARCHITECTURE.md

## 목적
v1 개인 웹사이트의 기술 구성과 시스템 경계를 정의한다.
(세부 라우팅 규칙은 `I18N_ROUTING.md`, 콘텐츠/발행 절차는 `POSTING_WORKFLOW.md` 참고)

## v1 핵심 결정사항 (확정)
- 도메인 구매/관리: **Cloudflare Registrar**
- DNS/CDN: **Cloudflare DNS + CDN**
- 배포: **Vercel**
- 저장소/협업: **GitHub**
- 초기 자동화: **Claude Code가 설정 파일/CI 초안 자동 생성**
- v1 범위: **자체 사이트만 운영 (Substack 연동 없음)**

## 아키텍처 원칙
- `posts/` 파일 구조가 콘텐츠의 단일 소스 오브 트루스
- 한국어/영어 동시 게시를 기본 전제로 설계
- 정적 생성(SSG) 우선, 최소 서버 기능만 사용
- 자동화는 Claude Code가 담당하고, 최종 결과는 Git에 기록
- 단순성/운영 안정성을 우선하고 확장은 v2로 미룸

## 권장 스택 (v1)
- 프론트엔드: **Next.js (App Router) + TypeScript**
- 스타일링: Tailwind CSS
- 콘텐츠 렌더링: MDX (`ko.mdx`, `en.mdx`)
- 저장소: GitHub 단일 repo
- 배포: Vercel (GitHub 연동 자동 배포)
- 도메인/네트워크: Cloudflare (Registrar/DNS/CDN)

## 시스템 구성도 (개념)
1. 사용자가 VS Code에서 한국어 원고 + 이미지 준비
2. Claude Code가 번역/메타/커버/리네임 처리 후 GitHub push
3. GitHub 변경 감지 → Vercel 자동 빌드/배포
4. 사용자 접속 시 Cloudflare DNS/CDN 경유 후 Vercel 앱 응답

## 역할 분담
### Cloudflare
- 도메인 구매/갱신
- DNS 레코드 관리
- CDN 캐싱/전달
- (선택) 기본 보안/성능 설정

### Vercel
- GitHub 연동 배포
- Preview/Production 환경 제공
- 빌드/호스팅 실행
- (필요 시) 서버리스 함수 실행 (v2에서 뉴스레터 폼 등)

### GitHub
- 사이트 코드 + `posts/` 콘텐츠 저장
- 브랜치/PR 기반 변경 관리
- 변경 이력 추적
- (선택) Actions 기반 보조 CI 작업

### Claude Code
- 포스팅 퍼블리시 자동화 (번역/cover/meta/이미지 정리)
- 프로젝트 설정 및 코드 변경

## 렌더링/빌드 전략
- **모든 페이지 SSG** (100% 정적 생성, ISR 미사용)
- 새 포스트 반영 시 전체 빌드 필요 (Git push → Vercel 자동 빌드)
- 언어 분기: 미들웨어에서 처리 (`src/middleware.ts`)
- 검색: v1 제외 (목록 필터 정도만 허용)

## 캐싱 전략

### 페이지 (HTML)
- SSG로 빌드 시점에 정적 HTML 생성
- Vercel CDN + Cloudflare CDN 이중 캐싱
- 새 빌드 시 자동 무효화

### 이미지
| 대상 | 캐시 정책 | 설정 위치 |
|------|-----------|-----------|
| `/images/*` (프로필 등 정적) | `public, max-age=31536000, immutable` (1년) | `next.config.ts` headers |
| Next.js 최적화 이미지 | `minimumCacheTTL: 86400` (24시간) | `next.config.ts` images |
| 포스트 커버/figure | Vercel 기본 캐싱 | 자동 |

### 기타
- DNS Prefetch: 전역 활성화 (`X-DNS-Prefetch-Control: on`)
- 폰트: Next.js `next/font`로 자동 최적화 + 캐싱

## 최소 백엔드 범위 (v1)
- v1에서는 백엔드 기능 없음 (100% 정적 사이트)
- 뉴스레터/구독 기능은 v2 이후

## 환경 구성
- Local: 더미 콘텐츠 포함 개발 환경
- Preview: PR/브랜치 기반 미리보기 (Vercel)
- Production: 메인 브랜치 배포
- 환경변수는 Vercel/GitHub 시크릿으로 관리 (비밀키 클라이언트 노출 금지)

## v2 확장 포인트 (참고)
- Substack 연동/이관
- arXiv 링크 기반 자동 요약 포스팅
- 검색/태그 고도화
- 운영자용 검수 도구
