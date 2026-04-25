'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 mt-8 mb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 text-sm text-text-muted hover:text-accent disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`min-w-[2rem] px-2 py-1 text-sm rounded transition-colors ${
            page === currentPage
              ? 'bg-accent text-white font-bold'
              : 'text-text-muted hover:text-accent hover:bg-surface-muted'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-sm text-text-muted hover:text-accent disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        →
      </button>
    </nav>
  );
}
