'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CHANNEL_META } from '@/lib/config';
import ChannelBadge from '@/components/channel-badge';
import EmptyState from '@/components/empty-state';

interface ChannelWithStats extends Record<string, unknown> {
  id: string;
  type: string;
  display_name: string | null;
  handle: string | null;
  active: boolean;
  pubCount: number;
  lastPubDate: string | null;
}

const CHANNEL_TYPES = Object.entries(CHANNEL_META)
  .filter(([k]) => k !== 'other')
  .map(([value, meta]) => ({ value, label: meta.label }));

export default function CanaisClient({
  channels: initChannels,
  brandId,
}: {
  channels: Record<string, unknown>[];
  brandId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const channels = initChannels as unknown as ChannelWithStats[];

  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editHandle, setEditHandle] = useState('');

  async function handleAdd() {
    if (!newType) return;
    setSaving(true);
    await supabase.from('channels').insert({
      brand_id: brandId,
      type: newType as 'instagram' | 'facebook' | 'linkedin' | 'google_business' | 'tiktok' | 'youtube' | 'other',
      display_name: newDisplayName.trim() || null,
      handle: newHandle.trim() || null,
      active: true,
    });
    setSaving(false);
    setShowAdd(false);
    setNewType('');
    setNewDisplayName('');
    setNewHandle('');
    router.refresh();
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    await supabase.from('channels').update({ active: !currentActive }).eq('id', id);
    router.refresh();
  }

  function startEdit(ch: ChannelWithStats) {
    setEditId(ch.id);
    setEditDisplayName(ch.display_name || '');
    setEditHandle(ch.handle || '');
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSaving(true);
    await supabase.from('channels').update({
      display_name: editDisplayName.trim() || null,
      handle: editHandle.trim() || null,
    }).eq('id', editId);
    setSaving(false);
    setEditId(null);
    router.refresh();
  }

  if (channels.length === 0 && !showAdd) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-6">Canais</h1>
        <EmptyState
          title="Nenhum canal cadastrado"
          description="Adicione os canais que sua marca usa para comecar a registrar publicacoes."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="bg-brand text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-brand-light"
            >
              Adicionar canal
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Canais</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-brand text-white px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-brand-light"
        >
          + Adicionar canal
        </button>
      </div>

      {/* Add channel form */}
      {showAdd && (
        <div className="bg-surface rounded-md p-4 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-ink mb-3">Novo canal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-ink-soft mb-1">Tipo</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
              >
                <option value="">Selecione</option>
                {CHANNEL_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">Nome de exibicao</label>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                placeholder="Ex: @minhamarca"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">Handle / URL</label>
              <input
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                placeholder="Ex: instagram.com/minhamarca"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => {
                setShowAdd(false);
                setNewType('');
                setNewDisplayName('');
                setNewHandle('');
              }}
              className="border border-line text-ink px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newType || saving}
              className="bg-brand text-white px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-brand-light disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      <div className="space-y-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`bg-surface rounded-md p-4 shadow-sm ${!ch.active ? 'opacity-60' : ''}`}
          >
            {editId === ch.id ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ChannelBadge type={ch.type} />
                  <span className="text-sm text-ink-soft">Editando</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Nome de exibicao</label>
                    <input
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Handle / URL</label>
                    <input
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value)}
                      className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => setEditId(null)}
                    className="border border-line text-ink px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-paper"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="bg-brand text-white px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-brand-light disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChannelBadge type={ch.type} />
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {ch.display_name || CHANNEL_META[ch.type]?.label || ch.type}
                    </div>
                    {ch.handle && (
                      <div className="text-xs text-ink-soft">{ch.handle}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-mono tabular-nums text-ink">
                      {ch.pubCount} publicacoes
                    </div>
                    <div className="text-xs text-ink-soft">
                      {ch.lastPubDate
                        ? `Ultima: ${new Date(ch.lastPubDate).toLocaleDateString('pt-BR')}`
                        : 'Sem publicacoes'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(ch)}
                      className="text-xs text-brand hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(ch.id, ch.active)}
                      className={`text-xs ${ch.active ? 'text-negative' : 'text-positive'} hover:underline`}
                    >
                      {ch.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
