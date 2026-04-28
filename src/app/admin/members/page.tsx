'use client';

import { useCallback, useEffect, useState } from 'react';

interface AdminMember {
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  group_slug: string | null;
  created_at: string;
  last_login_at: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/members');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { members: AdminMember[] };
      setMembers(data.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (m: AdminMember) => {
    if (!confirm(`Remove member ${m.email}? They will need to re-enter an invite key on next login.`)) return;
    const res = await fetch(`/api/admin/members?email=${encodeURIComponent(m.email)}`, { method: 'DELETE' });
    if (res.ok) void load();
    else alert(`Remove failed: HTTP ${res.status}`);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Members</h1>
        <span className="text-xs text-text-muted">{members.length} total</span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-text-muted">No members yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line-default rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-default bg-bg-secondary text-left">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Last login</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-line-default last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{m.email}</td>
                  <td className="px-3 py-2">{m.name ?? ''}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        m.role === 'admin'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-bg-surface text-text-secondary'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-muted">{m.group_slug ?? '—'}</td>
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                    {new Date(m.last_login_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => remove(m)}
                      disabled={m.role === 'admin'}
                      className="text-xs px-2 py-0.5 border border-red-300 text-red-500 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={m.role === 'admin' ? 'Cannot remove admin' : 'Remove member'}
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
