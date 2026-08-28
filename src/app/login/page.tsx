'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function translateError(err: { message?: string; code?: string; status?: number } | null): string {
    if (!err) return 'Algo deu errado. Tente de novo.';
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';

    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
      return 'Sem conexao com o servidor. Verifique sua internet e tente de novo.';
    }
    if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
      return 'Seu e-mail ainda nao foi confirmado. Verifique sua caixa de entrada.';
    }
    if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('user already')) {
      return 'Ja existe uma conta com esse e-mail. Va para a aba Entrar.';
    }
    if (code === 'weak_password' || msg.includes('password should be') || msg.includes('weak password')) {
      return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    }
    if (code === 'validation_failed' || msg.includes('invalid email')) {
      return 'E-mail invalido. Verifique o formato (ex: nome@dominio.com).';
    }
    if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.';
    }
    if (err.status === 500 || err.status === 502 || err.status === 503) {
      return 'Servidor temporariamente indisponivel. Tente de novo em instantes.';
    }
    return err.message || 'Algo deu errado. Tente de novo.';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Digite um e-mail valido (ex: nome@dominio.com).');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Digite seu nome para criar a conta.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(translateError(err));
          setLoading(false);
          return;
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() || null } },
        });
        if (err) {
          setError(translateError(err));
          setLoading(false);
          return;
        }
        if (!data.session) {
          setError('Conta criada, mas o login automatico falhou. Va para Entrar e use seu e-mail e senha.');
          setLoading(false);
          setMode('login');
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(translateError(err as { message?: string }));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, #0f2318 0%, #1B3A2F 40%, #2a5a48 70%, #1B3A2F 100%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-8 4 5 5-9" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            mkt-ops
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Registro e relatorio de marketing
          </p>
        </div>

        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
          <div className="flex">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="flex-1 relative py-3.5 text-sm font-semibold transition-colors"
              style={{ color: mode === 'login' ? '#1B3A2F' : '#6E7673' }}
            >
              Entrar
              {mode === 'login' && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ backgroundColor: '#1B3A2F' }} />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className="flex-1 relative py-3.5 text-sm font-semibold transition-colors"
              style={{ color: mode === 'signup' ? '#1B3A2F' : '#6E7673' }}
            >
              Criar conta
              {mode === 'signup' && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ backgroundColor: '#1B3A2F' }} />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#6E7673' }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3.5 py-2.5 text-[15px] bg-white transition-all focus:outline-none focus:ring-2"
                  style={{ borderColor: '#DEE0DA', color: '#14171A' }}
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#6E7673' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border rounded-lg px-3.5 py-2.5 text-[15px] bg-white transition-all focus:outline-none focus:ring-2"
                style={{ borderColor: '#DEE0DA', color: '#14171A' }}
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#6E7673' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border rounded-lg px-3.5 py-2.5 text-[15px] bg-white transition-all focus:outline-none focus:ring-2"
                style={{ borderColor: '#DEE0DA', color: '#14171A' }}
                placeholder={mode === 'signup' ? 'Minimo 6 caracteres' : '••••••••'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-[15px] font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1B3A2F 0%, #2a5a48 100%)',
                boxShadow: '0 2px 8px rgba(27, 58, 47, 0.3)',
              }}
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-8">
          mkt-ops
        </p>
      </div>
    </div>
  );
}
