import { CHANNEL_META } from '@/lib/config';

export default function ChannelBadge({ type }: { type: string }) {
  const meta = CHANNEL_META[type] || CHANNEL_META.other;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white"
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}
