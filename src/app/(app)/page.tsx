import { getUserContext } from '@/lib/data';
import { COVERAGE_THRESHOLD } from '@/lib/config';
import CoverageBar from '@/components/coverage-bar';
import Link from 'next/link';
import TimelineForm from './timeline-form';

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

interface AggGroup {
  label: string;
  group: string;
  value: number;
  prev: number;
}

export default async function InicioPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const current = getMonthRange(0);
  const previous = getMonthRange(-1);

  // Fetch publications for current and previous periods
  const { data: allPubs } = await supabase
    .from('publications')
    .select('id, published_at, channel_id, channels(type)')
    .eq('brand_id', brand.id)
    .eq('status', 'published')
    .gte('published_at', previous.start)
    .lte('published_at', current.end);

  const pubs = allPubs || [];
  const currentPubs = pubs.filter(
    (p) => p.published_at && p.published_at >= current.start && p.published_at <= current.end
  );
  const prevPubs = pubs.filter(
    (p) => p.published_at && p.published_at >= previous.start && p.published_at <= previous.end
  );

  const allPubIds = pubs.map((p) => p.id);
  const { data: metricValues } = await supabase
    .from('metric_values')
    .select('publication_id, metric_key, value')
    .in('publication_id', allPubIds.length > 0 ? allPubIds : ['__none__']);

  const { data: metricDefs } = await supabase
    .from('metric_definitions')
    .select('key, equivalence_group, label_pt');

  const mvs = metricValues || [];
  const defs = metricDefs || [];

  // Build group lookup
  const keyToGroup = new Map<string, string>();
  for (const d of defs) {
    if (d.equivalence_group) keyToGroup.set(d.key, d.equivalence_group);
  }

  // Compute aggregates by group
  function aggregate(pubIds: Set<string>) {
    const groups: Record<string, number> = {};
    for (const mv of mvs) {
      if (!pubIds.has(mv.publication_id)) continue;
      const grp = keyToGroup.get(mv.metric_key) || 'other';
      groups[grp] = (groups[grp] || 0) + Number(mv.value);
    }
    return groups;
  }

  const currentIds = new Set(currentPubs.map((p) => p.id));
  const prevIds = new Set(prevPubs.map((p) => p.id));
  const curAgg = aggregate(currentIds);
  const prevAgg = aggregate(prevIds);

  // Coverage
  const currentWithData = currentPubs.filter((p) =>
    mvs.some((mv) => mv.publication_id === p.id)
  ).length;
  const totalCurrent = currentPubs.length;
  const coverageRatio = totalCurrent > 0 ? currentWithData / totalCurrent : 0;
  const hasCoverage = coverageRatio >= COVERAGE_THRESHOLD;

  const groups: AggGroup[] = [
    { label: 'Audiencia', group: 'audience', value: curAgg.audience || 0, prev: prevAgg.audience || 0 },
    { label: 'Engajamento', group: 'engagement', value: curAgg.engagement || 0, prev: prevAgg.engagement || 0 },
    { label: 'Acoes', group: 'action', value: curAgg.action || 0, prev: prevAgg.action || 0 },
    { label: 'Conversoes', group: 'conversion', value: curAgg.conversion || 0, prev: prevAgg.conversion || 0 },
  ];

  // "O que mudou" — top 3 changes by absolute difference
  const changes = hasCoverage
    ? groups
        .filter((g) => g.prev > 0)
        .map((g) => ({
          ...g,
          delta: g.value - g.prev,
          pct: Math.round(((g.value - g.prev) / g.prev) * 100),
        }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 3)
    : [];

  // Goals
  const today = new Date().toISOString().slice(0, 10);
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('brand_id', brand.id)
    .lte('period_start', today)
    .gte('period_end', today);

  // Timeline events (last 10)
  const { data: timeline } = await supabase
    .from('timeline_events')
    .select('*, profiles(full_name)')
    .eq('brand_id', brand.id)
    .order('event_date', { ascending: false })
    .limit(10);

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Inicio</h1>

      {/* Coverage */}
      <div className="bg-surface rounded-md p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink">
            Cobertura de {monthName}
          </span>
          <Link href="/registrar" className="text-sm text-brand hover:underline">
            Preencher dados
          </Link>
        </div>
        <CoverageBar withData={currentWithData} total={totalCurrent} linkTo="/registrar" />
      </div>

      {/* Four numbers */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {groups.map((g, i) => {
          const isPrimary = i === 0;
          return (
            <div
              key={g.group}
              className={`bg-surface rounded-md p-4 shadow-sm ${isPrimary ? 'col-span-2 row-span-1' : ''}`}
            >
              <div className={`text-sm ${isPrimary ? 'text-ink font-medium' : 'text-ink-soft'}`}>
                {g.label}
              </div>
              <div
                className={`font-mono tabular-nums mt-1 ${
                  isPrimary ? 'text-4xl font-extrabold text-ink' : 'text-xl font-semibold text-ink-soft'
                }`}
              >
                {g.value.toLocaleString('pt-BR')}
              </div>
              {hasCoverage && g.prev > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`text-sm font-medium ${
                      g.value >= g.prev ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {g.value >= g.prev ? '↑' : '↓'}
                    {Math.abs(Math.round(((g.value - g.prev) / g.prev) * 100))}%
                  </span>
                  <span className="text-xs text-ink-soft">vs. mes anterior</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* O que mudou */}
      <div className="bg-surface rounded-md p-4 mb-6 shadow-sm">
        <h2 className="text-sm font-medium text-ink mb-3">O que mudou</h2>
        {!hasCoverage ? (
          <div className="text-sm text-gold">
            Cobertura abaixo de {Math.round(COVERAGE_THRESHOLD * 100)}%.
            Preencha mais {Math.max(0, Math.ceil(totalCurrent * COVERAGE_THRESHOLD) - currentWithData)} publicacoes para ver insights.
          </div>
        ) : changes.length === 0 ? (
          <div className="text-sm text-ink-soft">
            Sem dados do periodo anterior para comparar.
          </div>
        ) : (
          <div className="space-y-2">
            {changes.map((c, i) => (
              <div
                key={c.group}
                className={`flex items-center gap-2 ${i === 0 ? 'text-base font-medium' : 'text-sm'} text-ink`}
              >
                <span className={c.pct >= 0 ? 'text-positive' : 'text-negative'}>
                  {c.pct >= 0 ? '↑' : '↓'}
                </span>
                <span>
                  {c.label}: {c.pct >= 0 ? '+' : ''}{c.pct}%
                  ({c.value.toLocaleString('pt-BR')})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      {(goals || []).length > 0 && (
        <div className="bg-surface rounded-md p-4 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-ink mb-3">Metas</h2>
          <div className="space-y-3">
            {(goals || []).map((goal: Record<string, unknown>) => {
              const metricKey = goal.metric_key as string;
              const target = Number(goal.target_value);
              const currentVal = curAgg[keyToGroup.get(metricKey) || metricKey] || 0;
              const pct = target > 0 ? Math.min(100, Math.round((currentVal / target) * 100)) : 0;
              return (
                <div key={goal.id as string}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink">{goal.name as string}</span>
                    <span className="font-mono tabular-nums text-ink-soft">
                      {currentVal.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="h-2 bg-line rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? 'var(--color-positive)' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-negative)',
                      }}
                    />
                  </div>
                  {hasCoverage && pct < 100 && (
                    <div className="text-xs text-ink-soft mt-0.5">
                      {pct}% da meta
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-surface rounded-md p-4 shadow-sm">
        <h2 className="text-sm font-medium text-ink mb-3">Linha do tempo</h2>
        <TimelineForm brandId={brand.id} />
        <div className="mt-4 space-y-3">
          {(timeline || []).length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhum marco registrado.</p>
          ) : (
            (timeline || []).map((ev: Record<string, unknown>) => (
              <div key={ev.id as string} className="flex gap-3">
                <div className="text-xs text-ink-soft font-mono tabular-nums whitespace-nowrap pt-0.5">
                  {new Date(ev.event_date as string).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <div className="text-sm text-ink">{String(ev.title)}</div>
                  {ev.description ? (
                    <div className="text-xs text-ink-soft">{String(ev.description)}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
