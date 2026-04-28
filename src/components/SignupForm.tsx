'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignupFormProps {
  email: string;
  name: string;
  redirectTo: string;
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_key: '가입키가 올바르지 않습니다.',
  expired: '인증이 만료되었습니다. 다시 로그인해주세요.',
  rate_limited: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
};

export default function SignupForm({ email, name, redirectTo, error }: SignupFormProps) {
  const [key, setKey] = useState('');
  const [formError, setFormError] = useState(error ? (ERROR_MESSAGES[error] ?? error) : '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setFormError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), redirect: redirectTo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = (data as { error?: string }).error;
        setFormError(ERROR_MESSAGES[code ?? ''] ?? data.error ?? '가입이 거절되었습니다.');
        return;
      }
      const data = await res.json();
      router.push(data.redirect ?? redirectTo ?? '/');
      router.refresh();
    } catch {
      setFormError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-medium text-text-primary">가입키 입력</h1>
          <p className="text-xs text-text-muted">
            {name || email} 계정으로 처음 접속하셨습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="가입키"
            autoFocus
            className="w-full px-3 py-2 border border-line-default rounded-md bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full px-3 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '확인 중...' : '가입'}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center">
          가입키를 모르시는 경우 사이트 운영자에게 문의해주세요.
        </p>
      </div>
    </div>
  );
}
