import { getUserContext } from '@/lib/data';
import Link from 'next/link';
import EmptyState from '@/components/empty-state';

export default async function RelatoriosPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const { data: reports } = await supabase
    .from('reports')
    .select('*, profiles(full_name)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false });

  const reportIds = (reports || []).map((r: Record<string, unknown>) => r.id as string);
  const { data: views } = await supabase
    .from('report_views')
    .select('report_id, viewed_at, viewer_email')
    .in('report_id', reportIds.length > 0 ? reportIds : ['__none__'])
    .order('viewed_at', { ascending: false });

  const viewsByReport = new Map<string, Record<string, unknown>[]>();
  for (const v of views || []) {
    const rid = v.report_id as string;
    if (!viewsByReport.has(rid)) viewsByReport.set(rid, []);
    viewsByReport.get(rid)!.push(v);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Relatorios</h1>
        <Link
          href="/relatorios/novo"
          className="bg-brand text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-brand-light"
        >
          Novo relatorio
        </Link>
      </div>

      {!reports || reports.length === 0 ? (
        <EmptyState
          title="Nenhum relatorio"
          description="Crie um relatorio para compartilhar os resultados com o time."
          action={
            <Link
              href="/relatorios/novo"
              className="bg-brand text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-brand-light"
            >
              Criar primeiro relatorio
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {(reports as Record<string, unknown>[]).map((report) => {
            const rv = viewsByReport.get(report.id as string) || [];
            const profile = report.profiles as Record<string, unknown> | null;

            return (
              <div
                key={report.id as string}
                className="bg-surface rounded-md p-4 shadow-sm flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-ink">
                      {report.title as string}
                    </h3>
                    <span className="text-xs px-1.5 py-0.5 bg-paper text-ink-soft rounded-sm capitalize">
                      {report.template as string}
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft">
                    {new Date(report.period_start as string).toLocaleDateString('pt-BR')} —{' '}
                    {new Date(report.period_end as string).toLocaleDateString('pt-BR')}
                    {profile && ` · por ${profile.full_name || 'Sem nome'}`}
                  </div>
                  {rv.length > 0 && (
                    <div className="text-xs text-ink-soft mt-1">
                      {rv.length} visualizacao{rv.length > 1 ? 'oes' : ''} ·
                      ultima: {new Date(rv[0].viewed_at as string).toLocaleDateString('pt-BR')}
                      {rv[0].viewer_email ? ` por ${String(rv[0].viewer_email)}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {report.public_slug ? (
                    <Link
                      href={`/r/${String(report.public_slug)}`}
                      className="text-xs text-brand hover:underline"
                      target="_blank"
                    >
                      Link publico
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
