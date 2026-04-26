import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isKnownSlug, getIndexedPost } from '@/lib/post-validation';
import { clientIp, hashIp } from '@/lib/post-validation';
import { verifyTurnstile } from '@/lib/turnstile';
import { RateLimiter } from '@/lib/auth-common';
import { notifyNewComment } from '@/lib/email-notify';

export const runtime = 'nodejs';

// 5 comments per IP per 15 minutes
const commentLimiter = new RateLimiter(15 * 60 * 1000, 5);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PostBody {
  name?: unknown;
  email?: unknown;
  content?: unknown;
  website?: unknown; // honeypot
  turnstileToken?: unknown;
  parentId?: unknown;
}

/* GET — list visible comments for a post (public-readable view). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isKnownSlug(slug)) {
    return NextResponse.json({ error: 'Unknown post' }, { status: 404 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('post_comments_public')
    .select('id, author_name, content, created_at, parent_id')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ comments: data ?? [] });
}

/* POST — create a new comment after honeypot + Turnstile + rate-limit checks. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isKnownSlug(slug)) {
    return NextResponse.json({ error: 'Unknown post' }, { status: 404 });
  }

  const ip = clientIp(request);
  if (!commentLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many comments. Try again later.' }, { status: 429 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — silently reject (return 200 so bots think they succeeded).
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
  const rawParentId = typeof body.parentId === 'string' ? body.parentId.trim() : '';
  const parentId = rawParentId && UUID_RE.test(rawParentId) ? rawParentId : null;

  if (name.length < 1 || name.length > 40) {
    return NextResponse.json({ error: '이름은 1–40자로 입력해주세요. / Name must be 1–40 chars.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다. / Invalid email.' }, { status: 400 });
  }
  if (content.length < 5 || content.length > 2000) {
    return NextResponse.json({ error: '댓글은 5–2000자로 입력해주세요. / Comment must be 5–2000 chars.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Validate parent: must be a visible comment of the same post and a root (parent_id IS NULL).
  let parentAuthor: string | undefined;
  let parentExcerpt: string | undefined;
  if (parentId) {
    const parentRes = await supabase
      .from('post_comments')
      .select('id, author_name, content, post_slug, parent_id, status')
      .eq('id', parentId)
      .maybeSingle();
    if (parentRes.error || !parentRes.data) {
      return NextResponse.json({ error: 'Parent comment not found.' }, { status: 400 });
    }
    const p = parentRes.data;
    if (p.post_slug !== slug || p.status !== 'visible') {
      return NextResponse.json({ error: 'Parent comment not available.' }, { status: 400 });
    }
    if (p.parent_id !== null) {
      return NextResponse.json({ error: 'Replies cannot be nested.' }, { status: 400 });
    }
    parentAuthor = p.author_name;
    parentExcerpt = (p.content as string).slice(0, 120);
  }

  const okTurnstile = await verifyTurnstile(turnstileToken, ip);
  if (!okTurnstile) {
    return NextResponse.json({ error: 'Verification failed. Please retry.' }, { status: 400 });
  }

  // Auto-flag obvious spam (>3 URLs in body)
  const urlCount = (content.match(/https?:\/\//gi) ?? []).length;
  const status = urlCount > 3 ? 'spam' : 'visible';

  const insertRes = await supabase
    .from('post_comments')
    .insert({
      post_slug: slug,
      author_name: name,
      author_email: email,
      content,
      status,
      parent_id: parentId,
      ip_hash: hashIp(ip),
    })
    .select('id, author_name, content, created_at, status, parent_id')
    .single();

  if (insertRes.error) {
    return NextResponse.json({ error: 'DB error', detail: insertRes.error.message }, { status: 500 });
  }

  // Notify admin via email (non-blocking failure — log but don't fail the request).
  const post = getIndexedPost(slug);
  await notifyNewComment({
    slug,
    postTitle: post?.title_ko || post?.title_en,
    authorName: name,
    authorEmail: email,
    content,
    status,
    ipHash: hashIp(ip),
    parentAuthor,
    parentExcerpt,
  });

  // Don't return spam-flagged comments to client (avoid revealing the filter)
  if (status === 'spam') {
    return NextResponse.json({ ok: true, queued: true });
  }
  const { id, author_name, content: c, created_at, parent_id } = insertRes.data;
  return NextResponse.json({ ok: true, comment: { id, author_name, content: c, created_at, parent_id } });
}
