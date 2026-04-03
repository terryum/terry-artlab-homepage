import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Try anon key first, fall back to service role key (both work for public SELECT via RLS)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: 'Database not configured', debug: { hasUrl: !!url, hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY } },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key);

  const [papersRes, edgesRes, layoutsRes] = await Promise.all([
    supabase.from('papers').select('slug,title_en,title_ko,domain,taxonomy_primary,taxonomy_secondary,key_concepts,source_author,published_at,meta_json').order('slug'),
    supabase.from('graph_edges').select('edge_id,source_slug,target_slug,edge_type,status').eq('status', 'confirmed'),
    supabase.from('node_layouts').select('slug,x,y').eq('view_id', 'default'),
  ]);

  if (papersRes.error || edgesRes.error || layoutsRes.error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  return NextResponse.json(
    { papers: papersRes.data, edges: edgesRes.data, layouts: layoutsRes.data },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
