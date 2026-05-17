// ============================================================
// app/admin/page.tsx — Dashboard del admin
// Server Component que calcula métricas desde la BD
// ============================================================
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  formatMoney,
  formatDate,
  formatTime,
  translateStatus,
} from '@/lib/utils';
import type { Booking, Space } from '@/types/database';
import RevenueChart from '@/components/admin/charts/RevenueChart';

export const dynamic = 'force-dynamic'; // siempre con data fresca

export default async function AdminDashboard() {
  const supabase = await createClient();

  // ---- DATA: traer reservas del último año + espacios ----
  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

  const [bookingsResult, spacesResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, spaces(name, accent_color)')
      .gte('created_at', oneYearAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('spaces').select('*').order('display_order'),
  ]);

  const bookings = (bookingsResult.data || []) as Booking[];
  const spaces = (spacesResult.data || []) as Space[];

  // ---- KPIs ----
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const thisMonth = bookings.filter(b => new Date(b.created_at) >= startOfMonth);
  const prevMonth = bookings.filter(b => {
    const d = new Date(b.created_at);
    return d >= startOfPrevMonth && d <= endOfPrevMonth;
  });

  const revenueThisMonth = thisMonth
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_cents, 0);

  const revenuePrevMonth = prevMonth
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_cents, 0);

  const revenueDelta = revenuePrevMonth > 0
    ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : 0;

  const activeBookings = bookings.filter(
    b => b.status === 'confirmed' && new Date(b.starts_at) >= now
  ).length;

  const totalBookings = bookings.length;
  const totalConfirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
  const confirmRate = totalBookings > 0 ? Math.round((totalConfirmed / totalBookings) * 100) : 0;

  const uniqueCustomers = new Set(thisMonth.map(b => b.user_id)).size;
  const uniqueCustomersPrev = new Set(prevMonth.map(b => b.user_id)).size;
  const customersDelta = uniqueCustomers - uniqueCustomersPrev;

  // ---- Datos para la gráfica (últimos 14 días) ----
  const chartData: { date: string; label: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayBookings = bookings.filter(b =>
      b.created_at.startsWith(dateStr) &&
      (b.status === 'confirmed' || b.status === 'completed')
    );
    const revenue = dayBookings.reduce((s, b) => s + b.total_cents, 0) / 100;
    chartData.push({
      date: dateStr,
      label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()],
      revenue,
    });
  }

  // ---- Distribución por espacio ----
  const spaceDistribution = spaces.map(s => {
    const count = bookings.filter(b => b.space_id === s.id).length;
    const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
    return { ...s, count, pct };
  });

  // ---- Próximas reservas ----
  const upcoming = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.starts_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 5);

  // ---- Recientes ----
  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-7">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Ingresos del mes"
          value={formatMoney(revenueThisMonth)}
          trend={revenueDelta >= 0 ? `+${revenueDelta}% vs mes anterior` : `${revenueDelta}% vs mes anterior`}
          trendType={revenueDelta >= 0 ? 'up' : 'down'}
          accent
        />
        <Kpi
          label="Reservas activas"
          value={activeBookings.toString()}
          trend={`${thisMonth.length} este mes`}
          trendType="up"
        />
        <Kpi
          label="Tasa de confirmación"
          value={`${confirmRate}%`}
          trend={`${totalConfirmed} de ${totalBookings} reservas`}
          trendType="up"
        />
        <Kpi
          label="Clientes nuevos"
          value={uniqueCustomers.toString()}
          trend={customersDelta >= 0 ? `+${customersDelta} vs mes anterior` : `${customersDelta} vs mes anterior`}
          trendType={customersDelta >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Chart + Distribución */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Ingresos · últimos 14 días" className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </Panel>

        <Panel title="Distribución por espacio">
          <div className="flex flex-col gap-4">
            {spaceDistribution.map(s => {
              const color =
                s.accent_color === 'terra' ? '#b94a2c' :
                s.accent_color === 'blue' ? '#2c5e8e' : '#4a5c3a';
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span>{s.name}</span>
                    <span className="text-ink-soft">{s.count} · {s.pct}%</span>
                  </div>
                  <div className="h-2 bg-stone rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${s.pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {upcoming.length > 0 && (
            <div className="mt-7 pt-5 border-t">
              <h3 className="font-serif font-medium text-[15px] mb-3.5">Próximas reservas</h3>
              {upcoming.map(b => (
                <div key={b.id} className="flex justify-between text-[13px] py-2 border-b last:border-0">
                  <span className="truncate mr-2">{b.customer_name}</span>
                  <span className="font-mono text-ink-soft whitespace-nowrap">
                    {formatDate(b.starts_at)} · {formatTime(b.starts_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Recientes */}
      <Panel
        title="Reservas recientes"
        action={<Link href="/admin/reservas" className="btn btn-ghost text-xs py-1.5 px-3.5">Ver todas →</Link>}
      >
        {recent.length === 0 ? (
          <p className="text-center py-10 text-ink-soft text-sm">Aún no hay reservas en la BD.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Folio</th>
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Cliente</th>
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Espacio</th>
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Fecha</th>
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Total</th>
                <th className="text-left py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b.id} className="border-b hover:bg-ink/[0.025] transition-colors">
                  <td className="py-3.5 px-3.5 font-mono text-[12px] text-ink-soft">{b.folio}</td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-medium text-[14px]">{b.customer_name}</div>
                    <div className="text-[11.5px] text-ink-soft">{b.customer_email}</div>
                  </td>
                  <td className="py-3.5 px-3.5">{b.spaces?.name || b.space_id}</td>
                  <td className="py-3.5 px-3.5 font-mono text-[13px]">
                    {formatDate(b.starts_at)}<br/>
                    <span className="text-ink-soft">{formatTime(b.starts_at)}</span>
                  </td>
                  <td className="py-3.5 px-3.5 font-medium">{formatMoney(b.total_cents)}</td>
                  <td className="py-3.5 px-3.5">
                    <span className={`pill pill-${b.status}`}>{translateStatus(b.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

// ============================================================
// Componentes locales
// ============================================================
function Kpi({
  label, value, trend, trendType, accent = false,
}: {
  label: string; value: string; trend: string;
  trendType: 'up' | 'down'; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? 'bg-ink text-paper border border-ink' : 'bg-bone border'}`}>
      <div className={`text-[11px] uppercase tracking-wider mb-3.5 ${accent ? 'text-paper/65' : 'text-ink-soft'}`}>
        {label}
      </div>
      <div className="font-serif text-[36px] font-normal leading-none tracking-tight mb-2.5">
        {value}
      </div>
      <div className={`text-[12.5px] flex items-center gap-1.5 ${
        trendType === 'up'
          ? (accent ? 'text-[#8bc18f]' : 'text-moss')
          : 'text-terra'
      }`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {trendType === 'up'
            ? <path d="M7 17l10-10M17 7v10H7" />
            : <path d="M17 7L7 17M7 7v10h10" />
          }
        </svg>
        {trend}
      </div>
    </div>
  );
}

function Panel({
  title, action, children, className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-bone border rounded-2xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-serif font-medium text-[17px] tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
