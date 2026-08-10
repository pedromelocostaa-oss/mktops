'use client';

import { useState, useMemo } from 'react';
import ChannelBadge from '@/components/channel-badge';
import { CHANNEL_META } from '@/lib/config';

interface Insight {
  channelType: string;
  tagId: string;
  tagName: string;
  tagCategory: string;
  count: number;
  avg: number;
  meetsThreshold: boolean;
}

interface Props {
  publications: Record<string, unknown>[];
  metricValues: Record<string, unknown>[];
  metricDefs: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  pubTags: Record<string, unknown>[];
  channels: Record<string, unknown>[];
  insights: Insight[];
  hasCoverage: boolean;
  coverageRatio: number;
  monthName: string;
  totalPubs: number;
  withData: number;
  minPieces: number;
  coverageThreshold: number;
}

export default function ConteudoClient({
  publications,
  metricValues,
  metricDefs,
  tags,
  pubTags,
  channels,
  insights,
  hasCoverage,
  monthName,
  totalPubs,
  withData,
  minPieces,
  coverageThreshold,
}: Props) {
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const tagMap = useMemo(
    () => new Map(tags.map((t) => [t.id as string, t])),
    [tags]
  );

  const pubTagMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const pt of pubTags) {
      const pid = pt.publication_id as string;
      if (!m.has(pid)) m.set(pid, []);
      m.get(pid)!.push(pt.tag_id as string);
    }
    return m;
  }, [pubTags]);

  const defsMap = useMemo(() => {
    const m = new Map<string, Record<string, unknown>[]>();
    for (const d of metricDefs) {
      const ct = d.channel_type as string;
      if (!m.has(ct)) m.set(ct, []);
      m.get(ct)!.push(d);
    }
    return m;
  }, [metricDefs]);

  const filtered = useMemo(() => {
    return publications.filter((pub) => {
      const ch = pub.channels as Record<string, unknown> | null;
      if (filterChannel !== 'all' && pub.channel_id !== filterChannel) return false;
      if (filterTag !== 'all') {
        const tags = pubTagMap.get(pub.id as string) || [];
        if (!tags.includes(filterTag)) return false;
      }
      return true;
    });
  }, [publications, filterChannel, filterTag, pubTagMap]);

  // Get format and theme tags for filter dropdowns
  const formatTags = tags.filter((t) => t.category === 'format');
  const themeTags = tags.filter((t) => t.category === 'theme');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Conteudo</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border border-line rounded-sm px-3 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
        >
          <option value="all">Todos os canais</option>
          {channels.map((ch) => (
            <option key={ch.id as string} value={ch.id as string}>
              {CHANNEL_META[ch.type as string]?.label || String(ch.type)}
            </option>
          ))}
        </select>
        {formatTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="border border-line rounded-sm px-3 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
          >
            <option value="all">Todos os formatos</option>
            {formatTags.map((t) => (
              <option key={t.id as string} value={t.id as string}>
                {t.name as string}
              </option>
            ))}
          </select>
        )}
        {themeTags.length > 0 && (
          <select
            value={filterTag !== 'all' && formatTags.some((f) => f.id === filterTag) ? 'all' : filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="border border-line rounded-sm px-3 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
          >
            <option value="all">Todos os temas</option>
            {themeTags.map((t) => (
              <option key={t.id as string} value={t.id as string}>
                {t.name as string}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publications grid */}
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-md">
              <h3 className="text-lg font-medium text-ink">Nenhuma publicacao</h3>
              <p className="text-sm text-ink-soft mt-1">
                Registre publicacoes para ve-las aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((pub) => {
                const ch = pub.channels as Record<string, unknown> | null;
                const channelType = ch?.type as string;
                const defs = defsMap.get(channelType) || [];
                const pubMVs = metricValues.filter(
                  (mv) => mv.publication_id === pub.id
                );
                const pubTagIds = pubTagMap.get(pub.id as string) || [];

                return (
                  <div
                    key={pub.id as string}
                    className="bg-surface rounded-md p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ChannelBadge type={channelType} />
                      <span className="text-xs text-ink-soft font-mono tabular-nums">
                        {pub.published_at
                          ? new Date(pub.published_at as string).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-ink mb-1">
                      {pub.title as string}
                    </h3>
                    {pub.caption ? (
                      <p className="text-xs text-ink-soft mb-2 line-clamp-2">
                        {String(pub.caption)}
                      </p>
                    ) : null}

                    {/* Tags */}
                    {pubTagIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pubTagIds.map((tid) => {
                          const t = tagMap.get(tid);
                          return t ? (
                            <span
                              key={tid}
                              className="px-1.5 py-0.5 bg-paper text-ink-soft text-xs rounded-sm"
                            >
                              {t.name as string}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Metrics */}
                    {pubMVs.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-line">
                        {defs
                          .filter((d) =>
                            pubMVs.some((mv) => mv.metric_key === d.key)
                          )
                          .map((d) => {
                            const mv = pubMVs.find(
                              (m) => m.metric_key === d.key
                            );
                            return (
                              <div key={d.key as string} className="text-xs">
                                <span className="text-ink-soft">
                                  {d.label_pt as string}:{' '}
                                </span>
                                <span className="font-mono tabular-nums text-ink font-medium">
                                  {Number(mv?.value || 0).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* "O que funcionou" panel */}
        <div>
          <div className="bg-surface rounded-md p-4 shadow-sm sticky top-8">
            <h2 className="text-sm font-medium text-ink mb-3">
              O que funcionou em {monthName}
            </h2>

            {!hasCoverage ? (
              <div className="space-y-3">
                <div className="text-sm text-gold">
                  Cobertura abaixo de {Math.round(coverageThreshold * 100)}%.
                </div>
                <div className="text-sm text-ink-soft">
                  Faltam {Math.max(0, Math.ceil(totalPubs * coverageThreshold) - withData)} publicacoes
                  com dados para gerar insights.
                </div>
                <div className="h-2 bg-line rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-gold"
                    style={{
                      width: `${totalPubs > 0 ? Math.round((withData / totalPubs) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ) : insights.length === 0 ? (
              <div className="text-sm text-ink-soft">
                Etiquete publicacoes para ver quais combinacoes funcionam melhor.
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((ins) => (
                  <div key={`${ins.channelType}:${ins.tagId}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            CHANNEL_META[ins.channelType]?.color || '#999',
                        }}
                      />
                      <span className="text-sm text-ink">{ins.tagName}</span>
                    </div>
                    {ins.meetsThreshold ? (
                      <div className="text-sm">
                        <span className="font-mono tabular-nums font-medium text-ink">
                          {Math.round(ins.avg).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-ink-soft"> media</span>
                        <span className="text-xs text-ink-soft ml-2">
                          ({ins.count} pecas)
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gold">
                        Faltam {minPieces - ins.count} pecas para gerar indice
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
