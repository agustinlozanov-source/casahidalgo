// ============================================================
// app/admin/clientes/page.tsx — Directorio de clientes
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDate, getInitials } from '@/lib/utils';
import type { Profile, Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

interface CustomerAggregated {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_initials: string | null;
  email: string;
  totalBookings: number;
  totalSpentCents: number;
  customerSince: string;
  lastBookingAt: string | null;
}

export default async function ClientesPage() {
  const supabase = await createClient();

  // Traer profiles + bookings + emails de auth.users (via service role no necesario, RLS de admin nos da acceso)
  const [profilesResult, bookingsResult] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('bookings').select('user_id, total_cents, status, created_at'),
  ]);

  const profiles = (profilesResult.data || []) as Profile[];
  const bookings = (bookingsResult.data || []) as Pick<Booking, 'user_id' | 'total_cents' | 'status' | 'created_at'>[];

  // Necesitamos los emails — los obtenemos en una sola llamada al server-side a auth.users
  // Como anon key no puede leer auth.users, usamos un RPC O preguntamos por una vista. Por ahora
  // intentamos via la sesión del admin que tiene service_role o usamos la API admin de Supabase.
  // Alternativa simple: dejar el email vacío y usar el del cliente al hacer reserva.
  // Hacemos un join con bookings para sacar el email desde customer_email (más confiable).

  const emailByUser = new Map<string, string>();
  // Usar las bookings con customer_email (siempre disponible)
  const { data: emailsData } = await supabase
    .from('bookings')
    .select('user_id, customer_email');
  for (const row of emailsData || []) {
    if (row.customer_email && !emailByUser.has(row.user_id)) {
      emailByUser.set(row.user_id, row.customer_email);
    }
  }

  const customers: CustomerAggregated[] = profiles
    .filter(p => p.role === 'customer') // solo clientes, no staff/admin
    .map(p => {
      const userBookings = bookings.filter(b => b.user_id === p.id);
      const confirmedBookings = userBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
      const totalSpentCents = confirmedBookings.reduce((sum, b) => sum + b.total_cents, 0);
      const datesAsc = userBookings.map(b => b.created_at).sort();
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        role: p.role,
        avatar_initials: p.avatar_initials,
        email: emailByUser.get(p.id) || '—',
        totalBookings: userBookings.length,
        totalSpentCents,
        customerSince: datesAsc[0] || p.created_at,
        lastBookingAt: datesAsc[datesAsc.length - 1] || null,
      };
    })
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents);

  // KPIs
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.totalBookings > 0).length;
  const repeatRate = activeCustomers > 0
    ? Math.round((customers.filter(c => c.totalBookings > 1).length / activeCustomers) * 100)
    : 0;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpentCents, 0);
  const avgTicket = activeCustomers > 0 ? Math.round(totalRevenue / activeCustomers) : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-ink text-paper rounded-2xl p-5 border border-ink">
          <div className="text-[11px] uppercase tracking-wider text-paper/65 mb-3.5">Clientes registrados</div>
          <div className="font-serif text-[36px] font-normal leading-none mb-1.5">{totalCustomers}</div>
          <div className="text-[12.5px] text-[#8bc18f]">{activeCustomers} con reservas</div>
        </div>
        <div className="bg-bone border rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-3.5">Tasa de recompra</div>
          <div className="font-serif text-[36px] font-normal leading-none mb-1.5">{repeatRate}%</div>
          <div className="text-[12.5px] text-ink-soft">Clientes con 2+ reservas</div>
        </div>
        <div className="bg-bone border rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-ink-soft mb-3.5">Ticket promedio</div>
          <div className="font-serif text-[36px] font-normal leading-none mb-1.5">{formatMoney(avgTicket)}</div>
          <div className="text-[12.5px] text-ink-soft">Por cliente activo</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-bone border rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b">
          <h3 className="font-serif font-medium text-[17px]">Directorio de clientes</h3>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-14 text-ink-soft">
            <p>Aún no hay clientes registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-stone/50">
                  <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Cliente</th>
                  <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Teléfono</th>
                  <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Cliente desde</th>
                  <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Reservas</th>
                  <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Total gastado</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-ink/[0.025] transition-colors">
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-moss to-moss-deep text-paper rounded-full grid place-items-center font-serif text-[12px]">
                          {c.avatar_initials || getInitials(c.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-[14px]">{c.full_name}</div>
                          <div className="text-[11.5px] text-ink-soft">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-[13px] text-ink-soft">{c.phone || '—'}</td>
                    <td className="py-3.5 px-3.5 text-[13px] text-ink-soft">{formatDate(c.customerSince)}</td>
                    <td className="py-3.5 px-3.5 font-medium">{c.totalBookings}</td>
                    <td className="py-3.5 px-3.5 font-medium">{formatMoney(c.totalSpentCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
