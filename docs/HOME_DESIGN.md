# Home Page Design Guide

홈 화면에 새 섹션을 추가할 때 따라야 할 규칙.

## 섹션 구조

모든 섹션은 `LatestSection` 컴포넌트를 사용한다.

```tsx
// Posts 모드 (PostMeta 배열)
<LatestSection
  title={...} viewAllHref={...} viewAllText={...}
  posts={posts} locale={lang}
/>

// Children 모드 (CompactCard 등 자유 렌더링)
<LatestSection title={...} viewAllHref={...} viewAllText={...}>
  {items.map(item => <CompactCard key={...} ... />)}
</LatestSection>
```

## 카드 스타일

| 위치 | 컴포넌트 | 용도 |
|------|---------|------|
| 홈 | `ContentCard` | Posts (자동 썸네일, 태그, 날짜) |
| 홈 | `CompactCard` | Surveys, Projects 등 비-Post 콘텐츠 |
| 목록 페이지 | `SurveyCard`, `ProjectCard` | 상세 정보가 필요한 전용 카드 |

홈에서는 항상 **리스트 스타일** (왼쪽 썸네일 + 오른쪽 텍스트) 사용.

## 더보기 (Show More)

- 기본: 초기 3개 표시 → "더보기" 버튼으로 3개씩 추가
- `initialCount` prop으로 초기 표시 개수 조정 가능
- 모든 섹션에 더보기 버튼 필수

## 썸네일

- 모바일: 80×80px (`w-20 h-20`)
- 태블릿+: 144×144px (`w-36 h-36`)
- 파일: `cover-thumb.webp` (288×288 retina)
- Projects/Surveys: `*-thumb.webp` (`scripts/generate-thumbnails.mjs`가 자동 생성)
- **홈에서는 원본 커버 이미지 직접 사용 금지** → 반드시 썸네일 경로 사용

## 새 섹션 추가 체크리스트

1. `LatestSection` + `CompactCard` 패턴 사용
2. 초기 표시 3개 + 더보기 버튼
3. 썸네일 생성 스크립트에 대상 추가 (`scripts/generate-thumbnails.mjs`)
4. 홈에서 썸네일 경로 사용
5. i18n 사전에 `home.latest_*` 키 추가 (en.json, ko.json 모두)
