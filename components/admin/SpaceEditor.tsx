'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Space } from '@/types/database';

interface Props {
  space: Space;
}

export default function SpaceEditor({ space }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basePrice, setBasePrice] = useState(space.base_price);
  const [extraPrice, setExtraPrice] = useState(space.extra_price);
  const [capacity, setCapacity] = useState(space.capacity);
  const [openHour, setOpenHour] = useState(space.open_hour);
  const [closeHour, setCloseHour] = useState(space.close_hour);
  const [isActive, setIsActive] = useState(space.is_active);

  async function save() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('spaces')
      .update({
        base_price: basePrice,
        extra_price: extraPrice,
        capacity,
        open_hour: openHour,
        close_hour: closeHour,
        is_active: isActive,
      })
      .eq('id', space.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOpen(false);
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
            {!space.is_active && <span className="ml-2 text-terra">· INACTIVO</span>}
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t">
          {error && <div className="alert alert-error mb-3">{error}</div>}

          <div className="grid md:grid-cols-2 gap-3 mb-4">
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
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Activo</label>
              <select
                value={isActive ? '1' : '0'}
                onChange={(e) => setIsActive(e.target.value === '1')}
                className="form-input"
              >
                <option value="1">Sí — visible al público</option>
                <option value="0">No — oculto</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Hora apertura</label>
              <input
                type="number" min="0" max="23" value={openHour}
                onChange={(e) => setOpenHour(parseInt(e.target.value, 10) || 0)}
                className="form-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Hora cierre</label>
              <input
                type="number" min="1" max="24" value={closeHour}
                onChange={(e) => setCloseHour(parseInt(e.target.value, 10) || 24)}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setOpen(false)}
              className="btn btn-ghost"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? <><span className="loader" /> Guardando…</> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
