// ============================================================
// app/reservar/[spaceId]/page.tsx
// Página de reserva real. Server component que carga el espacio,
// y delega el flujo interactivo a <BookingFlow />
// ============================================================
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import BookingFlow from '@/components/booking/BookingFlow';
import type { Space, Profile } from '@/types/database';

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();

  // Cargar el espacio
  const { data: space, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !space) {
    notFound();
  }

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/reservar/${spaceId}`);
  }

  // Cargar profile (para pre-rellenar datos)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <>
      <NavBar />
      <main className="max-w-[820px] mx-auto px-9 py-12 max-md:px-5 max-md:py-8">
        <BookingFlow
          space={space as Space}
          profile={profile as Profile | null}
          userEmail={user.email!}
        />
      </main>
    </>
  );
}
