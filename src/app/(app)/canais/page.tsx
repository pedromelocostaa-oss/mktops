import { getUserContext } from '@/lib/data';
import CanaisClient from './canais-client';

export default async function CanaisPage() {
  const ctx = await getUserContext();
  const { supabase, brand } = ctx;

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('brand_id', brand.id)
    .order('created_at');

  const channelIds = (channels || []).map((c: Record<string, unknown>) => c.id as string);

  const { data: publications } = await supabase
    .from('publications')
    .select('id, channel_id, published_at')
    .eq('brand_id', brand.id)
    .eq('status', 'published')
    .in('channel_id', channelIds.length > 0 ? channelIds : ['__none__']);

  const stats = new Map<string, { count: number; lastDate: string | null }>();
  for (const ch of channels || []) {
    stats.set(ch.id as string, { count: 0, lastDate: null });
  }
  for (const pub of publications || []) {
    const s = stats.get(pub.channel_id as string);
    if (s) {
      s.count++;
      const d = pub.published_at as string | null;
      if (d && (!s.lastDate || d > s.lastDate)) s.lastDate = d;
    }
  }

  const channelsWithStats = (channels || []).map((ch: Record<string, unknown>) => ({
    ...ch,
    pubCount: stats.get(ch.id as string)?.count ?? 0,
    lastPubDate: stats.get(ch.id as string)?.lastDate ?? null,
  }));

  return (
    <CanaisClient
      channels={channelsWithStats}
      brandId={brand.id}
    />
  );
}
