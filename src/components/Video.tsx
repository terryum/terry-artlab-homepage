'use client';

interface VideoProps {
  src: string;
  caption?: string;
  type?: 'youtube' | 'vimeo' | 'direct';
}

function toEmbedUrl(src: string, type?: string): string {
  if (type === 'youtube' || (!type && (src.includes('youtube.com') || src.includes('youtu.be')))) {
    const match = src.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }
  if (type === 'vimeo' || (!type && src.includes('vimeo.com'))) {
    const match = src.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  return src;
}

function isIframe(src: string, type?: string): boolean {
  if (type === 'direct') return false;
  return (
    src.includes('youtube') ||
    src.includes('youtu.be') ||
    src.includes('vimeo.com') ||
    type === 'youtube' ||
    type === 'vimeo'
  );
}

export default function Video({ src, caption, type }: VideoProps) {
  const useIframe = isIframe(src, type);
  const embedSrc = useIframe ? toEmbedUrl(src, type) : src;

  return (
    <figure className="my-6">
      <div className="rounded-lg overflow-hidden bg-bg-surface">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {useIframe ? (
            <iframe
              src={embedSrc}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <video
              src={embedSrc}
              className="absolute inset-0 w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          )}
        </div>
      </div>
      {caption && (
        <figcaption className="text-sm text-text-muted text-left mt-2 leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
