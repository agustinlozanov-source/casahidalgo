'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Space, Profile, AvailableSlot, Booking } from '@/types/database';
import {
  calculatePrice,
  formatMoney,
  formatDate,
  formatTime,
  buildMexicoCityISO,
  todayPlus,
  translateStatus,
  isDayOpen,
  dayName,
} from '@/lib/utils';

type Step = 1 | 2 | 3 | 4; // 4 = confirmación

interface Props {
  space: Space;
  profile: Profile | null;
  userId: string;
  userEmail: string;
}

export default function BookingFlow({ space, profile, userId, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isCoworking = space.pricing_model === 'daily';

  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState(todayPlus(1));
  const [time, setTime] = useState(() => `${String(space.open_hour).padStart(2, '0')}:00`);
  const [hours, setHours] = useState(isCoworking ? 1 : 2);
  const [notes, setNotes] = useState('');
  const [openDays, setOpenDays] = useState<string[]>(['mon','tue','wed','thu','fri','sat','sun']); // fallback: todos
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { subtotal_cents, tax_cents, total_cents } = calculatePrice(space, hours);

  // Cargar open_days de business_settings al montar
  useEffect(() => {
    supabase.from('business_settings').select('open_days').eq('id', 1).single()
      .then(({ data }) => { if (data?.open_days) setOpenDays(data.open_days); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar slots cuando entras al paso 2 o cambias fecha
  useEffect(() => {
    // Solo cargar si estamos en paso 2 y NO es coworking
    if (step !== 2 || isCoworking) return;

    let cancelled = false;

    async function loadSlots() {
      setSlotsLoading(true);
      setSlotsError(null);
      console.log('[BookingFlow] Cargando slots para', space.id, date);

      const { data, error } = await supabase.rpc('get_available_slots', {
        p_space_id: space.id,
        p_date: date,
      });

      if (cancelled) return;

      setSlotsLoading(false);

      if (error) {
        console.error('[BookingFlow] get_available_slots error:', error);
        setSlotsError(error.message);
        setSlots([]);
      } else {
        console.log('[BookingFlow] Slots recibidos:', data);
        setSlots((data || []) as AvailableSlot[]);
      }
    }

    loadSlots();

    // Cleanup: si el componente se desmonta o cambia la fecha, cancelar
    return () => { cancelled = true; };
  }, [step, date, isCoworking, space.id, supabase]);

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);

    // Doble-check backend: rechazar si el día no está habilitado
    if (!isDayOpen(date, openDays)) {
      setSubmitError(`Los ${dayName(date)}s no están disponibles. Elige otra fecha.`);
      setSubmitting(false);
      return;
    }

    const startsAt = buildMexicoCityISO(date, isCoworking ? `${String(space.open_hour).padStart(2, '0')}:00` : time);
    const pkgDays = space.package_days ?? 5;
    const duration_hours = isCoworking ? (hours === pkgDays ? pkgDays * 8 : 8) : hours;
    const durationMs = isCoworking ? hours * 24 * 60 * 60 * 1000 : hours * 60 * 60 * 1000;
    const endsAt = new Date(new Date(startsAt).getTime() + durationMs).toISOString();

    const payload = {
      user_id: userId, // Siempre disponible desde la sesión
      space_id: space.id,
      starts_at: startsAt,
      ends_at: endsAt,
      duration_hours,
      customer_name: profile?.full_name || userEmail.split('@')[0],
      customer_email: userEmail,
      customer_phone: profile?.phone || 'sin-telefono',
      notes: notes.trim() || null,
      subtotal_cents,
      tax_cents,
      total_cents,
      status: 'pending' as const,
      // folio: generado automáticamente por trigger en Supabase, no enviar
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select('*, spaces(name, accent_color, base_unit)')
        .single();

      if (error) {
        console.error('createBooking error:', error);
        if (error.code === '23P01' || /overlap|exclude/i.test(error.message)) {
          setSubmitError('Esa hora ya está reservada. Vuelve al paso anterior y elige otra hora.');
        } else if (/security|policy|rls/i.test(error.message)) {
          setSubmitError('Error de permisos. Cierra sesión, vuelve a entrar e intenta de nuevo.');
        } else {
          setSubmitError(`Error: ${error.message}`);
        }
        return;
      }

      setConfirmedBooking(data as Booking);
      setStep(4);
    } catch (err) {
      console.error('createBooking exception:', err);
      setSubmitError('Error de red. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayWithMP() {
    if (!confirmedBooking) return;
    setRedirectingToPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: confirmedBooking.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al crear preferencia de pago');
      // En producción usa init_point, en sandbox usa sandbox_init_point
      const url = process.env.NODE_ENV === 'production'
        ? json.init_point
        : (json.sandbox_init_point || json.init_point);
      window.location.href = url;
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Error al conectar con MercadoPago');
      setRedirectingToPayment(false);
    }
  }

  // ============================================================
  // RENDER: CONFIRMACIÓN
  // ============================================================
  if (step === 4 && confirmedBooking) {
    return (
      <div className="bg-paper border border-strong rounded-3xl p-10 max-md:p-7 max-w-[560px] mx-auto">
        <div className="w-16 h-16 bg-moss rounded-full grid place-items-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M5 12l5 5 9-9" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl text-center mb-1.5">
          ¡Reserva <em className="text-terra" style={{fontStyle:'italic'}}>creada</em>!
        </h2>
        <p className="text-center text-ink-soft text-sm mb-7">
          Tu folio es{' '}
          <span className="font-mono text-[13px] bg-ink text-paper px-3 py-1 rounded">
            {confirmedBooking.folio}
          </span>
        </p>

        <div className="bg-stone rounded-2xl p-5">
          <SummaryRow label="Espacio" value={space.name} />
          <SummaryRow label="Fecha" value={formatDate(confirmedBooking.starts_at)} />
          {!isCoworking && (
            <SummaryRow
              label="Horario"
              value={`${formatTime(confirmedBooking.starts_at)} — ${formatTime(confirmedBooking.ends_at)}`}
            />
          )}
          <SummaryRow
            label="Estado"
            value={<span className="pill pill-pending">{translateStatus(confirmedBooking.status)}</span>}
          />
          <SummaryRow label="Total" value={formatMoney(confirmedBooking.total_cents)} total />
        </div>

        {paymentError && (
          <div className="alert alert-error my-4">{paymentError}</div>
        )}

        <button
          onClick={handlePayWithMP}
          disabled={redirectingToPayment}
          className="btn btn-terra btn-full mt-5 flex items-center justify-center gap-2.5"
        >
          {redirectingToPayment ? (
            <><span className="loader" /> Redirigiendo a MercadoPago…</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
              Pagar con MercadoPago
            </>
          )}
        </button>

        <div className="flex gap-2.5 mt-2.5">
          <Link href="/" className="btn btn-ghost btn-full">Pagar después</Link>
          <Link href="/mis-reservas" className="btn btn-ghost btn-full">Ver mis reservas</Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: FLOW DE 3 PASOS
  // ============================================================
  return (
    <div className="bg-paper border border-strong rounded-3xl p-10 max-md:p-7">
      <div className="mb-2">
        <Link href="/" className="text-xs text-ink-soft hover:text-ink uppercase tracking-wider">
          ← Volver a espacios
        </Link>
      </div>
      <h1 className="font-serif font-normal text-3xl tracking-tight leading-tight mb-1.5">
        Reservar <em className="text-terra" style={{fontStyle:'italic'}}>{space.name}</em>
      </h1>
      <p className="text-ink-soft text-sm mb-7">
        {step === 1 && 'Confirma el espacio y revisa lo que incluye.'}
        {step === 2 && 'Elige fecha y horario.'}
        {step === 3 && 'Confirma los detalles antes de reservar.'}
      </p>

      <StepIndicator current={step} />

      {step === 1 && <Step1 space={space} onNext={() => setStep(2)} />}
      {step === 2 && (
        <Step2
          space={space}
          date={date}
          time={time}
          hours={hours}
          slots={slots}
          slotsLoading={slotsLoading}
          slotsError={slotsError}
          subtotalLabel={formatMoney(subtotal_cents)}
          openDays={openDays}
          onDateChange={setDate}
          onTimeChange={setTime}
          onHoursChange={setHours}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          space={space}
          date={date}
          time={time}
          hours={hours}
          notes={notes}
          subtotal_cents={subtotal_cents}
          tax_cents={tax_cents}
          total_cents={total_cents}
          submitting={submitting}
          submitError={submitError}
          onNotesChange={setNotes}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function StepIndicator({ current }: { current: Step }) {
  const labels = ['Espacio', 'Fecha', 'Confirmar'];
  return (
    <div className="flex items-center gap-2.5 mb-8 text-[11px] uppercase tracking-[0.14em] text-ink-soft">
      {[1, 2, 3].map((n, i) => {
        const isActive = n === current;
        const isDone = n < current;
        return (
          <div key={n} className="contents">
            <div className={`flex items-center gap-2 ${isActive ? 'opacity-100 text-ink' : isDone ? 'opacity-100 text-moss' : 'opacity-40'}`}>
              <span className={`w-5.5 h-5.5 rounded-full border grid place-items-center text-[11px] ${isActive ? 'bg-ink text-paper border-ink' : isDone ? 'bg-moss text-paper border-moss' : 'border-current'}`} style={{width:'22px',height:'22px'}}>
                {isDone ? '✓' : n}
              </span>
              <span>{labels[i]}</span>
            </div>
            {n < 3 && <div className="flex-1 h-px bg-[rgba(29,25,22,0.12)]" />}
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value, total = false }: { label: string; value: React.ReactNode; total?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 text-sm ${total ? 'border-t border-strong mt-1.5 pt-3.5 text-base' : ''}`}>
      <span className="text-ink-soft">{label}</span>
      <span className={`font-medium ${total ? 'font-serif text-xl' : ''}`}>{value}</span>
    </div>
  );
}

function Step1({ space, onNext }: { space: Space; onNext: () => void }) {
  const features = Array.isArray(space.features) ? space.features : [];
  return (
    <>
      <div className="bg-stone rounded-2xl p-5 mb-5">
        <div className="text-[13px] text-ink-soft mb-2.5">El espacio incluye:</div>
        <ul className="flex flex-col gap-1.5 text-[13.5px] list-none">
          {features.map((f, i) => (
            <li key={i} className="flex gap-2 items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-moss">
                <path d="M5 12l5 5 9-9" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end">
        <button onClick={onNext} className="btn btn-primary btn-large">
          Continuar →
        </button>
      </div>
    </>
  );
}

interface Step2Props {
  space: Space;
  date: string;
  time: string;
  hours: number;
  slots: AvailableSlot[] | null;
  slotsLoading: boolean;
  slotsError: string | null;
  subtotalLabel: string;
  openDays: string[];
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onHoursChange: (h: number) => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2({
  space, date, time, hours, slots, slotsLoading, slotsError,
  subtotalLabel, openDays, onDateChange, onTimeChange, onHoursChange, onBack, onNext,
}: Step2Props) {
  const isCoworking = space.pricing_model === 'daily';
  const dayBlocked = !isDayOpen(date, openDays);
  const dayBlockedMsg = dayBlocked
    ? `Los ${dayName(date)}s no están disponibles. Elige otro día.`
    : null;

  return (
    <>
      <div className="grid md:grid-cols-2 gap-3.5 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Fecha</label>
          <input
            type="date" value={date} min={todayPlus(0)}
            onChange={(e) => onDateChange(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{isCoworking ? 'Paquete' : 'Duración'}</label>
          {isCoworking ? (
            <select value={hours} onChange={(e) => onHoursChange(parseInt(e.target.value, 10))} className="form-input">
              <option value={1}>Day Pass — 1 día (${space.base_price})</option>
              <option value={space.package_days ?? 5}>Paquete {space.package_days ?? 5} días (${space.extra_price})</option>
            </select>
          ) : (
            <select value={hours} onChange={(e) => onHoursChange(parseInt(e.target.value, 10))} className="form-input">
              <option value={2}>2 horas (base)</option>
              <option value={3}>3 horas</option>
              <option value={4}>4 horas</option>
              <option value={5}>5 horas</option>
              <option value={6}>6 horas</option>
            </select>
          )}
        </div>
      </div>

      {!isCoworking && (
        <div className="mb-4">
          <label className="form-label block mb-1.5">Hora de inicio · disponibilidad en tiempo real</label>
          {slotsLoading ? (
            <div className="text-center py-5 text-ink-soft text-[13px]">
              <span className="loader inline-block mr-2" style={{borderColor:'rgba(29,25,22,0.2)', borderTopColor:'#1d1916'}} />
              Consultando disponibilidad…
            </div>
          ) : slotsError ? (
            <div className="alert alert-error">⚠ {slotsError}</div>
          ) : (
            <>
              <div className="grid grid-cols-4 max-sm:grid-cols-3 gap-2">
                {(slots || []).map((slot) => {
                  const h = String(slot.slot_hour).padStart(2, '0') + ':00';
                  const taken = !slot.is_available;
                  const wouldOverflow = slot.slot_hour + hours > space.close_hour;
                  const disabled = taken || wouldOverflow;
                  const selected = time === h;
                  return (
                    <button
                      key={h}
                      onClick={() => !disabled && onTimeChange(h)}
                      disabled={disabled}
                      className={`px-1 py-3 border rounded-lg text-[13px] transition-all ${
                        selected
                          ? 'bg-ink text-paper border-ink'
                          : disabled
                          ? 'bg-stone opacity-35 line-through cursor-not-allowed'
                          : 'bg-bone hover:border-ink'
                      }`}
                      title={taken ? 'Hora ocupada' : wouldOverflow ? 'Excede horario de cierre' : ''}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              {slots && slots.length > 0 && (
                <p className="text-[11.5px] text-ink-soft mt-2">
                  Las horas tachadas ya están reservadas o exceden el horario.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-stone rounded-2xl p-5 my-4">
        <SummaryRow label="Espacio" value={space.name} />
        <SummaryRow label="Fecha" value={formatDate(date)} />
        {!isCoworking && <SummaryRow label="Hora" value={time} />}
        <SummaryRow
          label="Duración"
          value={isCoworking ? (hours === (space.package_days ?? 5) ? `${space.package_days ?? 5} días` : '1 día') : `${hours} ${hours === 1 ? 'hora' : 'horas'}`}
        />
        <SummaryRow label="Subtotal" value={subtotalLabel} total />
      </div>

      {dayBlockedMsg && (
        <div className="alert alert-error mb-3">📅 {dayBlockedMsg}</div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-ghost">Atrás</button>
        <button onClick={onNext} className="btn btn-primary btn-large" disabled={dayBlocked || (!isCoworking && !time)}>
          Continuar →
        </button>
      </div>
    </>
  );
}

interface Step3Props {
  space: Space;
  date: string;
  time: string;
  hours: number;
  notes: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  submitting: boolean;
  submitError: string | null;
  onNotesChange: (n: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

function Step3({
  space, date, time, hours, notes, subtotal_cents, tax_cents, total_cents,
  submitting, submitError, onNotesChange, onBack, onConfirm,
}: Step3Props) {
  const isCoworking = space.pricing_model === 'daily';
  return (
    <>
      <div className="bg-stone rounded-2xl p-5 mb-4">
        <SummaryRow label="Espacio" value={space.name} />
        <SummaryRow label="Fecha" value={formatDate(date)} />
        {!isCoworking && <SummaryRow label="Hora" value={time} />}
        <SummaryRow
          label="Duración"
          value={isCoworking ? (hours === (space.package_days ?? 5) ? `Paquete ${space.package_days ?? 5} días` : 'Day Pass · 1 día') : `${hours} ${hours === 1 ? 'hora' : 'horas'}`}
        />
        <SummaryRow label="Subtotal" value={formatMoney(subtotal_cents)} />
        <SummaryRow label="IVA (16%)" value={formatMoney(tax_cents)} />
        <SummaryRow label="Total" value={formatMoney(total_cents)} total />
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <label className="form-label">Notas (opcional)</label>
        <textarea
          value={notes} onChange={(e) => onNotesChange(e.target.value)}
          placeholder="¿Necesitas algo en particular? Café para 4, configuración específica, etc."
          rows={3} className="form-input resize-y"
        />
      </div>

      <div className="alert alert-info">
        Al confirmar se creará tu reserva y serás redirigido a <strong>MercadoPago</strong> para completar el pago de forma segura.
      </div>

      {submitError && <div className="alert alert-error mt-3">{submitError}</div>}

      <div className="flex justify-between mt-5">
        <button onClick={onBack} disabled={submitting} className="btn btn-ghost">Atrás</button>
        <button onClick={onConfirm} disabled={submitting} className="btn btn-terra btn-large">
          {submitting ? <><span className="loader" /> Creando reserva…</> : 'Confirmar reserva'}
        </button>
      </div>
    </>
  );
}
