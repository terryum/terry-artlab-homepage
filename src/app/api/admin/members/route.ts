import { NextRequest, NextResponse } from 'next/server';
import { isAdminFromRequest } from '@/lib/identity';
import { listMembers, removeMember, getMember } from '@/lib/members';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }
  const members = await listMembers();
  return NextResponse.json({ members });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 });
  }

  // Prevent self-deletion / admin-deletion (table also has admins).
  const target = await getMember(email);
  if (!target) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'cannot_remove_admin' }, { status: 400 });
  }

  const ok = await removeMember(email);
  if (!ok) return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
