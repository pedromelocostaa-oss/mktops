import { getUserContext } from '@/lib/data';
import DadosClient from './dados-client';

export default async function DadosPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('active', true);

  const { data: publications } = await supabase
    .from('publications')
    .select('id, title, published_at, channel_id, status')
    .eq('brand_id', brand.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const pubIds = (publications || []).map((p: Record<string, unknown>) => p.id as string);

  const [metricValues, metricDefs, lastReport, savedMappings] = await Promise.all([
    supabase
      .from('metric_values')
      .select('*')
      .in('publication_id', pubIds.length > 0 ? pubIds : ['__none__']),
    supabase.from('metric_definitions').select('*').order('sort_order'),
    supabase
      .from('report_snapshots')
      .select('taken_at')
      .eq(
        'report_id',
        (
          await supabase
            .from('reports')
            .select('id')
            .eq('brand_id', brand.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ).data?.id || '__none__'
      )
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('paste_mappings')
      .select('channel_type, mapping')
      .eq('brand_id', brand.id),
  ]);

  return (
    <DadosClient
      channels={(channels as Record<string, unknown>[]) || []}
      publications={(publications as Record<string, unknown>[]) || []}
      metricValues={(metricValues.data as Record<string, unknown>[]) || []}
      metricDefs={(metricDefs.data as Record<string, unknown>[]) || []}
      lastSnapshotAt={lastReport.data?.taken_at as string | null}
      brandId={brand.id}
      savedMappings={(savedMappings.data || []) as Record<string, unknown>[]}
    />
  );
}
