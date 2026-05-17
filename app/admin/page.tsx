// ============================================================
// app/admin/page.tsx
// Placeholder del panel admin. Lo construimos en la Fase 5.
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  // Verificar rol admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/');
  }

  return (
    <>
      <NavBar />
      <main className="max-w-[1280px] mx-auto px-9 py-12 max-md:px-5">
        <h1 className="font-serif font-light text-5xl tracking-tight mb-3">
          Panel <em className="text-terra" style={{fontStyle:'italic'}}>admin</em>
        </h1>
        <p className="text-ink-soft mb-10">
          Bienvenido. El panel completo lo construimos en la Fase 5.
        </p>
        <div className="alert alert-info">
          <strong>🛠 Próximamente:</strong> dashboard con KPIs, gestión de reservas, pagos, clientes, campañas y ocupación de espacios.
        </div>
      </main>
    </>
  );
}
