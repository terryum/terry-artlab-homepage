import { redirect } from 'next/navigation';
import { canAccessGroup, isAdminSession, getAuthenticatedGroup } from '@/lib/group-auth';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;

  // Already authenticated → redirect
  const [group, isAdmin] = await Promise.all([
    getAuthenticatedGroup(),
    isAdminSession(),
  ]);
  if (group || isAdmin) {
    const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/posts';
    redirect(target);
  }

  return <LoginForm redirectTo={redirectTo} />;
}
