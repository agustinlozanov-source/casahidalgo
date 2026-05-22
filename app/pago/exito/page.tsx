// ============================================================
// app/pago/exito/page.tsx
// Cliente regresa aquí tras pagar exitosamente en MercadoPago.
// MP también dispara el webhook, pero esta página da feedback inmediato.
// ============================================================
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  formatMoney, formatDate, formatTime, translateStatus,
} from '@/lib/utils';
import type { Booking } from '@/types/database';
import NavBar from '@/components/layout/NavBar';
import DownloadComprobanteButton from '@/components/booking/DownloadComprobanteButton';

interface Props {
  searchParams: Promise<{
    booking?: string;
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
  }>;
}

export default async function PagoExitoPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Buscar la reserva por id (de nuestros back_urls) o por folio (external_reference de MP)
  let booking: Booking | null = null;
  if (params.booking) {
    const { data } = await supabase
      .from('bookings').select('*, spaces(name, accent_color)')
      .eq('id', params.booking).eq('user_id', user.id).maybeSingle();
    booking = data as Booking;
  } else if (params.external_reference) {
    const { data } = await supabase
      .from('bookings').select('*, spaces(name, accent_color)')
      .eq('folio', params.external_reference).eq('user_id', user.id).maybeSingle();
    booking = data as Booking;
  }

  return (
    <>
      <NavBar />
      <main className="max-w-[600px] mx-auto px-9 py-16 max-md:px-5 max-md:py-10">
        <div className="bg-paper border border-strong rounded-3xl p-10 max-md:p-7 text-center">
          <div className="w-20 h-20 bg-moss rounded-full grid place-items-center mx-auto mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </div>
          <h1 className="font-serif font-light text-4xl tracking-tight mb-3">
            ¡Pago <em className="text-moss" style={{fontStyle:'italic'}}>aprobado</em>!
          </h1>
          <p className="text-ink-soft text-[15px] mb-7 leading-relaxed">
            Tu reserva está confirmada. Te enviamos la confirmación a tu correo.
          </p>

          {booking ? (
            <>
              <div className="bg-stone rounded-2xl p-5 text-left mb-6">
                <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-2.5">Folio</div>
                <div className="font-mono text-lg mb-5">{booking.folio}</div>

                <div className="space-y-2">
                  <Row label="Espacio" value={booking.spaces?.name || booking.space_id} />
                  <Row label="Fecha" value={formatDate(booking.starts_at)} />
                  <Row label="Horario" value={`${formatTime(booking.starts_at)} — ${formatTime(booking.ends_at)}`} />
                  <Row label="Estado" value={<span className={`pill pill-${booking.status}`}>{translateStatus(booking.status)}</span>} />
                  <div className="border-t border-strong pt-3 mt-3">
                    <Row label="Total pagado" value={<strong className="font-serif text-xl">{formatMoney(booking.total_cents)}</strong>} />
                  </div>
                </div>
              </div>
              <DownloadComprobanteButton 
                bookingId={booking.id} 
                folio={booking.folio}
                variant="primary"
                label="📄 Descargar comprobante"
              />
              <div className="flex gap-2.5 mt-3">
                <Link href="/mis-reservas" className="btn btn-ghost btn-full">Ver mis reservas</Link>
                <Link href="/" className="btn btn-ghost btn-full">Inicio</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft mb-6">
                No pudimos cargar los detalles de tu reserva, pero tu pago fue procesado.
                Puedes verlo en "Mis reservas".
              </p>
              <Link href="/mis-reservas" className="btn btn-primary">Ver mis reservas</Link>
            </>
          )}

          {params.payment_id && (
            <p className="text-[11px] text-ink-soft mt-6 font-mono">
              ID de pago MP: {params.payment_id}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
