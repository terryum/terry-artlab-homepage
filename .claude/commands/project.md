# Project 갤러리 추가 파이프라인

입력: $ARGUMENTS

---

## Step 1) GitHub URL 파싱

$ARGUMENTS에서 GitHub URL을 추출한다.

```
/project https://github.com/terryum/awesome-deep-learning-papers
/project https://github.com/terryum/awesome-deep-learning-papers --featured
/project https://github.com/terryum/awesome-deep-learning-papers --status=archived
```

- `owner/repo` 추출
- `--featured` 플래그 확인 (기본: false)
- `--status=active|archived|wip` 확인 (기본: archived → README에 최근 업데이트 없으면, active → 있으면)
- `--tech=tag1,tag2` 확인 (없으면 자동 감지)

## Step 2) GitHub API로 레포 정보 수집

`gh api repos/{owner}/{repo}` 또는 WebFetch로 정보를 가져온다:

- `name` → slug
- `description` → 영문 설명
- `topics` → tech_stack 후보
- `language` → 주 언어
- `homepage` → demo 링크 후보
- `html_url` → GitHub 링크
- `created_at`, `pushed_at` → 날짜 정보

README.md도 읽어서:
- 프로젝트에 대한 더 자세한 설명 추출
- 한국어 설명이 있으면 활용

## Step 3) 메타데이터 구성

다음 형식으로 ProjectMeta 객체를 구성한다:

```json
{
  "slug": "awesome-deep-learning-papers",
  "title": {
    "ko": "한국어 제목",
    "en": "English Title"
  },
  "description": {
    "ko": "한국어 설명 (1-2문장)",
    "en": "English description (1-2 sentences)"
  },
  "cover_image": "/images/projects/{slug}-cover.webp",
  "tech_stack": ["Python", "Deep Learning"],
  "links": [
    { "type": "github", "url": "https://github.com/owner/repo" },
    { "type": "demo", "url": "https://...", "label": "Live Demo" }
  ],
  "status": "active",
  "featured": false,
  "order": 0,
  "published_at": "2024-01-15"
}
```

- `order`는 기존 projects.json의 마지막 order + 1
- `published_at`는 레포의 `created_at` 사용
- `status`는 `pushed_at`이 1년 이내면 `active`, 아니면 `archived`

## Step 4) 커버 이미지 생성

`/gemini-3-image-generation` 스킬을 사용하여 커버 이미지를 생성한다.

프롬프트 구성:
- 프로젝트의 핵심 주제를 반영하는 추상적/기술적 일러스트
- 16:9 비율, 깔끔한 디자인
- 텍스트 없이 시각적 이미지만

생성된 이미지를 `public/images/projects/{slug}-cover.webp`로 저장한다.

## Step 5) projects.json 업데이트

`projects/gallery/projects.json`을 읽어 `projects` 배열에 새 항목을 추가한다.

- 이미 같은 slug이 있으면 업데이트 (덮어쓰기)
- 없으면 배열 끝에 추가

## Step 6) 검증

추가된 프로젝트 정보를 출력한다:

```
✅ 프로젝트 추가 완료
slug: awesome-deep-learning-papers
title: Awesome Deep Learning Papers
status: archived
tech_stack: [Python, Deep Learning, ...]
cover: /images/projects/awesome-deep-learning-papers-cover.webp
links: GitHub
```

`npx tsc --noEmit`으로 타입 체크를 실행한다.
