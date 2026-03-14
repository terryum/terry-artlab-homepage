# Refactoring Principles

> Next.js App Router + TypeScript + Tailwind 기반 현대적 리팩토링 원칙

## 1. Rule of Three
동일 패턴이 3회 이상 반복되면 추상화 대상이다.
- 예: `max-w-4xl mx-auto px-4 md:px-6 lg:px-8` → `Container` 컴포넌트
- 예: `post.display_tags?.length ? post.display_tags : post.tags` → `getDisplayTags()`

## 2. Colocation
관련 코드는 가까이 배치한다. Next.js App Router 기준:
- 특정 route에서만 쓰이는 컴포넌트는 해당 route 폴더 안에 위치
- 여러 곳에서 쓰이면 `src/components/` 또는 `src/lib/`으로 올린다

## 3. Server / Client 경계
무거운 데이터 로직은 Server Component에 유지한다.
- DB 조회, 파일 읽기, 중간 변환 → Server Component
- 인터랙션 (클릭, 상태) → Client Component (`'use client'`)
- Client Component를 leaf 노드로 유지할수록 번들 크기 감소

## 4. DRY — 중복 타입·함수·스타일 제거
- 타입은 `src/types/`에서만 정의하고 나머지는 import
- 유틸 함수는 `src/lib/`에 두고 여러 컴포넌트에서 재사용
- 중복된 Tailwind 클래스 묶음은 컴포넌트나 유틸로 추출

## 5. 단일 진입점 원칙
타입·상수·설정은 한 곳에서만 export한다.
- `TagItem` → `src/types/tag.ts`
- `Container` → `src/components/ui/Container.tsx`
- `formatPostDate`, `getDisplayTags` → `src/lib/display.ts`

## 6. 필요 없는 코드 삭제
최고의 코드는 없는 코드다.
- 미사용 컴포넌트·함수·타입은 즉시 삭제
- "나중에 쓸 수도 있는" 코드는 추가하지 않는다
- 기능 제거 시 해당 API route, 페이지, 컴포넌트를 함께 제거
