'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Space } from '@/types/database';

interface Props {
  space: Space;
}

const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
] as const;

// Convierte número entero (9) → string time ("09:00")
function hourToTime(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}
// Convierte "09:30" → número entero 9 (solo horas)
function timeToHour(t: string) {
  return parseInt(t.split(':')[0], 10) || 0;
}

export default function SpaceEditor({ space }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [basePrice, setBasePrice]   = useState(space.base_price);
  const [extraPrice, setExtraPrice] = useState(space.extra_price);
  const [capacity, setCapacity]     = useState(space.capacity);
  const [openTime, setOpenTime]     = useState(hourToTime(space.open_hour));
  const [closeTime, setCloseTime]   = useState(hourToTime(space.close_hour));
  const [isActive, setIsActive]     = useState(space.is_active);
  const [packageDays, setPackageDays] = useState(space.package_days ?? 5);

  // Días operativos — default Lun-Vie
  const [days, setDays] = useState<Record<string, boolean>>({
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
  });

  function toggleDay(key: string) {
    setDays(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function save() {
    const newOpenHour  = timeToHour(openTime);
    const newCloseHour = timeToHour(closeTime);
    if (newCloseHour <= newOpenHour) {
      setError('La hora de cierre debe ser mayor que la de apertura.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: err } = await supabase
      .from('spaces')
      .update({
        base_price:   basePrice,
        extra_price:  extraPrice,
        capacity,
        open_hour:    newOpenHour,
        close_hour:   newCloseHour,
        is_active:    isActive,
        package_days: packageDays,
      })
      .eq('id', space.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    router.refresh();
  }

  return (
    <div className="bg-paper border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-stone/30 transition-colors"
      >
        <div>
          <div className="font-serif font-medium text-[16px]">{space.name}</div>
          <div className="text-[12px] text-ink-soft mt-0.5">
            ${space.base_price} mxn · {space.base_unit} · cap. {space.capacity}
            {' '}· {hourToTime(space.open_hour)}–{hourToTime(space.close_hour)}
            {!space.is_active && <span className="ml-2 text-terra">· INACTIVO</span>}
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t space-y-4">
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">✓ Cambios guardados</div>}

          {/* Precios y capacidad */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Precio base (MXN)</label>
              <input
                type="number" min="0" value={basePrice}
                onChange={(e) => setBasePrice(parseInt(e.target.value, 10) || 0)}
                className="form-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Hora extra (MXN)</label>
              <input
                type="number" min="0" value={extraPrice}
                onChange={(e) => setExtraPrice(parseInt(e.target.value, 10) || 0)}
                className="form-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Capacidad</label>
              <input
                type="number" min="1" value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                className="form-input"
              />
            </div>
          </div>

          {/* Días de paquete (solo modelos por día) */}
          {space.pricing_model === 'daily' && (
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Días del paquete multi-día</label>
              <input
                type="number" min="2" max="30" value={packageDays}
                onChange={(e) => setPackageDays(parseInt(e.target.value, 10) || 5)}
                className="form-input max-w-[160px]"
              />
              <p className="text-[11.5px] text-ink-soft">
                El paquete se ofrece como "{packageDays} días" al precio extra configurado.
              </p>
            </div>
          )}

          {/* Horario */}
          <div>
            <div className="form-label mb-2">Horario de operación</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11.5px] text-ink-soft">Apertura</label>
                <input
                  type="time" value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11.5px] text-ink-soft">Cierre</label>
                <input
                  type="time" value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Días operativos */}
          <div>
            <div className="form-label mb-2">Días de operación</div>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    days[key]
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink-soft border-strong hover:border-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-ink-soft mt-2">
              Los días seleccionados se mostrarán en el sitio público.
            </p>
          </div>

          {/* Visibilidad */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Visibilidad</label>
            <select
              value={isActive ? '1' : '0'}
              onChange={(e) => setIsActive(e.target.value === '1')}
              className="form-input max-w-[260px]"
            >
              <option value="1">Activo — visible al público</option>
              <option value="0">Inactivo — oculto del sitio</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button onClick={() => setOpen(false)} disabled={saving} className="btn btn-ghost">
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary">
              {saving ? <><span className="loader" /> Guardando…</> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  space: Space;
}

