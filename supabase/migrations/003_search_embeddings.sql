-- ============================================================
-- Search Embeddings — pgvector for hybrid semantic search
-- Adds embedding column to papers + search RPC function
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column (OpenAI text-embedding-3-small = 1536 dims)
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS papers_embedding_idx
  ON papers
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

-- 4. RPC function: semantic search returning top-K by cosine similarity
CREATE OR REPLACE FUNCTION search_posts(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  slug text,
  title_ko text,
  title_en text,
  domain text,
  taxonomy_primary text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.slug,
    p.title_ko,
    p.title_en,
    p.domain,
    p.taxonomy_primary,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM papers p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;
