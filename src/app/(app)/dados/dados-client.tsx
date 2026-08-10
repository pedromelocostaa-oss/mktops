'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CHANNEL_META } from '@/lib/config';

interface Props {
  channels: Record<string, unknown>[];
  publications: Record<string, unknown>[];
  metricValues: Record<string, unknown>[];
  metricDefs: Record<string, unknown>[];
  lastSnapshotAt: string | null;
  brandId: string;
}

export default function DadosClient({
  channels,
  publications,
  metricValues: initMV,
  metricDefs,
  lastSnapshotAt,
}: Props) {
  const supabase = createClient();
  const [localMV, setLocalMV] = useState(initMV);
  const [activeTab, setActiveTab] = useState(
    channels.length > 0 ? (channels[0].id as string) : ''
  );
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMapping, setPasteMapping] = useState<Record<number, string>>({});
  const [pastePreview, setPastePreview] = useState<string[][]>([]);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const activeChannel = channels.find((c) => c.id === activeTab);
  const channelType = activeChannel?.type as string;

  const defs = useMemo(
    () => metricDefs.filter((d) => d.channel_type === channelType),
    [metricDefs, channelType]
  );

  const channelPubs = useMemo(
    () => publications.filter((p) => p.channel_id === activeTab),
    [publications, activeTab]
  );

  function getMV(pubId: string, metricKey: string) {
    return localMV.find(
      (mv) => mv.publication_id === pubId && mv.metric_key === metricKey
    );
  }

  function isChangedSinceReport(mv: Record<string, unknown> | undefined) {
    if (!mv || !lastSnapshotAt) return false;
    return (mv.entered_at as string) > lastSnapshotAt;
  }

  const handleBlur = useCallback(
    async (pubId: string, metricKey: string, value: string) => {
      if (!value.trim()) return;
      const numVal = Number(value);
      if (isNaN(numVal)) return;

      await supabase.from('metric_values').upsert(
        {
          publication_id: pubId,
          metric_key: metricKey,
          value: numVal,
          source: 'manual',
        },
        { onConflict: 'publication_id,metric_key' }
      );

      setLocalMV((prev) => {
        const existing = prev.find(
          (mv) => mv.publication_id === pubId && mv.metric_key === metricKey
        );
        if (existing) {
          return prev.map((mv) =>
            mv.publication_id === pubId && mv.metric_key === metricKey
              ? { ...mv, value: numVal, entered_at: new Date().toISOString() }
              : mv
          );
        }
        return [
          ...prev,
          {
            publication_id: pubId,
            metric_key: metricKey,
            value: numVal,
            entered_at: new Date().toISOString(),
            source: 'manual',
          },
        ];
      });
    },
    [supabase]
  );

  function handleKeyDown(
    e: React.KeyboardEvent,
    pubIdx: number,
    defIdx: number
  ) {
    const pub = channelPubs[pubIdx];
    const def = defs[defIdx];
    if (!pub || !def) return;

    let nextPub = pubIdx;
    let nextDef = defIdx;

    if (e.key === 'Tab') {
      e.preventDefault();
      nextDef = defIdx + 1;
      if (nextDef >= defs.length) {
        nextDef = 0;
        nextPub = pubIdx + 1;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      nextPub = pubIdx + 1;
    }

    if (nextPub < channelPubs.length) {
      const nextKey = `${channelPubs[nextPub].id}-${defs[nextDef]?.key}`;
      inputRefs.current.get(nextKey)?.focus();
    }
  }

  function handlePaste() {
    if (!pasteText.trim()) return;
    const rows = pasteText.trim().split('\n').map((r) => r.split('\t'));
    setPastePreview(rows);

    // Auto-detect headers
    if (rows.length > 0) {
      const headers = rows[0];
      const mapping: Record<number, string> = {};
      headers.forEach((h, i) => {
        const match = defs.find(
          (d) =>
            (d.label_pt as string).toLowerCase() === h.toLowerCase() ||
            (d.key as string).toLowerCase() === h.toLowerCase()
        );
        if (match) mapping[i] = match.key as string;
      });
      setPasteMapping(mapping);
    }
  }

  async function applyPaste() {
    if (pastePreview.length < 2) return;

    const dataRows = pastePreview.slice(1);
    for (let ri = 0; ri < dataRows.length && ri < channelPubs.length; ri++) {
      const pub = channelPubs[ri];
      const row = dataRows[ri];
      for (const [colIdx, metricKey] of Object.entries(pasteMapping)) {
        const val = row[Number(colIdx)];
        if (val && !isNaN(Number(val))) {
          await handleBlur(pub.id as string, metricKey, val);
        }
      }
    }

    setShowPasteModal(false);
    setPasteText('');
    setPastePreview([]);
    setPasteMapping({});
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-ink">Nenhum canal configurado</h3>
        <p className="text-sm text-ink-soft mt-1">
          Adicione canais nas configuracoes para comecar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Dados</h1>
        <button
          onClick={() => setShowPasteModal(true)}
          className="border border-line text-ink px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-paper"
        >
          Colar da planilha
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gold/20 rounded-sm" /> Sem dados
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-negative/20 rounded-sm" /> Alterado apos relatorio
        </span>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 mb-4 border-b border-line">
        {channels.map((ch) => {
          const meta = CHANNEL_META[ch.type as string];
          const active = ch.id === activeTab;
          return (
            <button
              key={ch.id as string}
              onClick={() => setActiveTab(ch.id as string)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {meta?.label || String(ch.type)}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-ink-soft px-2 py-2 border-b border-line w-32">
                Data
              </th>
              <th className="text-left text-xs font-medium text-ink-soft px-2 py-2 border-b border-line">
                Titulo
              </th>
              {defs.map((d) => (
                <th
                  key={d.key as string}
                  className="text-right text-xs font-medium text-ink-soft px-2 py-2 border-b border-line w-28"
                >
                  {d.label_pt as string}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channelPubs.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + defs.length}
                  className="text-center text-sm text-ink-soft py-8"
                >
                  Nenhuma publicacao neste canal.
                </td>
              </tr>
            ) : (
              channelPubs.map((pub, pi) => (
                <tr key={pub.id as string} className="hover:bg-paper/50">
                  <td className="px-2 py-1 text-xs text-ink-soft font-mono tabular-nums border-b border-line">
                    {pub.published_at
                      ? new Date(pub.published_at as string).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-2 py-1 text-sm text-ink border-b border-line truncate max-w-xs">
                    {pub.title as string}
                  </td>
                  {defs.map((def, di) => {
                    const mv = getMV(pub.id as string, def.key as string);
                    const isEmpty = !mv;
                    const changed = isChangedSinceReport(mv);
                    const cellKey = `${pub.id}-${def.key}`;
                    return (
                      <td
                        key={def.key as string}
                        className={`px-1 py-1 border-b border-line relative ${
                          isEmpty ? 'bg-gold/10' : changed ? 'bg-negative/10' : ''
                        }`}
                      >
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(cellKey, el);
                          }}
                          type="number"
                          min="0"
                          defaultValue={mv ? String(mv.value) : ''}
                          onBlur={(e) =>
                            handleBlur(
                              pub.id as string,
                              def.key as string,
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, pi, di)}
                          className="w-full bg-transparent text-right text-sm font-mono tabular-nums text-ink px-1 py-0.5 rounded-sm border border-transparent hover:border-line focus:border-brand focus:outline-none cursor-text"
                          placeholder="—"
                        />
                        {mv && (
                          <span
                            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-ink-soft/30"
                            title={`Por ${(mv.entered_by as string)?.slice(0, 8) || '?'} em ${new Date(mv.entered_at as string).toLocaleDateString('pt-BR')}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paste modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-md p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-lg">
            <h2 className="text-lg font-semibold text-ink mb-4">
              Colar da planilha
            </h2>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={() => setTimeout(handlePaste, 100)}
              className="w-full h-32 border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand font-mono"
              placeholder="Cole aqui os dados da planilha (Ctrl+V)"
            />
            <button
              onClick={handlePaste}
              className="mt-2 text-sm text-brand hover:underline"
            >
              Detectar colunas
            </button>

            {pastePreview.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-ink mb-2">
                  Mapeamento de colunas
                </h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  {pastePreview[0].map((header, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-xs text-ink-soft">{header}:</span>
                      <select
                        value={pasteMapping[i] || ''}
                        onChange={(e) =>
                          setPasteMapping((prev) => ({
                            ...prev,
                            [i]: e.target.value,
                          }))
                        }
                        className="border border-line rounded-sm px-1 py-0.5 text-xs text-ink bg-surface"
                      >
                        <option value="">Ignorar</option>
                        {defs.map((d) => (
                          <option key={d.key as string} value={d.key as string}>
                            {d.label_pt as string}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-ink-soft mb-2">
                  {pastePreview.length - 1} linhas de dados detectadas
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                  setPastePreview([]);
                }}
                className="flex-1 border border-line text-ink py-2 rounded-sm text-sm font-medium hover:bg-paper"
              >
                Cancelar
              </button>
              <button
                onClick={applyPaste}
                disabled={Object.keys(pasteMapping).length === 0}
                className="flex-1 bg-brand text-white py-2 rounded-sm text-sm font-medium hover:bg-brand-light disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
