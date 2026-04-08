import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ redirect?: string }>;
}

// Legacy route — redirect to unified /login page
export default async function GroupPortalPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  const target = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
  redirect(target);
}
