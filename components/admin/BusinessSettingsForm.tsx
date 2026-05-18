'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'casa_hidalgo_business_settings';

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const;

interface Settings {
  name: string;
  email: string;
  address: string;
  whatsapp: string;
  openTime: string;
  closeTime: string;
  days: Record<string, boolean>;
}

const DEFAULTS: Settings = {
  name: 'Casa Hidalgo',
  email: 'hola@casahidalgo.mx',
  address: 'Hidalgo 47B, Centro Histórico, 76000 Querétaro, Qro.',
  whatsapp: '442 285 5151',
  openTime: '09:00',
  closeTime: '18:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
};

export default function BusinessSettingsForm() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toggleDay(key: string) {
    setSettings(prev => ({
      ...prev,
      days: { ...prev.days, [key]: !prev.days[key] },
    }));
  }

  function save() {
    if (!settings.openTime || !settings.closeTime) {
      setError('Ingresa horario de apertura y cierre.');
      return;
    }
    if (settings.closeTime <= settings.openTime) {
      setError('La hora de cierre debe ser mayor que la de apertura.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError('No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSettings(stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS);
    } catch {
      setSettings(DEFAULTS);
    }
    setError(null);
  }

  const activeDays = DAYS.filter(d => settings.days[d.key]).map(d => d.label);

  return (
    <div className="bg-bone border rounded-2xl p-6">
      <h3 className="font-serif font-medium text-[17px] mb-1">Datos del negocio</h3>
      <p className="text-[13px] text-ink-soft mb-6">
        Información que aparece en el sitio público y comprobantes.
      </p>

      {error   && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">✓ Cambios guardados</div>}

      {/* Datos generales */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Nombre comercial</label>
          <input value={settings.name} onChange={e => set('name', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Email de contacto</label>
          <input type="email" value={settings.email} onChange={e => set('email', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="form-label">Dirección</label>
          <input value={settings.address} onChange={e => set('address', e.target.value)} className="form-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label">WhatsApp</label>
          <input value={settings.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="form-input" />
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
              value={settings.openTime}
              onChange={e => set('openTime', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] text-ink-soft">Cierre</label>
            <input
              type="time"
              value={settings.closeTime}
              onChange={e => set('closeTime', e.target.value)}
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
                settings.days[key]
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-ink-soft border-strong hover:border-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeDays.length > 0 && (
          <p className="text-[11.5px] text-ink-soft mt-2">
            Visible en el sitio: {activeDays.join(', ')} · {settings.openTime}–{settings.closeTime}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t pt-4">
        <button onClick={discard} disabled={saving} className="btn btn-ghost">Descartar</button>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? <><span className="loader" /> Guardando…</> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
