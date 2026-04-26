import Image from 'next/image';
import type { KoSectionMedia, LocalizedMediaItem } from '@/lib/about';

interface SectionLabels {
  around_the_web_ko: string;
  around_the_web_en: string;
  media: string;        // "Media" group header
  talks: string;
  interviews: string;
  speaking: string;
  books: string;        // also serves as the "Books & Writings" group header
  etc: string;          // "Etc." group header
  research: string;
  code: string;
}

interface AroundTheWebProps {
  labels: SectionLabels;
  koSection: KoSectionMedia;
  enSection: LocalizedMediaItem[];
}

type Aspect = 'video' | '4/3' | '3/4';

const ASPECT_CLASS: Record<Aspect, string> = {
  video: 'aspect-video',
  '4/3':  'aspect-[4/3]',
  '3/4':  'aspect-[3/4]',
};

// Per-aspect grid columns. Wider cards (16:9) need fewer columns to stay legible.
const GRID_COLS: Record<Aspect, string> = {
  video: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  '4/3':  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  '3/4':  'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
};

// Renders "Featured Elsewhere (Korean)" with the trailing parenthetical
// dropped to a smaller, muted style and the parens stripped — keeps the
// language tag from competing visually with the section name.
function SectionHeading({ label }: { label: string }) {
  const m = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return (
    <h2 className="text-base font-[540] text-text-primary tracking-tight mb-5">
      {m ? m[1] : label}
      {m && (
        <span className="ml-2 text-xs font-normal text-text-muted">{m[2]}</span>
      )}
    </h2>
  );
}

function GroupHeading({ label }: { label: string }) {
  return (
    <h3 className="text-sm font-[540] text-text-primary tracking-tight mb-3 mt-6 first:mt-0">
      {label}
    </h3>
  );
}

function SubHeading({ label }: { label: string }) {
  return (
    <h4 className="text-xs uppercase tracking-wide text-text-muted mb-2">{label}</h4>
  );
}

function MediaCard({ item, aspect }: { item: LocalizedMediaItem; aspect: Aspect }) {
  const isExternal = item.url.startsWith('http');
  return (
    <a
      href={item.url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="group block"
    >
      <div className={`relative ${ASPECT_CLASS[aspect]} overflow-hidden rounded-sm bg-bg-surface border border-line-default`}>
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-text-muted">
            {item.title}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-text-primary leading-snug group-hover:text-accent transition-colors">
        {item.title}
      </div>
      {(item.role || item.source || item.year) && (
        <div className="mt-0.5 text-[11px] text-text-muted">
          {[item.role, item.source, item.year].filter(Boolean).join(' · ')}
        </div>
      )}
    </a>
  );
}

function MediaGallery({
  heading,
  items,
  aspect,
}: {
  heading?: string;
  items: LocalizedMediaItem[];
  aspect: Aspect;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      {heading && <SubHeading label={heading} />}
      <div className={`grid ${GRID_COLS[aspect]} gap-x-3 gap-y-4`}>
        {items.map((item, i) => (
          <MediaCard key={`${item.url}-${i}`} item={item} aspect={aspect} />
        ))}
      </div>
    </div>
  );
}

function BooksGallery({ items }: { items: LocalizedMediaItem[] }) {
  if (items.length === 0) return null;
  // Authored/co-authored ("공저") vs contributed/edited ("참여", "감수", etc.) — split with a divider.
  const authored = items.filter(i => i.role === '공저');
  const others   = items.filter(i => i.role !== '공저');
  const mobileGrid = 'grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-4';

  if (authored.length === 0 || others.length === 0) {
    return (
      <div className="mb-5">
        <div className={`grid ${GRID_COLS['3/4']} gap-x-3 gap-y-4`}>
          {items.map((item, i) => <MediaCard key={`${item.url}-${i}`} item={item} aspect="3/4" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      {/* Mobile/tablet: stacked groups with horizontal divider */}
      <div className="md:hidden">
        <div className={mobileGrid}>
          {authored.map((item, i) => <MediaCard key={`a-${item.url}-${i}`} item={item} aspect="3/4" />)}
        </div>
        <div className="border-t border-line-default my-5" />
        <div className={mobileGrid}>
          {others.map((item, i) => <MediaCard key={`o-${item.url}-${i}`} item={item} aspect="3/4" />)}
        </div>
      </div>

      {/* Desktop: single row with vertical divider between the two groups */}
      <div className="hidden md:flex md:items-stretch md:gap-x-3">
        {authored.map((item, i) => (
          <div key={`a-${item.url}-${i}`} className="w-1/5">
            <MediaCard item={item} aspect="3/4" />
          </div>
        ))}
        <div className="border-l border-line-default mx-2 self-stretch" />
        {others.map((item, i) => (
          <div key={`o-${item.url}-${i}`} className="w-1/5">
            <MediaCard item={item} aspect="3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedSection({
  heading,
  section,
  labels,
}: {
  heading: string;
  section: KoSectionMedia;
  labels: SectionLabels;
}) {
  const mediaCount =
    section.media.talks.length + section.media.interviews.length + section.media.speaking.length;
  const etcCount = section.etc.research.length + section.etc.code.length;
  if (mediaCount + section.books.length + etcCount === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t border-line-default">
      <SectionHeading label={heading} />

      {mediaCount > 0 && (
        <>
          <GroupHeading label={labels.media} />
          <MediaGallery heading={labels.talks}      items={section.media.talks}      aspect="video" />
          <MediaGallery heading={labels.interviews} items={section.media.interviews} aspect="4/3" />
          <MediaGallery heading={labels.speaking}   items={section.media.speaking}   aspect="4/3" />
        </>
      )}

      {section.books.length > 0 && (
        <>
          <GroupHeading label={labels.books} />
          <BooksGallery items={section.books} />
        </>
      )}

      {etcCount > 0 && (
        <>
          <GroupHeading label={labels.etc} />
          <MediaGallery heading={labels.research} items={section.etc.research} aspect="4/3" />
          <MediaGallery heading={labels.code}     items={section.etc.code}     aspect="4/3" />
        </>
      )}
    </section>
  );
}

export default function AroundTheWeb({ labels, koSection, enSection }: AroundTheWebProps) {
  return (
    <>
      <FeaturedSection heading={labels.around_the_web_ko} section={koSection} labels={labels} />
      {enSection.length > 0 && (
        <section className="mt-10 pt-8 border-t border-line-default">
          <SectionHeading label={labels.around_the_web_en} />
          {/* Curated 4-card row: 2 cols on mobile, 4 across from sm up. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
            {enSection.map((item, i) => (
              <MediaCard key={`${item.url}-${i}`} item={item} aspect="video" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
