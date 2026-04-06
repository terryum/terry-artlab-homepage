---
name: tagging
description: "Obsidian 글에 자동 태깅. 태그가 비어있는 글을 찾아 내용 기반으로 태그를 생성한다. /tagging, /tagging -all, /tagging -from 260301 -to 260401 등으로 실행. '태깅해줘', '태그 달아줘', 'auto tag' 등 요청 시 트리거."
argument-hint: "[-all] [-from YYMMDD] [-to YYMMDD]"
---

# /tagging — Obsidian 자동 태깅

## 용도
Obsidian vault의 글 중 태그가 비어있는(`tags: []`) 글을 찾아, 본문 내용을 분석하여 적절한 태그를 자동 생성한다.

## 입력
```
/tagging              # 태그가 비어있는 글만 태깅
/tagging -all         # 모든 글의 태그를 재생성
/tagging -from 260301 -to 260401   # 특정 기간 글만 재태깅
/tagging -from 260301              # 해당 날짜 이후 글만
/tagging -to 260401                # 해당 날짜 이전 글만
```

## Vault 경로
`~/Documents/Obsidian Vault`

## 실행 순서

### Step 1) 대상 파일 수집
Vault 내 모든 `.md` 파일을 재귀적으로 수집한다. 대상 폴더:
- `From Terry/Memos/`
- `From Terry/Essays/`
- `From Terry/Drafts/`
- `From AI/Papers/`
- `From AI/Notes/`
- `My Notes/`

### Step 2) 자동 태깅 불필요 파일 제외
다음 파일은 태깅 대상에서 **제외**한다:
- `Ops/` 폴더의 모든 파일 (Templates, Meta, AGENTS.md 등 운영 파일)
- frontmatter에 `type: template`이 있는 파일
- frontmatter에 `tags` 필드 자체가 없는 파일 (태깅 체계 밖의 문서)
- 본문이 비어있거나 frontmatter만 있는 파일 (내용이 없으면 태깅 불가)

### Step 3) 모드별 필터링

**기본 모드** (`/tagging`):
- `tags: []` 인 파일만 대상

**-all 모드** (`/tagging -all`):
- 모든 대상 파일 (기존 태그 덮어쓰기)

**기간 모드** (`/tagging -from YYMMDD -to YYMMDD`):
- frontmatter의 `created_at` 날짜가 지정 범위 내인 파일만 대상
- 기존 태그 유무와 관계없이 재태깅

### Step 4) 태깅 실행
각 파일에 대해:
1. 본문 전체를 읽는다
2. 내용을 분석하여 **3~7개**의 태그를 생성한다
3. 태그 규칙:
   - 소문자 영어, 하이픈 구분 (예: `machine-learning`, `personal-growth`)
   - 너무 일반적인 태그 지양 (예: `thoughts`, `note` 등은 부적절)
   - 주제/도메인 태그 + 성격 태그 혼합 (예: `robotics`, `paper-review`, `idea`)
   - 기존 vault에서 이미 사용된 태그가 있으면 우선 재사용하여 일관성 유지
4. frontmatter의 `tags: []`를 업데이트한다

### Step 5) 태깅 전 기존 태그 수집
일관성을 위해, 태깅 시작 전에 vault 전체에서 현재 사용 중인 태그 목록을 수집한다.
```
기존 태그 예: [robotics, ai, paper-review, personal, ...]
```
새 태그 생성 시 기존 태그와 최대한 일치시키되, 새로운 주제가 등장하면 새 태그를 만든다.

### Step 6) 결과 리포트
태깅 완료 후 요약을 출력한다:
```
## 태깅 완료
- 대상 파일: 12개
- 제외된 파일: 5개 (템플릿 2, 빈 파일 3)
- 태깅 완료: 12개
- 새로 생성된 태그: [new-tag-1, new-tag-2]

### 파일별 결과
| 파일 | 태그 |
|------|------|
| Memos/260403-xxx.md | ai, robotics, idea |
| ... | ... |
```

## 주의
- 태깅은 frontmatter의 `tags` 필드만 수정한다 — 본문은 절대 변경하지 않는다
- 한 번에 너무 많은 파일을 처리할 경우 (20개 이상) 10개씩 배치로 처리하고 중간 진행상황을 출력한다
- 기존 태그를 덮어쓰는 경우 (`-all`, 기간 모드) 실행 전에 "N개 파일의 기존 태그를 덮어씁니다. 진행할까요?" 확인을 받는다
