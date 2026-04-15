import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const OPENAI_MODEL = 'text-embedding-3-small';
const GRAPH_DECAY = 0.5; // graph neighbor score multiplier

function getConfig() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
  };
}

interface SearchResult {
  slug: string;
  title_ko: string;
  title_en: string;
  domain: string | null;
  taxonomy_primary: string | null;
  similarity: number;
  source: 'semantic' | 'graph';
}

/** Call OpenAI to embed the query string. */
async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: OPENAI_MODEL, input: text }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 30);

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseKey || !config.openaiKey) {
    return NextResponse.json(
      { error: 'Search not configured', fallback: true },
      { status: 503 }
    );
  }

  try {
    // 1. Embed the query
    const queryEmbedding = await embedQuery(query, config.openaiKey);

    // 2. Semantic search via Supabase RPC
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    const { data: semanticResults, error: rpcError } = await supabase.rpc('search_posts', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.0,
      match_count: 20,
    });

    if (rpcError) {
      throw new Error(`Supabase RPC error: ${rpcError.message}`);
    }

    const results = new Map<string, SearchResult>();
    for (const r of semanticResults || []) {
      results.set(r.slug, {
        slug: r.slug,
        title_ko: r.title_ko,
        title_en: r.title_en,
        domain: r.domain,
        taxonomy_primary: r.taxonomy_primary,
        similarity: r.similarity,
        source: 'semantic',
      });
    }

    // 3. Graph expansion: 1-hop neighbors of semantic results
    const semanticSlugs = Array.from(results.keys());
    if (semanticSlugs.length > 0) {
      const { data: edges } = await supabase
        .from('graph_edges')
        .select('source_slug, target_slug, weight, edge_type')
        .or(
          `source_slug.in.(${semanticSlugs.map(s => `"${s}"`).join(',')}),` +
          `target_slug.in.(${semanticSlugs.map(s => `"${s}"`).join(',')})`
        )
        .eq('status', 'confirmed');

      if (edges) {
        // Collect neighbor slugs that need metadata
        const neighborSlugs = new Set<string>();

        for (const edge of edges) {
          const parentSlug = semanticSlugs.includes(edge.source_slug)
            ? edge.source_slug
            : edge.target_slug;
          const neighborSlug = edge.source_slug === parentSlug
            ? edge.target_slug
            : edge.source_slug;

          const parentScore = results.get(parentSlug)?.similarity || 0;
          const neighborScore = parentScore * (edge.weight || 0.5) * GRAPH_DECAY;

          if (!results.has(neighborSlug)) {
            neighborSlugs.add(neighborSlug);
            results.set(neighborSlug, {
              slug: neighborSlug,
              title_ko: '',
              title_en: '',
              domain: null,
              taxonomy_primary: null,
              similarity: neighborScore,
              source: 'graph',
            });
          } else {
            // Already in results — boost if graph score is higher
            const existing = results.get(neighborSlug)!;
            if (neighborScore > existing.similarity) {
              existing.similarity = neighborScore;
            }
          }
        }

        // Fetch metadata for graph-expanded neighbors
        if (neighborSlugs.size > 0) {
          const { data: neighborPapers } = await supabase
            .from('papers')
            .select('slug, title_ko, title_en, domain, taxonomy_primary')
            .in('slug', Array.from(neighborSlugs));

          if (neighborPapers) {
            for (const p of neighborPapers) {
              const existing = results.get(p.slug);
              if (existing) {
                existing.title_ko = p.title_ko;
                existing.title_en = p.title_en;
                existing.domain = p.domain;
                existing.taxonomy_primary = p.taxonomy_primary;
              }
            }
          }
        }
      }
    }

    // 4. Sort by similarity and return top `limit`
    const sorted = Array.from(results.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json(
      { results: sorted },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Search failed', fallback: true },
      { status: 503 }
    );
  }
}
