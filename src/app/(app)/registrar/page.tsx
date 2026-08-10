import { getUserContext } from '@/lib/data';
import RegistrarClient from './registrar-client';

export default async function RegistrarPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const { data: publications } = await supabase
    .from('publications')
    .select('*, channels(type, display_name)')
    .eq('brand_id', brand.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const pubIds = (publications || []).map((p: Record<string, unknown>) => p.id as string);

  const [metricValues, metricDefs, tags, pubTags, channels] = await Promise.all([
    supabase
      .from('metric_values')
      .select('*')
      .in('publication_id', pubIds.length > 0 ? pubIds : ['__none__']),
    supabase.from('metric_definitions').select('*').order('sort_order'),
    supabase.from('tags').select('*').eq('brand_id', brand.id),
    supabase
      .from('publication_tags')
      .select('*')
      .in('publication_id', pubIds.length > 0 ? pubIds : ['__none__']),
    supabase
      .from('channels')
      .select('*')
      .eq('brand_id', brand.id)
      .eq('active', true),
  ]);

  return (
    <RegistrarClient
      publications={(publications as Record<string, unknown>[]) || []}
      metricValues={(metricValues.data as Record<string, unknown>[]) || []}
      metricDefs={(metricDefs.data as Record<string, unknown>[]) || []}
      tags={(tags.data as Record<string, unknown>[]) || []}
      pubTags={(pubTags.data as Record<string, unknown>[]) || []}
      channels={(channels.data as Record<string, unknown>[]) || []}
      brandId={brand.id}
      userId={ctx.user.id}
    />
  );
}
