'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BusinessSettings } from '@/types/database';

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const;

const DEFAULTS: Omit<BusinessSettings, 'id' | 'updated_at'> = {
  name: 'Casa Hidalgo',
  email: 'hola@casahidalgo.mx',
  address: 'Hidalgo 47B, Centro Histórico, 76000 Querétaro, Qro.',
  whatsapp: '442 285 5151',
  open_time: '09:00',
  close_time: '18:00',
  open_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  maps_embed: null,
};

export default function BusinessSettingsForm() {
  const supabase = createClient();
  const [fields, setFields] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    supabase.from('business_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, updated_at: _ua, ...rest } = data as BusinessSettings;
          setFields({ ...DEFAULTS, ...rest });
        }
        setLoading(false);
      })
      .then(undefined, () => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof typeof DEFAULTS>(key: K, value: typeof DEFAULTS[K]) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function toggleDay(key: string) {
    setFields(prev => ({
      ...prev,
      open_days: prev.open_days.includes(key)
        ? prev.open_days.filter(d => d !== key)
        : [...prev.open_days, key],
    }));
  }

  async function save() {
    if (!fields.open_time || !fields.close_time) {
      setError('Ingresa horario de apertura y cierre.');
      return;
    }
    if (fields.close_time <= fields.open_time) {
      setError('La hora de cierre debe ser mayor que la de apertura.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('business_settings')
      .upsert({ id: 1, ...fields });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  const activeDayLabels = DAYS.filter(d => fields.open_days.includes(d.key)).map(d => d.label);

  if (loading) return (
    <div className="bg-bone border rounded-2xl p-6 text-center text-ink-soft text-sm">
      <span className="loader inline-block mr-2" />Cargando configuración…
    </div>
  );

  return (
    <div className="bg-bone border rounded-2xl p-6">
      <h3 className="font-serif font-medium text-[17px] mb-1">Datos del negocio</h3>
      <p className="text-[13px] text-ink-soft mb-6">
        Información que aparece en el sitio público y comprobantes.
      </p>

      {error   && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">✓ Cambios guardados y reflejados en el sitio</div>}

      {/* Datos generales */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Nombre comercial</label>
          <input value={fields.name} onChange={e => set('name', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Email de contacto</label>
          <input type="email" value={fields.email} onChange={e => set('email', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="form-label">Dirección</label>
          <input value={fields.address} onChange={e => set('address', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">WhatsApp</label>
          <input value={fields.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Embed Google Maps</label>
          <input
            value={fields.maps_embed || ''}
            onChange={e => set('maps_embed', e.target.value || null)}
            placeholder="https://www.google.com/maps/embed?pb=…"
            className="form-input text-[12px]"
          />
          <span className="text-[11px] text-ink-soft">Pega aquí el src del iframe desde Google Maps → Compartir → Insertar mapa</span>
        </div>
      </div>

      {/* Horario del negocio */}
      <div className="mb-6">
        <div className="form-label mb-3">Horario del negocio</div>
        <div className="grid grid-cols-2 gap-3 max-w-[320px]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] text-ink-soft">Apertura</label>
            <input
              type="time"
              value={fields.open_time}
              onChange={e => set('open_time', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] text-ink-soft">Cierre</label>
            <input
              type="time"
              value={fields.close_time}
              onChange={e => set('close_time', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Días de atención */}
      <div className="mb-6">
        <div className="form-label mb-3">Días de atención</div>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleDay(key)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                fields.open_days.includes(key)
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-ink-soft border-strong hover:border-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeDayLabels.length > 0 && (
          <p className="text-[11.5px] text-ink-soft mt-2">
            Visible en el sitio: {activeDayLabels.join(', ')} · {fields.open_time}–{fields.close_time}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t pt-4">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? <><span className="loader" /> Guardando…</> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
