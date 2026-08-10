'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CHANNEL_META } from '@/lib/config';
import type { ChannelType, MemberRole } from '@/lib/types';

const CHANNEL_OPTIONS: ChannelType[] = [
  'instagram',
  'facebook',
  'linkedin',
  'google_business',
  'tiktok',
  'youtube',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orgName, setOrgName] = useState('');
  const [segment, setSegment] = useState('');
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [invites, setInvites] = useState<{ email: string; role: MemberRole }[]>(
    []
  );

  function toggleChannel(ch: ChannelType) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  function addInvite() {
    setInvites((prev) => [...prev, { email: '', role: 'member' }]);
  }

  function updateInvite(i: number, field: 'email' | 'role', value: string) {
    setInvites((prev) =>
      prev.map((inv, idx) => (idx === i ? { ...inv, [field]: value } : inv))
    );
  }

  function removeInvite(i: number) {
    setInvites((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleComplete() {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc(
        'complete_onboarding',
        {
          p_org_name: orgName,
          p_segment: segment || null,
          p_channels: channels,
        }
      );

      if (rpcError) throw rpcError;

      const validInvites = invites.filter((inv) => inv.email.trim());
      if (validInvites.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const orgId = (data as Record<string, string>).organization_id;

        for (const inv of validInvites) {
          await supabase.from('invitations').insert({
            organization_id: orgId,
            email: inv.email.toLowerCase().trim(),
            role: inv.role,
            invited_by: user?.id,
          });
        }
      }

      router.push('/registrar');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="bg-surface rounded-md p-8 max-w-lg w-full shadow-sm">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-sm transition-colors ${
                s <= step ? 'bg-brand' : 'bg-line'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-negative/10 text-negative text-sm rounded-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-ink mb-6">Sua empresa</h2>
            <label className="block text-sm text-ink-soft mb-1">
              Nome da empresa
            </label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-4"
              autoFocus
            />
            <label className="block text-sm text-ink-soft mb-1">
              Segmento (opcional)
            </label>
            <input
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-6"
              placeholder="Ex: tecnologia, varejo, saude"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!orgName.trim()}
              className="w-full bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
            >
              Continuar
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-ink mb-2">
              Canais da marca
            </h2>
            <p className="text-sm text-ink-soft mb-6">
              Selecione os canais que a marca usa
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CHANNEL_OPTIONS.map((ch) => {
                const meta = CHANNEL_META[ch];
                const selected = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-md border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-line text-ink-soft hover:border-ink-soft'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-line text-ink py-2 rounded-sm text-base font-medium hover:bg-paper"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={channels.length === 0}
                className="flex-1 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-ink mb-2">
              Convide o time
            </h2>
            <p className="text-sm text-ink-soft mb-6">
              Leitores podem ver tudo, mas nao editam. Nao consomem assento.
            </p>

            {invites.map((inv, i) => (
              <div key={i} className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={inv.email}
                  onChange={(e) => updateInvite(i, 'email', e.target.value)}
                  className="flex-1 border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                  placeholder="email@empresa.com"
                />
                <select
                  value={inv.role}
                  onChange={(e) =>
                    updateInvite(i, 'role', e.target.value)
                  }
                  className="border border-line rounded-sm px-2 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                >
                  <option value="member">Editor</option>
                  <option value="viewer">Leitor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeInvite(i)}
                  className="px-2 text-ink-soft hover:text-negative text-lg leading-none"
                  aria-label="Remover"
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addInvite}
              className="text-sm text-brand font-medium mb-6 hover:underline"
            >
              + Adicionar pessoa
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-line text-ink py-2 rounded-sm text-base font-medium hover:bg-paper"
              >
                Voltar
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
              >
                {loading
                  ? 'Criando...'
                  : invites.length > 0
                    ? 'Criar e convidar'
                    : 'Criar empresa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
