'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const safeRedirect = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/posts';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id.trim() || !password.trim()) return;
    setError('');
    setLoading(true);

    try {
      const isAdmin = id.trim().toLowerCase() === 'admin';
      const url = isAdmin ? '/api/admin/login' : '/api/co/login';
      const body = isAdmin
        ? { password: password.trim() }
        : { group: id.trim().toLowerCase(), password: password.trim() };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Invalid ID or password');
        return;
      }

      router.push(safeRedirect);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="text-lg font-medium text-text-primary text-center">
          Login
        </h1>
        <p className="text-sm text-text-secondary text-center">
          Enter your ID and password to access private content.
        </p>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="ID"
          autoFocus
          className="w-full px-3 py-2 border border-line-default rounded-md bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border border-line-default rounded-md bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
