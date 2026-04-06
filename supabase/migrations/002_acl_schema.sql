-- ============================================================
-- ACL Schema — Group-based Access Control
-- 2 tables: access_groups, private_content
-- ============================================================

-- access_groups: 공동연구 그룹 정의 (co-snu, co-kaist 등)
CREATE TABLE access_groups (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- private_content: 비공개 포스트/프로젝트 (Git이 아닌 Supabase에만 저장)
CREATE TABLE private_content (
  slug TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('papers', 'notes', 'memos', 'essays', 'projects')),
  group_slug TEXT NOT NULL REFERENCES access_groups(slug) ON DELETE CASCADE,
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ko TEXT,
  content_en TEXT,
  meta_json JSONB DEFAULT '{}',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_private_content_group ON private_content(group_slug);
CREATE INDEX idx_private_content_type ON private_content(content_type);
CREATE INDEX idx_private_content_status ON private_content(status);

-- ============================================================
-- RLS 정책
-- anon key로 비공개 콘텐츠 절대 조회 불가
-- service_role만 읽기/쓰기 가능 (서버 API에서 세션 검증 후 호출)
-- ============================================================

ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_service_only" ON access_groups
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE private_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "private_content_service_only" ON private_content
  FOR ALL USING (auth.role() = 'service_role');
