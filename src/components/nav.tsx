'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/registrar', label: 'Registrar' },
  { href: '/dados', label: 'Dados' },
  { href: '/conteudo', label: 'Conteudo' },
  { href: '/relatorios', label: 'Relatorios' },
  { href: '/canais', label: 'Canais' },
];

export default function Nav({
  orgName,
  userName,
  userRole,
}: {
  orgName: string;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="w-60 bg-brand fixed h-screen flex flex-col z-10">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold text-white">{orgName}</div>
      </div>

      <div className="flex-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-sm text-sm mb-1 transition-colors ${
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-sm font-medium text-white truncate">{userName}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/50 capitalize">{userRole}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-white/50 hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
