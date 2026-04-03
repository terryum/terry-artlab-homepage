# On the Manifold — Terry's External Brain

**한국어** | [English](README.md)

> 로보틱스 & AI 연구를 위한 개인 홈페이지이자 AI가 운영하는 지식 관리 시스템.

**사이트**: [terry.artlab.ai](https://terry.artlab.ai)

## 소개

[On the Manifold](https://terry.artlab.ai)은 한국어/영어 이중 언어 연구 블로그이자 지식 그래프입니다. [Andrej Karpathy의 지식 관리 방식](https://x.com/karpathy/status/1911080111710109960)에 영감을 받아, Claude Code가 AI 에이전트로서 논문 요약, 인덱싱, 관계 연결, 발행을 자연어 명령으로 수행합니다.

현재 25개 이상의 논문 요약, 테크 에세이, 인터랙티브 논문 관계 그래프를 AI 파이프라인으로 관리하고 있습니다.

## 아키텍처

| 레이어 | 스택 |
|--------|------|
| **프론트엔드** | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 |
| **배포** | Cloudflare (DNS/CDN) + Vercel |
| **데이터베이스** | Supabase (논문 관계, 지식 그래프) |
| **지식 베이스** | Obsidian (로컬 그래프 뷰어) + Claude Code (운영 에이전트) |
| **콘텐츠** | 한국어/영어 이중 언어 MDX 포스트 |

## 스킬 (Claude Code 명령어)

| 스킬 | 설명 | 예시 |
|------|------|------|
| `/post` | arXiv, 블로그, 저널 URL로 논문 포스트 발행 | `/post https://arxiv.org/abs/2505.22159` |
| `/write` | Obsidian 메모를 스타일 가이드 기반 초안으로 변환, 또는 대화 인사이트 저장 | `/write #-1 #-3 --type=tech` |
| `/memo` | 자동 인덱싱된 Obsidian 메모 생성 | `/memo AI와 로보틱스의 접점` |
| `/paper-search` | 지식 그래프 + 외부 검색으로 Top 10 논문 추천 | `/paper-search #16 리타게팅 한계를 해결하는 연구` |
| `/post-share` | 소셜 미디어에 포스트 발행 (Facebook, X, LinkedIn, Bluesky, Substack) | `/post-share #5 facebook,x` |
| `/project` | 프로젝트 갤러리에 추가 | `/project https://github.com/user/repo` |

## 작동 방식

```
                    Claude Code (AI 에이전트)
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   /post, /write      /paper-search      /memo, /write
        │                  │               (인사이트)
        ▼                  ▼                  │
  posts/ (MDX)      Semantic Scholar          ▼
  meta.json          + arXiv API        Obsidian Vault
  index.json              │             (From AI/, From
        │                 ▼              Terry/, Meta/)
        ├──► Supabase (그래프)                │
        ├──► Obsidian (동기화)                │
        └──► Vercel (배포)                    │
                                              ▼
                                         지식 그래프
                                    (wikilinks + Dataview)
```

- **공개 포스트**는 양수 ID로 인덱싱 (`#1`, `#2`, ...)
- **비공개 메모/초안**은 음수 ID 사용 (`#-1`, `#-2`, ...)
- 모든 문서는 `#번호`로 어디서든 참조 가능

## 참고

이 레포지토리는 개인 프로젝트이며, 범용 템플릿이 아닙니다. 실행에 필요한 환경 변수, API 키, 인프라 설정이 포함되어 있지 않습니다. 워크플로우가 흥미로우시다면 영감을 얻으시되, 직접 처음부터 구축하시길 권합니다.

## 라이선스

MIT
