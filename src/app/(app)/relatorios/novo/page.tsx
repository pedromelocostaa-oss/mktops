'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ReportTemplate } from '@/lib/types';

const TEMPLATES: { key: ReportTemplate; label: string; description: string }[] = [
  { key: 'board', label: 'Diretoria', description: 'Visao executiva com metricas de alto nivel' },
  { key: 'sales', label: 'Comercial', description: 'Foco em leads e conversoes' },
  { key: 'team', label: 'Time', description: 'Detalhamento operacional para o time de marketing' },
];

export default function NovoRelatorioPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<ReportTemplate>('board');
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [commentary, setCommentary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nao autenticado');

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) throw new Error('Sem organizacao');

      const { data: brand } = await supabase
        .from('brands')
        .select('id')
        .eq('organization_id', membership.organization_id)
        .limit(1)
        .single();

      if (!brand) throw new Error('Sem marca');

      const slug = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`;

      // Create report
      const { data: report, error: reportErr } = await supabase
        .from('reports')
        .insert({
          brand_id: brand.id,
          template,
          title: title.trim(),
          period_start: periodStart,
          period_end: periodEnd,
          commentary: commentary.trim() || null,
          public_slug: slug,
          published_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select('id')
        .single();

      if (reportErr) throw reportErr;

      // Fetch metrics for the period to create snapshot
      const { data: publications } = await supabase
        .from('publications')
        .select('id, channel_id')
        .eq('brand_id', brand.id)
        .eq('status', 'published')
        .gte('published_at', periodStart)
        .lte('published_at', periodEnd + 'T23:59:59');

      const pubIds = (publications || []).map((p) => p.id);
      const { data: mvs } = await supabase
        .from('metric_values')
        .select('publication_id, metric_key, value')
        .in('publication_id', pubIds.length > 0 ? pubIds : ['__none__']);

      // Build snapshot payload
      const totalPubs = pubIds.length;
      const withData = new Set(
        (mvs || []).map((mv) => mv.publication_id)
      ).size;

      // Aggregate by equivalence group
      const { data: defs } = await supabase
        .from('metric_definitions')
        .select('key, equivalence_group');

      const keyToGroup = new Map<string, string>();
      for (const d of defs || []) {
        if (d.equivalence_group) {
          keyToGroup.set(d.key, d.equivalence_group);
        }
      }

      const metrics: Record<string, number> = {};
      for (const mv of mvs || []) {
        const grp = keyToGroup.get(mv.metric_key) || mv.metric_key;
        metrics[grp] = (metrics[grp] || 0) + Number(mv.value);
      }

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('name, metric_key, target_value')
        .eq('brand_id', brand.id)
        .lte('period_start', periodEnd)
        .gte('period_end', periodStart);

      const payload = {
        metrics,
        coverage: { with_data: withData, total: totalPubs },
        goals: (goals || []).map((g) => ({
          name: g.name as string,
          metric_key: g.metric_key as string,
          target: Number(g.target_value),
          actual: metrics[keyToGroup.get(g.metric_key) || g.metric_key] || 0,
        })),
        metric_values: (mvs || []).map((mv) => ({
          publication_id: mv.publication_id as string,
          metric_key: mv.metric_key as string,
          value: Number(mv.value),
        })),
      };

      await supabase.from('report_snapshots').insert({
        report_id: report!.id,
        payload,
      });

      router.push('/relatorios');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar relatorio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-ink mb-6">Novo relatorio</h1>

      {error && (
        <div className="mb-4 p-3 bg-negative/10 text-negative text-sm rounded-sm">
          {error}
        </div>
      )}

      {/* Template selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Modelo</label>
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTemplate(t.key)}
              className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                template === t.key
                  ? 'border-brand bg-brand/5'
                  : 'border-line hover:border-ink-soft'
              }`}
            >
              <div className="text-sm font-medium text-ink">{t.label}</div>
              <div className="text-xs text-ink-soft">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm font-medium text-ink mb-1">Titulo</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-line rounded-sm px-3 py-2 text-base text-ink bg-surface focus:outline-none focus:border-brand mb-4"
        placeholder="Ex: Resultados de julho 2026"
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Inicio</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Fim</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <label className="block text-sm font-medium text-ink mb-1">
        Comentario do time
      </label>
      <textarea
        value={commentary}
        onChange={(e) => setCommentary(e.target.value)}
        rows={4}
        className="w-full border border-line rounded-sm px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-brand mb-6 resize-none"
        placeholder="Destaques, aprendizados, proximos passos..."
      />

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-line text-ink py-2 rounded-sm text-base font-medium hover:bg-paper"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !title.trim()}
          className="flex-1 bg-brand text-white py-2 rounded-sm text-base font-medium hover:bg-brand-light disabled:opacity-50"
        >
          {saving ? 'Criando...' : 'Publicar relatorio'}
        </button>
      </div>
    </div>
  );
}
