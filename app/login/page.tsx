'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(translateAuthError(err.message));
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicLoading(true);
    setError(null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    setMagicLoading(false);
    if (err) {
      setError(translateAuthError(err.message));
      return;
    }
    setMagicSent(true);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Sidebar artístico */}
      <aside className="hidden md:flex bg-gradient-to-br from-[#2a201a] to-[#3a2e22] text-paper p-15 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(800px 400px at 80% 90%, rgba(198,151,72,0.18), transparent 60%), radial-gradient(600px 400px at 10% 20%, rgba(185,74,44,0.15), transparent 60%)'
        }} />
        <div className="relative z-10 p-14">
          <Link href="/" className="font-serif text-[28px] tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 bg-paper text-ink rounded-md grid place-items-center font-serif italic font-medium text-[19px]">H</span>
            Casa Hidalgo
          </Link>
        </div>
        <div className="relative z-10 px-14">
          <h2 className="font-serif font-light text-[40px] leading-[1.1] tracking-tight">
            Espacios que <em className="text-gold not-italic" style={{fontStyle:'italic'}}>respiran</em>
            <br />historia.<br />
            Diseñados para <em className="text-gold not-italic" style={{fontStyle:'italic'}}>trabajar</em>.
          </h2>
        </div>
        <div className="relative z-10 flex gap-9 pt-6 border-t border-paper/15 p-14">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-paper/55 mb-1.5">Ubicación</div>
            <div className="font-serif text-xl">Centro · Qro</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-paper/55 mb-1.5">Espacios</div>
            <div className="font-serif text-xl">3 disponibles</div>
          </div>
        </div>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center p-10">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif font-light text-[42px] tracking-tight leading-[1.05] mb-3">
            Volver<br />a <em className="text-terra not-italic" style={{fontStyle:'italic'}}>Casa</em>.
          </h1>
          <p className="text-ink-soft text-[15px] mb-9">
            Ingresa con tu email para gestionar tus reservas.
          </p>

          {error && <div className="alert alert-error mb-4">⚠ {error}</div>}

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com" autoComplete="email"
                className="form-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Contraseña</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                className="form-input"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-large btn-full">
              {loading ? <><span className="loader" /> Verificando…</> : 'Iniciar sesión'}
            </button>
          </form>

          <div className="my-5 text-center text-xs text-ink-soft relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[rgba(29,25,22,0.12)]" />
            <span className="relative bg-paper px-3">o usa magic link</span>
          </div>

          {magicSent ? (
            <div className="alert alert-success">✓ Revisa tu correo. Te enviamos un link para entrar sin contraseña.</div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Email para magic link</label>
                <input
                  type="email" required value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="form-input"
                />
              </div>
              <button type="submit" disabled={magicLoading} className="btn btn-ghost btn-full">
                {magicLoading ? <><span className="loader" style={{borderColor:'rgba(29,25,22,0.2)', borderTopColor:'#1d1916'}} /> Enviando…</> : '✨ Enviarme magic link'}
              </button>
            </form>
          )}

          <p className="text-center text-[13px] text-ink-soft mt-7 pt-5 border-t">
            ¿No tienes cuenta?{' '}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="text-terra font-medium">
              Crear una
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><span className="loader" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
