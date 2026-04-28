import { redirect } from 'next/navigation';
import { readSignupClaim } from '@/lib/signup-token';
import { getCurrentIdentity } from '@/lib/identity';
import SignupForm from '@/components/SignupForm';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { redirect: redirectTo, error } = await searchParams;

  // Already authenticated → home.
  const id = await getCurrentIdentity();
  if (id) {
    const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/';
    redirect(target);
  }

  // Must come from a verified Google OAuth callback.
  const claim = await readSignupClaim();
  if (!claim) {
    redirect(`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`);
  }

  return (
    <SignupForm
      email={claim.email}
      name={claim.name}
      redirectTo={redirectTo ?? '/'}
      error={error}
    />
  );
}
