import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { isAdminFromRequest } from '@/lib/identity';
import postsIndex from '../../../../../posts/index.json';
import surveysBundle from '../../../../../projects/surveys/surveys.json';
import projectsBundle from '../../../../../projects/gallery/projects.json';

export const runtime = 'nodejs';

const POST_NUMBERS = new Map<string, number>(
  (postsIndex as { posts: Array<{ slug: string; post_number: number }> }).posts
    .map((p) => [p.slug, p.post_number]),
);
const SURVEY_NUMBERS = new Map<string, number>(
  (surveysBundle as { surveys: Array<{ slug: string; survey_number: number }> }).surveys
    .map((s) => [s.slug, s.survey_number]),
);
const PROJECT_NUMBERS = new Map<string, number>(
  (projectsBundle as { projects: Array<{ slug: string; project_number?: number }> }).projects
    .filter((p): p is { slug: string; project_number: number } => p.project_number != null)
    .map((p) => [p.slug, p.project_number]),
);

function formatNumberForPath(kind: string, slug: string): string | null {
  if (kind === 'posts') {
    const n = POST_NUMBERS.get(slug);
    return n != null ? `#${n}` : null;
  }
  if (kind === 'surveys') {
    const n = SURVEY_NUMBERS.get(slug);
    return n != null ? `#S${n}` : null;
  }
  if (kind === 'projects') {
    const n = PROJECT_NUMBERS.get(slug);
    return n != null ? `#P${n}` : null;
  }
  return null;
}

// GA4 Data API is called via REST (not the @google-analytics/data gRPC SDK)
// so the route works on Cloudflare Workers, where gRPC over HTTP/2 is not viable.

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface GA4Row {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

interface GA4ReportResponse {
  rows?: GA4Row[];
}

function loadServiceAccount(): ServiceAccount {
  const encoded = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!encoded) throw new Error('GA4_SERVICE_ACCOUNT_JSON is not set');
  const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  if (!json.client_email || !json.private_key) {
    throw new Error('Service account JSON missing client_email or private_key');
  }
  return { client_email: json.client_email, private_key: json.private_key };
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const privateKey = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/analytics.readonly' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`OAuth token exchange failed (${tokenRes.status}): ${text.slice(0, 200)}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error('OAuth token exchange returned no access_token');
  return access_token;
}

async function runReport(propertyId: string, token: string, body: Record<string, unknown>): Promise<GA4ReportResponse> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<GA4ReportResponse>;
}

const PERIOD_MAP: Record<string, string> = {
  '7d': '7daysAgo',
  '30d': '30daysAgo',
  '90d': '90daysAgo',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function presetStartIso(period: string): string {
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function fetchPropertyCreateDate(propertyId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { createTime?: string };
    return json.createTime ? json.createTime.slice(0, 10) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ error: 'GA4_PROPERTY_ID not configured' }, { status: 500 });
  }

  const sp = request.nextUrl.searchParams;
  const period = sp.get('period') || '7d';
  const today = todayIso();

  let startDate: string;
  let endDate: string;

  if (period === 'custom') {
    const s = sp.get('startDate') ?? '';
    const e = sp.get('endDate') ?? '';
    if (!DATE_RE.test(s) || !DATE_RE.test(e)) {
      return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD required)' }, { status: 400 });
    }
    if (s > e) {
      return NextResponse.json({ error: 'startDate must be on or before endDate' }, { status: 400 });
    }
    if (e > today) {
      return NextResponse.json({ error: 'endDate cannot be in the future' }, { status: 400 });
    }
    if (s < '2020-01-01') {
      return NextResponse.json({ error: 'startDate cannot be before 2020-01-01' }, { status: 400 });
    }
    startDate = s;
    endDate = e;
  } else if (period === 'all') {
    startDate = process.env.GA4_START_DATE ?? '2020-01-01';
    endDate = today;
  } else if (PERIOD_MAP[period]) {
    startDate = presetStartIso(period);
    endDate = today;
  } else {
    startDate = presetStartIso('7d');
    endDate = today;
  }

  const dateRanges = [{ startDate, endDate }];

  try {
    const sa = loadServiceAccount();
    const token = await getAccessToken(sa);

    if (period === 'all' && !process.env.GA4_START_DATE) {
      const created = await fetchPropertyCreateDate(propertyId, token);
      if (created) {
        startDate = created;
        dateRanges[0].startDate = created;
      }
    }

    const [kpiRes, trendRes, sourcesRes, countriesRes, postsRes] = await Promise.all([
      runReport(propertyId, token, {
        dateRanges,
        metrics: [
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'averageSessionDuration' },
        ],
        dimensionFilter: {
          orGroup: {
            expressions: [
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/ko/posts/' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/en/posts/' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/ko/surveys/' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/en/surveys/' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/ko/projects/' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/en/projects/' } } },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 30,
      }),
    ]);

    const kpiRow = kpiRes.rows?.[0];
    const kpi = {
      visitors: Number(kpiRow?.metricValues?.[0]?.value ?? 0),
      pageviews: Number(kpiRow?.metricValues?.[1]?.value ?? 0),
      engagementRate: Number(kpiRow?.metricValues?.[2]?.value ?? 0),
      avgSessionDuration: Number(kpiRow?.metricValues?.[3]?.value ?? 0),
    };

    const trend = (trendRes.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? '',
      visitors: Number(row.metricValues?.[0]?.value ?? 0),
      pageviews: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    const sources = (sourcesRes.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? '',
      medium: row.dimensionValues?.[1]?.value ?? '',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      visitors: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    const countries = (countriesRes.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? '',
      visitors: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    const posts = (postsRes.rows ?? []).map((row) => {
      const path = row.dimensionValues?.[0]?.value ?? '';
      const match = path.match(/^\/(ko|en)\/(posts|surveys|projects)\/(.+)$/);
      const locale = match?.[1] ?? '';
      const kind = match?.[2] ?? 'posts';
      const slug = match?.[3] ?? path;
      const number = formatNumberForPath(kind, slug);
      return {
        path,
        locale,
        slug,
        number,
        exists: number != null,
        pageviews: Number(row.metricValues?.[0]?.value ?? 0),
        visitors: Number(row.metricValues?.[1]?.value ?? 0),
        avgDuration: Number(row.metricValues?.[2]?.value ?? 0),
      };
    });

    return NextResponse.json({
      kpi,
      trend,
      sources,
      countries,
      posts,
      period,
      dateRange: { startDate, endDate },
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[admin/stats] GA4 REST failed:', err instanceof Error ? err.stack : err);
    return NextResponse.json({ error: 'Failed to fetch analytics data', detail }, { status: 500 });
  }
}
