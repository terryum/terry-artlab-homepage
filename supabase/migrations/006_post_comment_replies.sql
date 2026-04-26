-- ============================================================
-- Post comments: single-level replies
-- - parent_id: NULL = root comment, else points to root comment in same post
-- - ON DELETE CASCADE so admin delete of root removes its replies
-- - public view exposes parent_id for client-side grouping
-- ============================================================

ALTER TABLE post_comments
  ADD COLUMN parent_id UUID NULL REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX idx_post_comments_parent ON post_comments(parent_id);

DROP VIEW post_comments_public;
CREATE VIEW post_comments_public AS
  SELECT id, post_slug, author_name, content, created_at, parent_id
  FROM post_comments
  WHERE status = 'visible';

GRANT SELECT ON post_comments_public TO anon;
GRANT SELECT ON post_comments_public TO authenticated;
