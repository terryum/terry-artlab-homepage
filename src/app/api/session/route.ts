import { NextResponse } from 'next/server';
import { getAuthenticatedGroup, isAdminSession } from '@/lib/group-auth';

export async function GET() {
  const [group, admin] = await Promise.all([
    getAuthenticatedGroup(),
    isAdminSession(),
  ]);
  const sessionLabel = admin ? 'Admin' : group ? group.toUpperCase() : null;
  return NextResponse.json({ sessionLabel });
}
