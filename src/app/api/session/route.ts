import { NextResponse } from 'next/server';
import { getAudience } from '@/lib/audience';

export const dynamic = 'force-dynamic';

export async function GET() {
  const audience = await getAudience();
  const sessionLabel = audience.isAdmin
    ? 'Admin'
    : audience.group
      ? audience.group.toUpperCase()
      : null;
  return NextResponse.json({
    isAdmin: audience.isAdmin,
    group: audience.group,
    sessionLabel,
  });
}
