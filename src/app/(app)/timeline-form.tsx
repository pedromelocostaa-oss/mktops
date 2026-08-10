'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TimelineForm({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    await supabase.from('timeline_events').insert({
      brand_id: brandId,
      title: title.trim(),
      event_date: new Date().toISOString().slice(0, 10),
    });

    setTitle('');
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 border border-line rounded-sm px-3 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:border-brand"
        placeholder="Registrar um marco..."
      />
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="px-3 py-1.5 bg-brand text-white rounded-sm text-sm font-medium hover:bg-brand-light disabled:opacity-50"
      >
        {saving ? '...' : 'Adicionar'}
      </button>
    </form>
  );
}
