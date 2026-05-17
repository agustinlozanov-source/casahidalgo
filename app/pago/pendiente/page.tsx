// ============================================================
// app/pago/pendiente/page.tsx
// Cliente regresa aquí si pagó con OXXO o SPEI (se confirma después).
// ============================================================
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import type { Booking } from '@/types/database';

interface Props {
  searchParams: Promise<{
    booking?: string;
    payment_id?: string;
  }>;
}

export default async function PagoPendientePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let booking: Booking | null = null;
  if (params.booking) {
    const { data } = await supabase
      .from('bookings').select('*, spaces(name)')
      .eq('id', params.booking).eq('user_id', user.id).maybeSingle();
    booking = data as Booking;
  }

  return (
    <>
      <NavBar />
      <main className="max-w-[600px] mx-auto px-9 py-16 max-md:px-5 max-md:py-10">
        <div className="bg-paper border border-strong rounded-3xl p-10 max-md:p-7 text-center">
          <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6" style={{background:'#c69748'}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="font-serif font-light text-4xl tracking-tight mb-3">
            Pago <em style={{fontStyle:'italic', color:'#c69748'}}>en proceso</em>
          </h1>
          <p className="text-ink-soft text-[15px] mb-2 leading-relaxed">
            Estamos esperando la confirmación de tu pago.
          </p>
          <p className="text-[13px] text-ink-soft mb-7">
            Si pagaste en OXXO o por SPEI, tu reserva quedará confirmada en cuanto el banco notifique el pago (suele ser entre 30 minutos y 2 horas).
          </p>

          {booking && (
            <div className="bg-stone rounded-xl p-4 mb-6 text-left">
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-1">Tu reserva</div>
              <div className="font-mono text-sm">{booking.folio}</div>
              <div className="text-sm mt-1">{booking.spaces?.name}</div>
            </div>
          )}

          <Link href="/mis-reservas" className="btn btn-primary">Ver mis reservas</Link>

          <p className="text-[12px] text-ink-soft mt-6">
            Te avisaremos por correo cuando el pago se confirme.
          </p>
        </div>
      </main>
    </>
  );
}
