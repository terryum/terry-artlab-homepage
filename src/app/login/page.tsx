import { redirect } from 'next/navigation';
import { getCurrentIdentity } from '@/lib/identity';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo, error } = await searchParams;

  if (!error) {
    const id = await getCurrentIdentity();
    if (id) {
      const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/posts';
      redirect(target);
    }
  }

  return <LoginForm redirectTo={redirectTo} error={error} />;
}
