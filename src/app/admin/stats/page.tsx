'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

type PresetKind = '7d' | '30d' | '90d' | 'all';
type Period =
  | { kind: PresetKind }
  | { kind: 'custom'; startDate: string; endDate: string };
type PostLocale = 'all' | 'ko' | 'en';
type SortKey = 'views' | 'visitors' | 'avgTime';
type SortDir = 'asc' | 'desc';

interface StatsData {
  kpi: {
    visitors: number;
    pageviews: number;
    engagementRate: number;
    avgSessionDuration: number;
  };
  trend: { date: string; visitors: number; pageviews: number }[];
  sources: { source: string; medium: string; sessions: number; visitors: number }[];
  countries: { country: string; visitors: number }[];
  posts: { path: string; locale: string; slug: string; number: string | null; exists: boolean; pageviews: number; visitors: number; avgDuration: number }[];
  period: string;
  dateRange: { startDate: string; endDate: string };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatRangeLabel(startDate: string, endDate: string): string {
  const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return `${fmt.format(start)} – ${fmt.format(end)} · ${days} day${days === 1 ? '' : 's'}`;
}

// recharts — SSR 제외하여 브라우저에서만 로드
const TrendChart = dynamic(() => import('./TrendChart'), { ssr: false, loading: () => <ChartSkeleton /> });
const SourcesChart = dynamic(() => import('./SourcesChart'), { ssr: false, loading: () => <ChartSkeleton /> });
const CountriesChart = dynamic(() => import('./CountriesChart'), { ssr: false, loading: () => <ChartSkeleton /> });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function ChartSkeleton() {
  return <div className="h-48 bg-bg-secondary rounded-md animate-pulse" />;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line-default rounded-md p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>({ kind: '7d' });
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState(todayIso());
  const [postLocale, setPostLocale] = useState<PostLocale>('all');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('views');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sortFieldOf = (p: { pageviews: number; visitors: number; avgDuration: number }, key: SortKey) =>
    key === 'views' ? p.pageviews : key === 'visitors' ? p.visitors : p.avgDuration;

  const periodKey = useMemo(
    () =>
      period.kind === 'custom'
        ? `custom:${period.startDate}:${period.endDate}`
        : period.kind,
    [period],
  );

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true);
    setError('');
    try {
      const qs =
        p.kind === 'custom'
          ? `period=custom&startDate=${p.startDate}&endDate=${p.endDate}`
          : `period=${p.kind}`;
      const res = await fetch(`/api/admin/stats?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error ? (body.detail ? `${body.error}: ${body.detail}` : body.error) : `Stats API ${res.status}`;
        throw new Error(msg);
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey, fetchStats]);

  const customValid =
    /^\d{4}-\d{2}-\d{2}$/.test(customStart) &&
    /^\d{4}-\d{2}-\d{2}$/.test(customEnd) &&
    customStart <= customEnd &&
    customEnd <= todayIso();

  const applyCustom = () => {
    if (!customValid) return;
    setPeriod({ kind: 'custom', startDate: customStart, endDate: customEnd });
  };

  const isActive = (kind: PresetKind) => period.kind === kind;

  const filteredPosts = (data?.posts.filter(
    (p) => postLocale === 'all' || p.locale === postLocale
  ) ?? []).slice().sort((a, b) => {
    const av = sortFieldOf(a, sortBy);
    const bv = sortFieldOf(b, sortBy);
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const sortArrow = (key: SortKey) =>
    sortBy === key ? (sortDir === 'desc' ? '↓' : '↑') : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium text-text-primary">Stats</h1>
        <div className="flex flex-wrap items-center gap-1">
          {(['7d', '30d', '90d', 'all'] as PresetKind[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setShowCustom(false);
                setPeriod({ kind: p });
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isActive(p)
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-accent border border-line-default'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
          <button
            onClick={() => setShowCustom((v) => !v)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period.kind === 'custom' || showCustom
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-accent border border-line-default'
            }`}
          >
            Custom…
          </button>
        </div>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-2 -mt-2">
          <label className="flex flex-col text-xs text-text-secondary">
            Start
            <input
              type="date"
              value={customStart}
              max={customEnd || todayIso()}
              min="2020-01-01"
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 px-2 py-1 text-sm border border-line-default rounded-md bg-bg-primary text-text-primary"
            />
          </label>
          <label className="flex flex-col text-xs text-text-secondary">
            End
            <input
              type="date"
              value={customEnd}
              min={customStart || '2020-01-01'}
              max={todayIso()}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-1 px-2 py-1 text-sm border border-line-default rounded-md bg-bg-primary text-text-primary"
            />
          </label>
          <button
            onClick={applyCustom}
            disabled={!customValid}
            className="px-3 py-1 text-sm rounded-md bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}

      {data && (
        <p className="text-xs text-text-secondary -mt-2">
          {formatRangeLabel(data.dateRange.startDate, data.dateRange.endDate)}
        </p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-line-default rounded-md p-4 h-20 animate-pulse bg-bg-secondary" />
            ))}
          </div>
          <ChartSkeleton />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Visitors" value={data.kpi.visitors.toLocaleString()} />
            <KpiCard label="Pageviews" value={data.kpi.pageviews.toLocaleString()} />
            <KpiCard label="Engagement" value={`${(data.kpi.engagementRate * 100).toFixed(1)}%`} />
            <KpiCard label="Avg Duration" value={formatDuration(data.kpi.avgSessionDuration)} />
          </div>

          {/* Trend Chart */}
          <div>
            <h2 className="text-sm font-medium text-text-primary mb-3">방문자 트렌드</h2>
            <TrendChart data={data.trend} />
          </div>

          {/* Sources + Countries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-text-primary mb-3">유입경로</h2>
              <SourcesChart data={data.sources} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-text-primary mb-3">국가별 방문자</h2>
              <CountriesChart data={data.countries} />
            </div>
          </div>

          {/* Posts Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-text-primary">포스팅별 조회수</h2>
              <div className="flex gap-1">
                {(['all', 'ko', 'en'] as PostLocale[]).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setPostLocale(loc)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      postLocale === loc
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:text-accent border border-line-default'
                    }`}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto border border-line-default rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-default bg-bg-secondary">
                    <th className="text-left px-3 py-2 text-text-secondary font-medium w-16">#</th>
                    <th className="text-left px-3 py-2 text-text-secondary font-medium">Slug</th>
                    <th className="text-center px-3 py-2 text-text-secondary font-medium">Lang</th>
                    <th className="text-right px-3 py-2 text-text-secondary font-medium">
                      <button
                        onClick={() => handleSort('views')}
                        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        Views <span className="text-text-muted">{sortArrow('views') || '↕'}</span>
                      </button>
                    </th>
                    <th className="text-right px-3 py-2 text-text-secondary font-medium">
                      <button
                        onClick={() => handleSort('visitors')}
                        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        Visitors <span className="text-text-muted">{sortArrow('visitors') || '↕'}</span>
                      </button>
                    </th>
                    <th className="text-right px-3 py-2 text-text-secondary font-medium">
                      <button
                        onClick={() => handleSort('avgTime')}
                        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        Avg Time <span className="text-text-muted">{sortArrow('avgTime') || '↕'}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-text-secondary">No data</td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr
                        key={post.path}
                        className={`border-b border-line-default last:border-b-0 ${
                          post.exists ? '' : 'opacity-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-text-secondary font-mono text-xs">{post.number ?? ''}</td>
                        <td className="px-3 py-2 text-text-primary truncate max-w-xs">
                          <span>{post.slug}</span>
                          {!post.exists && (
                            <span className="ml-2 text-xs text-text-muted">(deleted)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-text-secondary uppercase text-xs">{post.locale}</td>
                        <td className="text-right px-3 py-2 text-text-secondary tabular-nums">{post.pageviews.toLocaleString()}</td>
                        <td className="text-right px-3 py-2 text-text-secondary tabular-nums">{post.visitors.toLocaleString()}</td>
                        <td className="text-right px-3 py-2 text-text-secondary tabular-nums">{formatDuration(post.avgDuration)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
