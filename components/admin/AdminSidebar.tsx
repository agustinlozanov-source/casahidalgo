'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import { getInitials } from '@/lib/utils';

interface Props {
  profile: Profile;
  email: string;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '/admin/reservas', label: 'Reservas', icon: 'M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/clientes', label: 'Clientes', icon: 'M12 4.5a3 3 0 100 6 3 3 0 000-6zM4 20.5c0-3.5 3.5-6 8-6s8 2.5 8 6' },
  { href: '/admin/ajustes', label: 'Ajustes', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function AdminSidebar({ profile, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="bg-ink text-paper flex flex-col py-7 px-4 max-md:hidden sticky top-0 h-screen">
      {/* Brand */}
      <Link href="/admin" className="px-3 pb-6 border-b border-paper/12 mb-5 flex items-center gap-2.5">
        <span className="w-8 h-8 bg-paper text-ink grid place-items-center rounded font-serif italic font-medium text-[16px]">
          H
        </span>
        <div>
          <div className="font-serif text-[19px] font-medium leading-none tracking-tight">
            Casa <em className="text-gold not-italic" style={{ fontStyle: 'italic' }}>Hidalgo</em>
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-paper/55 mt-1">Admin</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2.5 rounded-lg text-[13.5px] flex items-center gap-3 transition-all relative ${
                isActive
                  ? 'bg-paper/10 text-paper font-medium'
                  : 'text-paper/65 hover:bg-paper/6 hover:text-paper'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gold rounded-r" />
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/"
          className="mt-4 px-3.5 py-2.5 rounded-lg text-[13.5px] flex items-center gap-3 text-paper/55 hover:bg-paper/6 hover:text-paper transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Ver sitio público
        </Link>
      </nav>

      {/* User */}
      <div className="border-t border-paper/12 pt-4 mt-3 flex items-center gap-3 px-1">
        <div className="w-9 h-9 bg-gradient-to-br from-terra to-terra-deep rounded-full grid place-items-center font-serif text-paper text-[13px]">
          {profile.avatar_initials || getInitials(profile.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{profile.full_name}</div>
          <div className="text-[10.5px] text-paper/55 uppercase tracking-wider">{profile.role}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-paper/55 hover:text-paper hover:bg-paper/8 p-1.5 rounded-md transition-colors"
          title="Cerrar sesión"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
