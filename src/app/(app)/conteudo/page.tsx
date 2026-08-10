import { getUserContext } from '@/lib/data';
import { COVERAGE_THRESHOLD, MIN_PIECES_PER_TAG } from '@/lib/config';
import ConteudoClient from './conteudo-client';

export default async function ConteudoPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const [pubs, mvs, defs, tags, pubTags, channels] = await Promise.all([
    supabase
      .from('publications')
      .select('id, title, published_at, channel_id, caption, status, channels(type)')
      .eq('brand_id', brand.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('metric_values')
      .select('publication_id, metric_key, value'),
    supabase.from('metric_definitions').select('*').order('sort_order'),
    supabase.from('tags').select('*').eq('brand_id', brand.id),
    supabase.from('publication_tags').select('publication_id, tag_id'),
    supabase.from('channels').select('*').eq('brand_id', brand.id).eq('active', true),
  ]);

  // Compute "O que funcionou" — performance index per tag combo within same channel
  const publications = (pubs.data || []) as Record<string, unknown>[];
  const metricValues = (mvs.data || []) as Record<string, unknown>[];
  const allTags = (tags.data || []) as Record<string, unknown>[];
  const allPubTags = (pubTags.data || []) as Record<string, unknown>[];
  const metricDefs = (defs.data || []) as Record<string, unknown>[];

  // Build tag map
  const tagMap = new Map(allTags.map((t) => [t.id as string, t]));
  const pubTagMap = new Map<string, string[]>();
  for (const pt of allPubTags) {
    const pubId = pt.publication_id as string;
    if (!pubTagMap.has(pubId)) pubTagMap.set(pubId, []);
    pubTagMap.get(pubId)!.push(pt.tag_id as string);
  }

  // Primary metric per channel type
  const primaryByChannel = new Map<string, string>();
  for (const d of metricDefs) {
    if (d.is_primary && !primaryByChannel.has(d.channel_type as string)) {
      primaryByChannel.set(d.channel_type as string, d.key as string);
    }
  }

  // Group by channel + tag combo
  type Combo = { channelType: string; tagId: string; tagName: string; tagCategory: string; values: number[]; count: number };
  const combos = new Map<string, Combo>();

  for (const pub of publications) {
    const ch = pub.channels as Record<string, unknown> | null;
    if (!ch) continue;
    const channelType = ch.type as string;
    const primaryKey = primaryByChannel.get(channelType);
    if (!primaryKey) continue;

    const mv = metricValues.find(
      (m) => m.publication_id === pub.id && m.metric_key === primaryKey
    );
    if (!mv) continue;

    const pubTagIds = pubTagMap.get(pub.id as string) || [];
    for (const tagId of pubTagIds) {
      const tag = tagMap.get(tagId);
      if (!tag) continue;
      const key = `${channelType}:${tagId}`;
      if (!combos.has(key)) {
        combos.set(key, {
          channelType,
          tagId,
          tagName: tag.name as string,
          tagCategory: tag.category as string,
          values: [],
          count: 0,
        });
      }
      const c = combos.get(key)!;
      c.values.push(Number(mv.value));
      c.count++;
    }
  }

  // Compute averages and sort
  const insights = Array.from(combos.values())
    .map((c) => ({
      ...c,
      avg: c.values.reduce((a, b) => a + b, 0) / c.values.length,
      meetsThreshold: c.count >= MIN_PIECES_PER_TAG,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Coverage for insights
  const totalPubs = publications.length;
  const withData = publications.filter((p) =>
    metricValues.some((mv) => mv.publication_id === p.id)
  ).length;
  const coverageRatio = totalPubs > 0 ? withData / totalPubs : 0;
  const hasCoverage = coverageRatio >= COVERAGE_THRESHOLD;

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <ConteudoClient
      publications={publications}
      metricValues={metricValues}
      metricDefs={metricDefs}
      tags={allTags}
      pubTags={allPubTags}
      channels={(channels.data || []) as Record<string, unknown>[]}
      insights={insights}
      hasCoverage={hasCoverage}
      coverageRatio={coverageRatio}
      monthName={monthName}
      totalPubs={totalPubs}
      withData={withData}
      minPieces={MIN_PIECES_PER_TAG}
      coverageThreshold={COVERAGE_THRESHOLD}
    />
  );
}
