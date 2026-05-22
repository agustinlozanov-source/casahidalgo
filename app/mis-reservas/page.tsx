// ============================================================
// app/mis-reservas/page.tsx
// Server Component que carga las reservas del usuario logueado
// ============================================================
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import { formatDate, formatTime, formatMoney, translateStatus } from '@/lib/utils';
import type { Booking } from '@/types/database';
import DownloadComprobanteButton from '@/components/booking/DownloadComprobanteButton';

export default async function MisReservasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mis-reservas');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, spaces(name, accent_color, base_unit)')
    .eq('user_id', user.id)
    .order('starts_at', { ascending: false });

  const list = (bookings || []) as Booking[];

  return (
    <>
      <NavBar />
      <main className="max-w-[1280px] mx-auto px-9 py-12 max-md:px-5 max-md:py-8">
        <div className="flex justify-between items-end mb-12 gap-10 flex-wrap">
          <h1 className="font-serif font-light text-[clamp(32px,4.5vw,56px)] leading-none tracking-tight">
            Mis <em className="text-terra" style={{fontStyle:'italic'}}>reservas</em>
          </h1>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-soft pb-3">
            {list.length} {list.length === 1 ? 'reserva' : 'reservas'}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 px-5 text-ink-soft">
            <h3 className="font-serif text-2xl mb-2.5 text-ink">Aún no tienes reservas</h3>
            <p className="mb-6">Cuando hagas tu primera reserva aparecerá aquí.</p>
            <Link href="/" className="btn btn-primary">Ver espacios</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {list.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function BookingRow({ booking: b }: { booking: Booking }) {
  const statusClass =
    b.status === 'confirmed' ? 'pill-confirmed' :
    b.status === 'pending' ? 'pill-pending' :
    b.status === 'cancelled' ? 'pill-cancelled' :
    'pill-completed';

  return (
    <div className="bg-bone border rounded-2xl px-7 py-6 grid md:grid-cols-[1fr_auto] gap-6 items-center">
      <div>
        <div className="font-mono text-[11px] text-ink-soft mb-1">{b.folio}</div>
        <div className="font-serif text-[22px] font-normal tracking-tight mb-2">
          {b.spaces?.name || 'Espacio'}
        </div>
        <div className="flex flex-wrap gap-4.5 text-[13px] text-ink-soft">
          <span>📅 {formatDate(b.starts_at)}</span>
          <span>🕐 {formatTime(b.starts_at)} — {formatTime(b.ends_at)}</span>
          <span>⏱ {b.duration_hours}h</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 max-md:items-start">
        <span className={`pill ${statusClass}`}>{translateStatus(b.status)}</span>
        <div className="font-serif text-[22px] font-medium">{formatMoney(b.total_cents)}</div>        <DownloadComprobanteButton bookingId={b.id} folio={b.folio} variant="small" label="📄 PDF" />      </div>
    </div>
  );
}
