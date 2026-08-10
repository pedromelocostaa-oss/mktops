import Link from 'next/link';

export default function CoverageBar({
  withData,
  total,
  linkTo,
}: {
  withData: number;
  total: number;
  linkTo?: string;
}) {
  const ratio = total > 0 ? withData / total : 0;
  const pct = Math.round(ratio * 100);

  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-line rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: ratio >= 0.7 ? 'var(--color-positive)' : 'var(--color-gold)',
          }}
        />
      </div>
      <span className="text-sm text-ink-soft font-mono tabular-nums whitespace-nowrap">
        {withData} de {total}
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="block hover:opacity-80">
        {inner}
      </Link>
    );
  }

  return inner;
}
