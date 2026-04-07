import { NextResponse } from 'next/server';

// TEMPORARY debug endpoint — delete after ACL is verified
export async function GET() {
  const envKey = 'CO_SNU_PASSWORD';
  const val = process.env[envKey];
  return NextResponse.json({
    envKey,
    exists: !!val,
    length: val?.length,
    trimmedLength: val?.trim().length,
    firstChar: val?.[0],
    lastChar: val?.[val.length - 1],
    hasNewline: val?.includes('\n'),
    hasCarriageReturn: val?.includes('\r'),
    adminSecretExists: !!process.env.ADMIN_SESSION_SECRET,
    adminSecretLen: process.env.ADMIN_SESSION_SECRET?.length,
  });
}
