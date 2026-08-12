import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { COVERAGE_THRESHOLD } from '@/lib/config';
import Link from 'next/link';
import WhatsAppShare from '@/components/whatsapp-share';

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc('get_public_report', { p_slug: slug });

  if (!data) notFound();

  const report = (data as Record<string, unknown>).report as Record<string, unknown>;
  const snapshot = (data as Record<string, unknown>).snapshot as Record<string, unknown>;
  const coverage = snapshot.coverage as { with_data: number; total: number };
  const metrics = (snapshot.metrics || {}) as Record<string, number>;
  const goals = (snapshot.goals || []) as Record<string, unknown>[];
  const commentary = report.commentary as string | null;
  const template = report.template as string;
  const coverageRatio = coverage.total > 0 ? coverage.with_data / coverage.total : 0;

  // Record view
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const forwarded = headersList.get('x-forwarded-for') || '';
  const ipHash = hashString(forwarded);

  await supabase.rpc('record_report_view', {
    p_slug: slug,
    p_ip_hash: ipHash,
    p_user_agent: ua,
  });

  const GROUP_LABELS: Record<string, string> = {
    audience: 'Audiencia',
    engagement: 'Engajamento',
    action: 'Acoes',
    conversion: 'Conversoes',
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-brand text-white py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-sm text-white/60 mb-1">
            {report.org_name as string} · {report.brand_name as string}
          </div>
          <h1 className="text-3xl font-extrabold">{report.title as string}</h1>
          <div className="text-sm text-white/70 mt-2">
            {new Date(report.period_start as string).toLocaleDateString('pt-BR')} —{' '}
            {new Date(report.period_end as string).toLocaleDateString('pt-BR')}
          </div>
          {/* Coverage */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-2 bg-white/20 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.round(coverageRatio * 100)}%`,
                  backgroundColor: coverageRatio >= COVERAGE_THRESHOLD ? '#1E6FA8' : '#C9962B',
                }}
              />
            </div>
            <span className="text-sm text-white/70 font-mono tabular-nums">
              {coverage.with_data} de {coverage.total} publicacoes com dados
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Commentary */}
        {commentary && (
          <div className="bg-surface rounded-md p-6 mb-6 shadow-sm border-l-4 border-brand">
            <p className="text-base text-ink whitespace-pre-wrap">{commentary}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(metrics).map(([key, value], i) => (
            <div
              key={key}
              className={`bg-surface rounded-md p-4 shadow-sm ${i === 0 ? 'col-span-2' : ''}`}
            >
              <div className="text-sm text-ink-soft">
                {GROUP_LABELS[key] || key}
              </div>
              <div
                className={`font-mono tabular-nums mt-1 ${
                  i === 0 ? 'text-3xl font-extrabold text-ink' : 'text-xl font-semibold text-ink'
                }`}
              >
                {(value as number).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
        </div>

        {/* Goals (board and sales templates) */}
        {(template === 'board' || template === 'sales') && goals.length > 0 && (
          <div className="bg-surface rounded-md p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-4">Metas</h2>
            <div className="space-y-4">
              {goals.map((goal, i) => {
                const target = Number(goal.target);
                const actual = Number(goal.actual);
                const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink">{goal.name as string}</span>
                      <span className="font-mono tabular-nums text-ink-soft">
                        {actual.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="h-2 bg-line rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct >= 80 ? 'var(--color-positive)' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-negative)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-xs text-ink-soft text-center mt-2">
          Publicado em{' '}
          {new Date(report.published_at as string).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-8 mt-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <WhatsAppShare brandName={report.brand_name as string} />
          <p className="text-sm text-ink-soft">
            Gerado com <strong className="text-brand">mkt-ops</strong>
          </p>
          <Link
            href="/login"
            className="text-sm text-brand hover:underline mt-1 inline-block"
          >
            Crie sua conta
          </Link>
        </div>
      </footer>
    </div>
  );
}
