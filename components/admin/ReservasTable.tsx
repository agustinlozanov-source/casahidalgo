'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  formatMoney,
  formatDate,
  formatTime,
  translateStatus,
} from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types/database';

interface Props {
  bookings: Booking[];
  counts: Record<string, number>;
  currentStatus: string;
  currentSearch: string;
}

export default function ReservasTable({
  bookings, counts, currentStatus, currentSearch,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function changeFilter(status: string) {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (currentSearch) params.set('q', currentSearch);
    startTransition(() => {
      router.push(`/admin/reservas${params.toString() ? '?' + params.toString() : ''}`);
    });
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (currentStatus !== 'all') params.set('status', currentStatus);
    if (searchInput.trim()) params.set('q', searchInput.trim());
    startTransition(() => {
      router.push(`/admin/reservas${params.toString() ? '?' + params.toString() : ''}`);
    });
  }

  async function updateStatus(id: string, newStatus: BookingStatus, reason?: string) {
    setUpdatingId(id);
    const update: Partial<Booking> = { status: newStatus };
    if (newStatus === 'cancelled') {
      update.cancelled_at = new Date().toISOString();
      if (reason) update.cancelled_reason = reason;
    }
    const { error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', id);

    setUpdatingId(null);

    if (error) {
      console.error('updateStatus:', error);
      showToast(`Error: ${error.message}`, 'error');
      return;
    }
    showToast(`Reserva actualizada a "${translateStatus(newStatus)}"`, 'success');
    router.refresh();
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleExport() {
    if (bookings.length === 0) {
      showToast('No hay reservas para exportar', 'error');
      return;
    }
    const headers = ['Folio', 'Cliente', 'Email', 'Teléfono', 'Espacio', 'Fecha inicio', 'Fecha fin', 'Duración (h)', 'Subtotal', 'IVA', 'Total', 'Estado', 'Notas', 'Creada'];
    const rows = bookings.map(b => [
      b.folio,
      escapeCsv(b.customer_name),
      escapeCsv(b.customer_email),
      escapeCsv(b.customer_phone),
      escapeCsv(b.spaces?.name || b.space_id),
      formatDate(b.starts_at) + ' ' + formatTime(b.starts_at),
      formatDate(b.ends_at) + ' ' + formatTime(b.ends_at),
      String(b.duration_hours),
      (b.subtotal_cents / 100).toString(),
      (b.tax_cents / 100).toString(),
      (b.total_cents / 100).toString(),
      translateStatus(b.status),
      escapeCsv(b.notes || ''),
      formatDate(b.created_at),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reservas-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${bookings.length} reservas exportadas`, 'success');
  }

  const filters: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'cancelled', label: 'Canceladas' },
    { id: 'completed', label: 'Completadas' },
  ];

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-stone rounded-full p-1 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => changeFilter(f.id)}
              disabled={isPending}
              className={`px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-all ${
                currentStatus === f.id
                  ? 'bg-paper text-ink font-medium shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {f.label} ({counts[f.id] ?? 0})
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <form onSubmit={applySearch} className="flex items-center gap-2 bg-bone border rounded-full px-3.5 py-2 text-sm w-[260px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Folio, cliente, email…"
              className="flex-1 bg-transparent border-0 outline-none text-sm"
            />
          </form>
          <button onClick={handleExport} className="btn btn-ghost text-xs py-2 px-3.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-bone border rounded-2xl overflow-hidden">
        {isPending && (
          <div className="text-center py-3 text-ink-soft text-sm border-b">
            <span className="loader inline-block mr-2" style={{borderColor:'rgba(29,25,22,0.2)', borderTopColor:'#1d1916'}} />
            Actualizando…
          </div>
        )}
        {bookings.length === 0 ? (
          <div className="text-center py-14 text-ink-soft">
            <h3 className="font-serif text-xl mb-2 text-ink">Sin reservas</h3>
            <p className="text-sm">
              {currentSearch
                ? 'Ninguna coincide con tu búsqueda.'
                : 'No hay reservas en este estado.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-stone/50">
                  <Th>Folio</Th>
                  <Th>Cliente</Th>
                  <Th>Espacio</Th>
                  <Th>Fecha / Hora</Th>
                  <Th>Duración</Th>
                  <Th>Total</Th>
                  <Th>Estado</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-ink/[0.025] transition-colors">
                    <td className="py-3.5 px-3.5 font-mono text-[12px] text-ink-soft whitespace-nowrap">
                      <Link href={`/admin/reservas/${b.id}`} className="hover:text-ink hover:underline">
                        {b.folio}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-medium text-[14px]">{b.customer_name}</div>
                      <div className="text-[11.5px] text-ink-soft">{b.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-3.5">{b.spaces?.name || b.space_id}</td>
                    <td className="py-3.5 px-3.5 font-mono text-[13px] whitespace-nowrap">
                      {formatDate(b.starts_at)}<br/>
                      <span className="text-ink-soft">{formatTime(b.starts_at)}</span>
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap">{b.duration_hours}h</td>
                    <td className="py-3.5 px-3.5 font-medium whitespace-nowrap">{formatMoney(b.total_cents)}</td>
                    <td className="py-3.5 px-3.5">
                      <span className={`pill pill-${b.status}`}>{translateStatus(b.status)}</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      {updatingId === b.id ? (
                        <span className="loader inline-block" style={{borderColor:'rgba(29,25,22,0.2)', borderTopColor:'#1d1916'}} />
                      ) : (
                        <div className="flex gap-1 justify-end">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(b.id, 'confirmed')}
                              className="text-[11.5px] text-moss-deep hover:bg-moss/10 px-2 py-1 rounded"
                              title="Confirmar reserva"
                            >
                              Confirmar
                            </button>
                          )}
                          {b.status !== 'cancelled' && b.status !== 'completed' && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Cancelar reserva ${b.folio}?`)) {
                                  updateStatus(b.id, 'cancelled', 'Cancelada desde admin');
                                }
                              }}
                              className="text-[11.5px] text-terra hover:bg-terra/10 px-2 py-1 rounded"
                              title="Cancelar reserva"
                            >
                              Cancelar
                            </button>
                          )}
                          <Link
                            href={`/admin/reservas/${b.id}`}
                            className="text-[11.5px] text-ink-soft hover:bg-ink/8 hover:text-ink px-2 py-1 rounded"
                            title="Ver detalle"
                          >
                            Ver →
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-7 right-7 px-5 py-3.5 rounded-xl text-paper shadow-2xl text-[13.5px] animate-fade-in z-50 ${
          toast.type === 'error' ? 'bg-error' : 'bg-ink'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`py-3 px-3.5 text-[11px] uppercase tracking-wider text-ink-soft font-medium text-${align}`}>
      {children}
    </th>
  );
}

function escapeCsv(s: string): string {
  if (!s) return '';
  const needsQuotes = s.includes(',') || s.includes('"') || s.includes('\n');
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}
