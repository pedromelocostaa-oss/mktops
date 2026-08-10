'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="bg-surface rounded-md p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 bg-brand/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-ink">Verifique seu e-mail</p>
          <p className="text-sm text-ink-soft mt-2">
            Enviamos um link de acesso para <strong>{email}</strong>
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-brand hover:underline"
          >
            Usar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <form
        onSubmit={handleLogin}
        className="bg-surface rounded-md p-8 max-w-sm w-full shadow-sm"
      >
        <h1 className="text-xl font-semibold text-ink mb-1">mkt-ops</h1>
        <p className="text-sm text-ink-soft mb-6">
          Entre com seu e-mail para acessar
        </p>
        <label className="block text-sm text-ink-soft mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand"
          placeholder="seu@email.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar link de acesso'}
        </button>
      </form>
    </div>
  );
}
