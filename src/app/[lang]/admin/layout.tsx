import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect('/admin');
  }

  return <>{children}</>;
}
