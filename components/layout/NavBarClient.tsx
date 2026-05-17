'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface Props {
  email: string | null;
  profile: Profile | null;
  displayName: string;
  initials: string;
}

export default function NavBarClient({ email, profile, displayName, initials }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isLogged = !!email;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff';

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-paper/85 border-b">
      <div className="flex items-center justify-between gap-6 px-9 py-4 max-md:px-5">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <span className="w-[30px] h-[30px] bg-ink text-paper grid place-items-center rounded font-serif italic text-[17px]">
            H
          </span>
          <span className="font-serif font-medium text-[22px] tracking-tight">Casa Hidalgo</span>
        </Link>

        <div className="hidden md:flex gap-8 text-sm">
          <Link
            href="/"
            className={`py-1.5 relative transition-colors ${pathname === '/' ? 'text-ink font-medium' : 'text-ink-soft hover:text-ink'}`}
          >
            Inicio
            {pathname === '/' && <span className="absolute bottom-0 left-0 right-0 h-px bg-terra" />}
          </Link>
          {isLogged && (
            <Link
              href="/mis-reservas"
              className={`py-1.5 relative transition-colors ${pathname === '/mis-reservas' ? 'text-ink font-medium' : 'text-ink-soft hover:text-ink'}`}
            >
              Mis reservas
              {pathname === '/mis-reservas' && <span className="absolute bottom-0 left-0 right-0 h-px bg-terra" />}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3.5 text-[13.5px]">
          {isLogged ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="btn btn-ghost hidden sm:inline-flex">
                  Panel admin →
                </Link>
              )}
              <div className="hidden md:block">
                <div className="font-medium">{displayName}</div>
                <div className={`text-[11.5px] uppercase tracking-wider ${isAdmin ? 'text-terra' : 'text-ink-soft'}`}>
                  {profile?.role || 'customer'}
                </div>
              </div>
              <div className="w-9 h-9 bg-ink text-paper rounded-full grid place-items-center font-serif text-[13px]">
                {initials}
              </div>
              <button onClick={handleSignOut} className="btn btn-ghost">Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Entrar</Link>
              <Link href="/signup" className="btn btn-primary">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
