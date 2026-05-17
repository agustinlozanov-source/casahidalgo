'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/utils';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (err) {
      setError(translateAuthError(err.message));
      return;
    }
    setSuccess(true);
    // Si está deshabilitado "Confirm email" en Supabase, el user queda logueado al instante
    setTimeout(() => {
      router.push(nextPath);
      router.refresh();
    }, 800);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex bg-gradient-to-br from-[#2a201a] to-[#3a2e22] text-paper flex-col justify-between relative overflow-hidden">
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
            Un solo paso<br />y eres parte<br />de la <em className="text-gold not-italic" style={{fontStyle:'italic'}}>Casa</em>.
          </h2>
        </div>
        <div className="relative z-10 p-14 text-paper/70 text-sm">
          Al crear tu cuenta podrás reservar espacios, gestionar tu historial y guardar tus preferencias.
        </div>
      </aside>

      <section className="flex items-center justify-center p-10">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif font-light text-[42px] tracking-tight leading-[1.05] mb-3">
            Crear<br />tu <em className="text-terra not-italic" style={{fontStyle:'italic'}}>cuenta</em>.
          </h1>
          <p className="text-ink-soft text-[15px] mb-9">Tarda menos de un minuto.</p>

          {error && <div className="alert alert-error mb-4">⚠ {error}</div>}
          {success && <div className="alert alert-success mb-4">✓ Cuenta creada. Redirigiendo…</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Nombre completo</label>
                <input
                  required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre" autoComplete="name"
                  className="form-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="442 100 1122" autoComplete="tel"
                  className="form-input"
                />
              </div>
            </div>
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
              <label className="form-label">Contraseña (mín. 6 caracteres)</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="new-password"
                className="form-input"
              />
            </div>
            <button type="submit" disabled={loading || success} className="btn btn-primary btn-large btn-full">
              {loading ? <><span className="loader" /> Creando cuenta…</> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-[13px] text-ink-soft mt-7 pt-5 border-t">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-terra font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><span className="loader" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
