// ============================================================
// app/admin/reservas/page.tsx — Lista de reservas
// ============================================================
import { createClient } from '@/lib/supabase/server';
import type { Booking } from '@/types/database';
import ReservasTable from '@/components/admin/ReservasTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; date_from?: string; date_to?: string }>;
}

export default async function ReservasPage({ searchParams }: PageProps) {
  const { status, q, date_from, date_to } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select('*, spaces(name, accent_color)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (q) {
    query = query.or(`folio.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
  }
  if (date_from) {
    query = query.gte('starts_at', date_from);
  }
  if (date_to) {
    query = query.lte('starts_at', date_to + 'T23:59:59');
  }

  const { data: bookings } = await query;
  const list = (bookings || []) as Booking[];

  // Conteos para tabs (sin filtro de fecha para mantener totales reales)
  const counts = {
    all: list.length,
    pending: list.filter(b => b.status === 'pending').length,
    confirmed: list.filter(b => b.status === 'confirmed').length,
    cancelled: list.filter(b => b.status === 'cancelled').length,
    completed: list.filter(b => b.status === 'completed').length,
  };

  return (
    <ReservasTable
      bookings={list}
      counts={counts}
      currentStatus={status || 'all'}
      currentSearch={q || ''}
      currentDateFrom={date_from || ''}
      currentDateTo={date_to || ''}
    />
  );
}
