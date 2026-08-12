'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CHANNEL_META, METRIC_HINTS } from '@/lib/config';
import CoverageBar from '@/components/coverage-bar';
import ChannelBadge from '@/components/channel-badge';
import Toast from '@/components/toast';

interface Props {
  publications: Record<string, unknown>[];
  metricValues: Record<string, unknown>[];
  metricDefs: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  pubTags: Record<string, unknown>[];
  channels: Record<string, unknown>[];
  brandId: string;
  userId: string;
}

export default function RegistrarClient({
  publications: initPubs,
  metricValues: initMV,
  metricDefs,
  tags,
  pubTags: initPT,
  channels,
  brandId,
  userId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [localMV, setLocalMV] = useState(initMV);
  const [localPT, setLocalPT] = useState(initPT);
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [warning, setWarning] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  // New publication form
  const [newChannelId, setNewChannelId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(
    new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  );

  const defsMap = useMemo(() => {
    const m = new Map<string, Record<string, unknown>[]>();
    for (const d of metricDefs) {
      const ct = d.channel_type as string;
      if (!m.has(ct)) m.set(ct, []);
      m.get(ct)!.push(d);
    }
    return m;
  }, [metricDefs]);

  const pending = useMemo(() => {
    return initPubs.filter((pub) => {
      const ch = pub.channels as Record<string, unknown> | null;
      if (!ch) return true;
      const chType = ch.type as string;
      const defs = defsMap.get(chType) || [];
      const primaryDefs = defs.filter((d) => d.is_primary);
      const pubMVs = localMV.filter(
        (mv) => mv.publication_id === pub.id
      );
      const filledKeys = new Set(pubMVs.map((mv) => mv.metric_key));
      return primaryDefs.some((d) => !filledKeys.has(d.key as string));
    });
  }, [initPubs, localMV, defsMap]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const current = pending[currentIdx] || null;

  const totalPubs = initPubs.length;
  const withData = totalPubs - pending.length;

  const currentChannel = current
    ? (current.channels as Record<string, unknown>)
    : null;
  const currentDefs = currentChannel
    ? defsMap.get(currentChannel.type as string) || []
    : [];
  const primaryDefs = currentDefs.filter((d) => d.is_primary);
  const secondaryDefs = currentDefs.filter((d) => !d.is_primary);

  // Compute medians for validation
  const medians = useMemo(() => {
    const byKey = new Map<string, number[]>();
    for (const mv of localMV) {
      const key = mv.metric_key as string;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(Number(mv.value));
    }
    const result = new Map<string, number>();
    byKey.forEach((vals, key) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      result.set(
        key,
        sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      );
    });
    return result;
  }, [localMV]);

  function handleValueChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));

    const num = Number(val);
    const median = medians.get(key);
    if (val && median && median > 0 && (num > median * 10 || num < median / 10)) {
      setWarning((prev) => ({
        ...prev,
        [key]: 'Valor muito diferente da sua media. Confere?',
      }));
    } else {
      setWarning((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  const handleSave = useCallback(async () => {
    if (!current) return;
    setSaving(true);

    const entries = Object.entries(values).filter(
      ([, v]) => v !== '' && v !== undefined
    );

    for (const [key, val] of entries) {
      await supabase.from('metric_values').upsert(
        {
          publication_id: current.id as string,
          metric_key: key,
          value: Number(val),
          source: 'manual',
          entered_by: userId,
        },
        { onConflict: 'publication_id,metric_key' }
      );
    }

    // Save tags
    const existingTagIds = new Set(
      localPT
        .filter((pt) => pt.publication_id === current.id)
        .map((pt) => pt.tag_id as string)
    );

    for (const tagId of selectedTags) {
      if (!existingTagIds.has(tagId)) {
        await supabase.from('publication_tags').insert({
          publication_id: current.id as string,
          tag_id: tagId,
        });
      }
    }

    // Update local state
    const newMVs = entries.map(([key, val]) => ({
      publication_id: current.id,
      metric_key: key,
      value: Number(val),
      source: 'manual',
      entered_by: userId,
      entered_at: new Date().toISOString(),
    }));
    setLocalMV((prev) => [
      ...prev.filter(
        (mv) =>
          mv.publication_id !== current.id ||
          !entries.some(([k]) => k === mv.metric_key)
      ),
      ...newMVs,
    ]);

    const newPTs = selectedTags
      .filter((t) => !existingTagIds.has(t))
      .map((tagId) => ({
        publication_id: current.id,
        tag_id: tagId,
      }));
    setLocalPT((prev) => [...prev, ...newPTs]);

    setValues({});
    setSelectedTags([]);
    setShowMore(false);
    setWarning({});
    setSaving(false);

    if (currentIdx >= pending.length - 1) {
      setCurrentIdx(0);
    }
  }, [current, values, selectedTags, localPT, userId, supabase, currentIdx, pending.length]);

  function handleSkip() {
    setValues({});
    setSelectedTags([]);
    setShowMore(false);
    setWarning({});
    setCurrentIdx((i) => Math.min(i + 1, pending.length - 1));
  }

  async function handleCreatePublication() {
    if (!newTitle.trim() || !newChannelId) return;
    setSaving(true);

    const { error } = await supabase.from('publications').insert({
      brand_id: brandId,
      channel_id: newChannelId,
      title: newTitle.trim(),
      published_at: new Date(newDate).toISOString(),
      status: 'published',
      created_by: userId,
    });

    if (!error) {
      const isFirst = totalPubs === 0;
      router.refresh();
      setShowCreate(false);
      setNewTitle('');
      setNewChannelId('');
      if (isFirst) {
        const remaining = Math.max(0, Math.ceil(1 * 0.7) - 0);
        setToast(`Primeira publicacao registrada! Preencha os dados para gerar seu relatorio.`);
      }
    }
    setSaving(false);
  }

  // Load existing tags for current publication
  const currentPubTags = current
    ? localPT
        .filter((pt) => pt.publication_id === current.id)
        .map((pt) => pt.tag_id as string)
    : [];

  // All done state
  if (!current && !showCreate) {
    return (
      <div>
        <div className="mb-6">
          <CoverageBar withData={withData} total={totalPubs} />
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-brand/10 rounded-lg mb-4 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-ink">
            {totalPubs === 0 ? 'Nenhuma publicacao ainda' : 'Tudo preenchido!'}
          </h3>
          <p className="text-sm text-ink-soft mt-1">
            {totalPubs === 0
              ? 'Registre sua primeira publicacao'
              : `${withData} de ${totalPubs} publicacoes com dados`}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-brand text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-brand-light"
          >
            Registrar publicacao
          </button>
        </div>
      </div>
    );
  }

  // Create new publication form
  if (showCreate) {
    return (
      <div>
        <div className="mb-6">
          <CoverageBar withData={withData} total={totalPubs} />
        </div>
        <div className="max-w-lg">
          <h2 className="text-xl font-semibold text-ink mb-6">
            Nova publicacao
          </h2>
          <label className="block text-sm text-ink-soft mb-1">Canal</label>
          <select
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
            className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-4"
          >
            <option value="">Selecione</option>
            {channels.map((ch) => (
              <option key={ch.id as string} value={ch.id as string}>
                {CHANNEL_META[ch.type as string]?.label || String(ch.type)}
                {ch.display_name ? ` — ${String(ch.display_name)}` : ''}
              </option>
            ))}
          </select>
          <label className="block text-sm text-ink-soft mb-1">Data</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-4"
          />
          <label className="block text-sm text-ink-soft mb-1">Titulo</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-6"
            placeholder="Assunto ou descricao curta"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 border border-line text-ink py-2 rounded-sm text-base font-medium hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePublication}
              disabled={saving || !newTitle.trim() || !newChannelId}
              className="flex-1 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Toast for first publication feedback
  const toastElement = toast ? (
    <Toast message={toast} onDone={() => setToast(null)} />
  ) : null;

  // Main registration flow
  const pubDate = current.published_at
    ? new Date(current.published_at as string).toLocaleDateString('pt-BR')
    : '—';

  return (
    <div>
      <div className="mb-6">
        <CoverageBar withData={withData} total={totalPubs} />
      </div>

      <div className="max-w-lg">
        <div className="bg-surface rounded-md p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ChannelBadge type={currentChannel?.type as string} />
            <span className="text-sm text-ink-soft">{pubDate}</span>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-4">
            {current.title as string}
          </h3>

          {/* Primary metrics */}
          {primaryDefs.map((def) => (
            <div key={def.key as string} className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1">
                {def.label_pt as string}
              </label>
              <input
                type="number"
                min="0"
                value={values[def.key as string] ?? ''}
                onChange={(e) =>
                  handleValueChange(def.key as string, e.target.value)
                }
                className="w-full border border-line rounded-sm px-3 py-2 text-lg text-ink bg-surface font-mono tabular-nums focus:outline-none focus:border-brand"
                placeholder="0"
              />
              {METRIC_HINTS[def.key as string] && (
                <p className="text-xs text-ink-soft mt-1">
                  {METRIC_HINTS[def.key as string]}
                </p>
              )}
              {warning[def.key as string] && (
                <p className="text-xs text-gold mt-1">
                  {warning[def.key as string]}
                </p>
              )}
            </div>
          ))}

          {/* More metrics toggle */}
          {secondaryDefs.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="text-sm text-brand hover:underline mb-4"
              >
                {showMore
                  ? 'Menos metricas'
                  : `Mais metricas (${secondaryDefs.length})`}
              </button>
              {showMore &&
                secondaryDefs.map((def) => (
                  <div key={def.key as string} className="mb-4">
                    <label className="block text-sm font-medium text-ink mb-1">
                      {def.label_pt as string}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={values[def.key as string] ?? ''}
                      onChange={(e) =>
                        handleValueChange(def.key as string, e.target.value)
                      }
                      className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface font-mono tabular-nums focus:outline-none focus:border-brand"
                      placeholder="0"
                    />
                    {METRIC_HINTS[def.key as string] && (
                      <p className="text-xs text-ink-soft mt-1">
                        {METRIC_HINTS[def.key as string]}
                      </p>
                    )}
                    {warning[def.key as string] && (
                      <p className="text-xs text-gold mt-1">
                        {warning[def.key as string]}
                      </p>
                    )}
                  </div>
                ))}
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active =
                    selectedTags.includes(tag.id as string) ||
                    currentPubTags.includes(tag.id as string);
                  return (
                    <button
                      key={tag.id as string}
                      type="button"
                      onClick={() => toggleTag(tag.id as string)}
                      className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : 'bg-paper text-ink-soft hover:bg-line'
                      }`}
                    >
                      {tag.name as string}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSkip}
            className="flex-1 border border-line text-ink py-2 rounded-sm text-base font-medium hover:bg-paper"
          >
            Pular
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.values(values).every((v) => !v)}
            className="flex-1 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar e proxima'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-brand hover:underline"
          >
            + Registrar publicacao nova
          </button>
        </div>
      </div>
      {toastElement}
    </div>
  );
}
