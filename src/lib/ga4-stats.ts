/**
 * GA4 Data API helpers for terryum.ai.
 *
 * GA4 Data API is called via REST (not the @google-analytics/data gRPC SDK)
 * so the route works on Cloudflare Workers, where gRPC over HTTP/2 is not viable.
 */
import { SignJWT, importPKCS8 } from 'jose';

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export interface GA4Row {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

export interface GA4ReportResponse {
  rows?: GA4Row[];
}

export function loadServiceAccount(): ServiceAccount {
  const encoded = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!encoded) throw new Error('GA4_SERVICE_ACCOUNT_JSON is not set');
  const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  if (!json.client_email || !json.private_key) {
    throw new Error('Service account JSON missing client_email or private_key');
  }
  return { client_email: json.client_email, private_key: json.private_key };
}

export async function getAccessToken(sa: ServiceAccount): Promise<string> {
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

export async function runReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>,
): Promise<GA4ReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<GA4ReportResponse>;
}

export async function fetchPropertyCreateDate(
  propertyId: string,
  token: string,
): Promise<string | null> {
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

/* ─── Per-slug pageview aggregation ─── */

interface FetchPageviewsOpts {
  propertyId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  knownSlugs: Set<string>;
}

const POST_PATH_RE = /^\/(?:(ko|en)\/)?posts\/([^/?#]+)\/?$/;

/**
 * Run a single GA4 report keyed by pagePath, then sum pageviews into a
 * slug-keyed map. Aggregates across all path variants per slug:
 *   /posts/<slug>            (legacy share/social-crawler route)
 *   /ko/posts/<slug>
 *   /en/posts/<slug>
 *   (with optional trailing slash on each)
 *
 * Paths that don't match the post URL shape, or whose slug isn't known,
 * are dropped.
 */
export async function fetchPageviewsBySlug(
  opts: FetchPageviewsOpts,
): Promise<Map<string, number>> {
  const { propertyId, startDate, endDate, knownSlugs } = opts;
  const sa = loadServiceAccount();
  const token = await getAccessToken(sa);

  // GA4 dimensionFilter: pagePath BEGINS_WITH any of /posts/, /ko/posts/, /en/posts/
  const report = await runReport(propertyId, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/posts/' } } },
          { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/ko/posts/' } } },
          { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/en/posts/' } } },
        ],
      },
    },
    limit: 5000,
  });

  const result = new Map<string, number>();
  for (const row of report.rows ?? []) {
    const path = (row.dimensionValues?.[0]?.value ?? '').split(/[?#]/)[0];
    const match = POST_PATH_RE.exec(path);
    if (!match) continue;
    const slug = match[2];
    if (!knownSlugs.has(slug)) continue;
    const views = Number(row.metricValues?.[0]?.value ?? 0);
    result.set(slug, (result.get(slug) ?? 0) + views);
  }
  return result;
}
