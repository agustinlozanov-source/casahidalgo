// ============================================================
// app/admin/reservas/[id]/page.tsx — Detalle de reserva
// ============================================================
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  formatMoney,
  formatDate,
  formatTime,
  translateStatus,
} from '@/lib/utils';
import type { Booking } from '@/types/database';
import BookingActions from '@/components/admin/BookingActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservaDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*, spaces(name, accent_color, base_unit, capacity)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();
  const booking = data as Booking;

  return (
    <div className="max-w-[900px] space-y-5">
      <Link href="/admin/reservas" className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Volver a reservas
      </Link>

      <div className="bg-bone border rounded-2xl p-7">
        <div className="flex justify-between items-start mb-7 gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[12px] text-ink-soft mb-1.5">{booking.folio}</div>
            <h2 className="font-serif font-normal text-[30px] tracking-tight leading-tight mb-2">
              {booking.spaces?.name || booking.space_id}
            </h2>
            <span className={`pill pill-${booking.status}`}>{translateStatus(booking.status)}</span>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-1">Total</div>
            <div className="font-serif text-3xl">{formatMoney(booking.total_cents)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-7">
          {/* Cliente */}
          <Section title="Cliente">
            <Row label="Nombre" value={booking.customer_name} />
            <Row label="Email" value={booking.customer_email} />
            <Row label="Teléfono" value={booking.customer_phone} />
          </Section>

          {/* Reserva */}
          <Section title="Reserva">
            <Row label="Fecha" value={formatDate(booking.starts_at)} />
            <Row label="Hora inicio" value={formatTime(booking.starts_at)} />
            <Row label="Hora fin" value={formatTime(booking.ends_at)} />
            <Row label="Duración" value={`${booking.duration_hours}h`} />
            <Row label="Capacidad" value={`${booking.spaces?.capacity || '—'} personas`} />
          </Section>

          {/* Desglose */}
          <Section title="Desglose">
            <Row label="Subtotal" value={formatMoney(booking.subtotal_cents)} />
            <Row label="IVA (16%)" value={formatMoney(booking.tax_cents)} />
            <Row label="Total" value={<strong>{formatMoney(booking.total_cents)}</strong>} />
          </Section>

          {/* Metadata */}
          <Section title="Metadata">
            <Row label="Creada" value={`${formatDate(booking.created_at)} · ${formatTime(booking.created_at)}`} />
            <Row label="Actualizada" value={`${formatDate(booking.updated_at)} · ${formatTime(booking.updated_at)}`} />
            {booking.cancelled_at && (
              <>
                <Row label="Cancelada" value={`${formatDate(booking.cancelled_at)} · ${formatTime(booking.cancelled_at)}`} />
                {booking.cancelled_reason && <Row label="Razón" value={booking.cancelled_reason} />}
              </>
            )}
          </Section>
        </div>

        {booking.notes && (
          <div className="mt-7 pt-5 border-t">
            <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">Notas del cliente</div>
            <p className="text-[14px] leading-relaxed">{booking.notes}</p>
          </div>
        )}

        <div className="mt-7 pt-5 border-t">
          <BookingActions bookingId={booking.id} status={booking.status} folio={booking.folio} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-ink-soft font-medium mb-3.5 pb-2 border-b">
        {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-[14px]">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
