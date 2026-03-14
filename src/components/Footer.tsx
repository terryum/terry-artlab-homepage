import Link from 'next/link';
import { Container } from './ui/Container';
import { SITE_CONFIG } from '@/lib/site-config';

interface FooterProps {
  copyright: string;
  locale: string;
}

export default function Footer({ copyright, locale }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line-default mt-16">
      <Container className="py-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="font-semibold text-text-primary tracking-tight hover:text-accent transition-colors"
          >
            {SITE_CONFIG.name}
          </Link>
          <p className="text-sm text-text-muted">
            &copy; {year} {copyright}
          </p>
        </div>
      </Container>
    </footer>
  );
}
