import { notFound } from 'next/navigation';
import { isValidLocale, LOCALES, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { getNavTabsFromIndex } from '@/lib/tabs-server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import Header from '@/components/Header';
import AdminBar from '@/components/admin/AdminBar';
import Footer from '@/components/Footer';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang as Locale);
  const navTabs = await getNavTabsFromIndex(lang);
  const isAdmin = await isAdminAuthenticated();

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Header locale={lang as Locale} dict={dict} navTabs={navTabs} />
      {isAdmin && <AdminBar locale={lang} />}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer copyright={dict.footer.copyright} locale={lang} />
    </div>
  );
}
