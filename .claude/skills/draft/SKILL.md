---
name: draft
description: "Obsidian Drafts 폴더에 발행용 초안을 생성. /draft <memos|essays> 초안은 다음과 같아: ... 형태로 사용. 첫 문장이 제목이 된다. 사용자가 Obsidian에서 직접 수정한 후 /post --from=... 으로 발행."
argument-hint: "<memos|essays> 초안은 다음과 같아: <본문>"
---

# /draft — 발행용 초안 생성

## 용도
사용자가 제공한 원문을 Obsidian `From Terry/Drafts/` 폴더에 초안 마크다운 파일로 생성한다.
사용자가 Obsidian에서 직접 수정한 후, `/post --from=...` 으로 발행을 요청하면 그때 커버이미지 생성, 태깅, MDX 변환 등을 진행한다.

## 입력
```
/draft <memos|essays> 초안은 다음과 같아: <본문>
/draft <memos|essays> <본문>
```

- 첫 번째 인자: content_type (`memos` 또는 `essays`)
  - 생략 시 본문 내용을 보고 추론 후 사용자에게 확인
  - `memos`: 짧은 생각, 일상 관찰, AI 시대 변화 등
  - `essays`: 긴 형식의 깊은 사유, AI/Physical AI/미래 변화 등
- 나머지: 초안 본문 (한국어)

## 실행 순서

### Step 1) 제목 추출
- 본문의 **첫 문장** (첫 줄바꿈 전까지)을 제목으로 사용
- 제목에서 영문 kebab-case slug 생성

### Step 2) 파일명 결정
- `YYMMDD-<slug>.md` (오늘 날짜 + 영문 slug)
- 예: `260406-writing-daily.md`

### Step 3) global-index.json에서 ID 할당
- `posts/global-index.json` 읽기
- `next_private_id` 값을 이 초안의 doc_id로 사용
- `next_private_id`를 1 감소

### Step 4) 초안 파일 생성
경로: `~/Documents/Obsidian Vault/From Terry/Drafts/<filename>.md`

```markdown
---
doc_id: <음수 ID>
type: draft
content_type: "<memos|essays>"
visibility: private
title: "<첫 문장>"
slug: "<YYMMDD-slug>"
created_at: <오늘 날짜>
tags: []
---

`#<ID>` · <제목>

<본문 전체 (첫 문장 포함)>
```

**규칙:**
- 본문은 사용자가 제공한 그대로 넣는다 — 교정/윤문/구조 변경 하지 않음
- 제목(첫 문장)도 본문에 포함하여 전체 텍스트를 유지

### Step 5) global-index.json 업데이트
```json
{
  "id": <음수 ID>,
  "slug": "<YYMMDD-slug>",
  "type": "draft",
  "visibility": "private",
  "title": "<제목>",
  "path": "From Terry/Drafts/<filename>.md"
}
```

### Step 6) 결과 출력
```
📝 초안 생성 완료
- 파일: From Terry/Drafts/<filename>.md
- 인덱스: #<ID>
- 타입: <memos|essays>

Obsidian에서 수정한 후 발행하려면:
  /post --type=<memos|essays> --from=#<ID>
```

## 주의
- **본문을 수정하지 않는다** — 교정, 번역, 구조 변경 일체 금지
- 영문 번역은 하지 않는다 — `/post` 단계에서 처리
- 커버 이미지는 생성하지 않는다 — `/post` 단계에서 처리
- Drafts/ 폴더의 기존 파일은 절대 수정하지 않는다
