'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import { getInitials } from '@/lib/utils';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        setEmail(session.user.email ?? null);
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    }
    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session) {
        setEmail(session.user.email ?? null);
        const { data: p } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
        setEmail(null);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isLogged = !!email;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff';
  const displayName = profile?.full_name || email || '';

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-paper/85 border-b">
      <div className="flex items-center justify-between gap-6 px-9 py-4 md:px-9 px-5">
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
          {loading ? (
            <span className="text-ink-soft text-xs">···</span>
          ) : isLogged ? (
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
                {profile?.avatar_initials || getInitials(displayName)}
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
