'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { BookingStatus } from '@/types/database';
import { translateStatus } from '@/lib/utils';

interface Props {
  bookingId: string;
  status: BookingStatus;
  folio: string;
}

export default function BookingActions({ bookingId, status, folio }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function performAction(newStatus: BookingStatus, reason?: string) {
    setLoading(newStatus);
    setError(null);

    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'cancelled') {
      update.cancelled_at = new Date().toISOString();
      if (reason) update.cancelled_reason = reason;
    }

    const { error: err } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', bookingId);

    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-soft font-medium mb-3.5">Acciones</div>

      {error && <div className="alert alert-error mb-3">{error}</div>}

      <div className="flex gap-2.5 flex-wrap">
        {status === 'pending' && (
          <button
            onClick={() => performAction('confirmed')}
            disabled={loading !== null}
            className="btn"
            style={{ background: '#4a5c3a', color: '#faf6ec' }}
          >
            {loading === 'confirmed' ? <><span className="loader" /> Confirmando…</> : '✓ Confirmar reserva'}
          </button>
        )}

        {(status === 'confirmed' || status === 'pending') && (
          <button
            onClick={() => {
              const reason = prompt(`¿Razón para cancelar ${folio}? (opcional)`);
              if (reason !== null) {
                performAction('cancelled', reason.trim() || 'Cancelada desde admin');
              }
            }}
            disabled={loading !== null}
            className="btn btn-terra"
          >
            {loading === 'cancelled' ? <><span className="loader" /> Cancelando…</> : 'Cancelar reserva'}
          </button>
        )}

        {status === 'confirmed' && (
          <button
            onClick={() => {
              if (confirm(`¿Marcar ${folio} como completada?`)) {
                performAction('completed');
              }
            }}
            disabled={loading !== null}
            className="btn btn-ghost"
          >
            {loading === 'completed' ? <><span className="loader" style={{borderColor:'rgba(29,25,22,0.2)', borderTopColor:'#1d1916'}} /> Completando…</> : 'Marcar completada'}
          </button>
        )}

        {(status === 'cancelled' || status === 'completed') && (
          <p className="text-[13px] text-ink-soft py-2">
            Esta reserva está {translateStatus(status).toLowerCase()} y no permite más cambios.
          </p>
        )}
      </div>
    </div>
  );
}
