// ============================================================
// app/pago/error/page.tsx
// Cliente regresa aquí si el pago falló o fue rechazado.
// ============================================================
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import type { Booking } from '@/types/database';

interface Props {
  searchParams: Promise<{
    booking?: string;
    external_reference?: string;
    status_detail?: string;
  }>;
}

export default async function PagoErrorPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let booking: Booking | null = null;
  if (params.booking) {
    const { data } = await supabase
      .from('bookings').select('id, folio, space_id, spaces(name)')
      .eq('id', params.booking).eq('user_id', user.id).maybeSingle();
    booking = data as unknown as Booking;
  }

  return (
    <>
      <NavBar />
      <main className="max-w-[600px] mx-auto px-9 py-16 max-md:px-5 max-md:py-10">
        <div className="bg-paper border border-strong rounded-3xl p-10 max-md:p-7 text-center">
          <div className="w-20 h-20 bg-error rounded-full grid place-items-center mx-auto mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
          <h1 className="font-serif font-light text-4xl tracking-tight mb-3">
            Pago <em className="text-error" style={{fontStyle:'italic'}}>no procesado</em>
          </h1>
          <p className="text-ink-soft text-[15px] mb-2 leading-relaxed">
            Tu pago no pudo completarse. Tu reserva sigue pendiente.
          </p>
          <p className="text-[13px] text-ink-soft mb-7">
            Puedes intentar nuevamente o usar otro método de pago.
          </p>

          {booking && (
            <div className="bg-stone rounded-xl p-4 mb-6 text-left">
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-1">Tu reserva</div>
              <div className="font-mono text-sm">{booking.folio}</div>
              <div className="text-sm mt-1">{booking.spaces?.name}</div>
            </div>
          )}

          <div className="flex gap-2.5">
            {booking ? (
              <Link href={`/reservar/${booking.space_id}`} className="btn btn-primary btn-full">
                Intentar de nuevo
              </Link>
            ) : (
              <Link href="/" className="btn btn-primary btn-full">Volver al inicio</Link>
            )}
            <Link href="/mis-reservas" className="btn btn-ghost btn-full">Mis reservas</Link>
          </div>

          <p className="text-[12px] text-ink-soft mt-6">
            ¿Necesitas ayuda? WhatsApp <a href="https://wa.me/524422855151" className="text-terra font-medium">442 285 5151</a>
          </p>
        </div>
      </main>
    </>
  );
}
