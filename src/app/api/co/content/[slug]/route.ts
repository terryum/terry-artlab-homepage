import { NextRequest, NextResponse } from 'next/server';
import { getGroupFromRequest } from '@/lib/group-auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';

/** GET /api/co/content/[slug]?group=snu — Get a single private content item */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const group = request.nextUrl.searchParams.get('group');

  if (!group) {
    return NextResponse.json({ error: 'group parameter is required' }, { status: 400 });
  }

  // Auth check
  const isAdmin = isAdminRequest(request);
  const sessionGroup = getGroupFromRequest(request);

  if (!isAdmin && sessionGroup !== group) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('private_content')
    .select('*')
    .eq('slug', slug)
    .eq('group_slug', group)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  return NextResponse.json({ content: data });
}
