// ============================================================
// lib/utils.ts — Utilidades de formato, precio, fechas
// ============================================================
import type { Space, BookingStatus } from '@/types/database';

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-MX')} mxn`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  });
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || ''))
      .toUpperCase() || '?'
  );
}

export function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface PriceBreakdown {
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
}

/**
 * Calcula el precio de una reserva basado en el espacio y la duración.
 * Para hourly: base_price (2hrs) + extra_price * (hours - 2)
 * Para daily: base_price (1 día) o extra_price (7 días)
 */
export function calculatePrice(space: Space, hours: number): PriceBreakdown {
  let subtotal_cents: number;

  if (space.pricing_model === 'daily') {
    subtotal_cents = (hours === 7 ? space.extra_price : space.base_price) * 100;
  } else {
    const baseHours = 2;
    const extraHours = Math.max(0, hours - baseHours);
    subtotal_cents = (space.base_price + extraHours * space.extra_price) * 100;
  }

  const tax_cents = Math.round(subtotal_cents * 0.16);
  return {
    subtotal_cents,
    tax_cents,
    total_cents: subtotal_cents + tax_cents,
  };
}

/**
 * Construye un ISO timestamp en zona horaria de México (UTC-6, sin DST).
 * Recibe date 'YYYY-MM-DD' y time 'HH:MM'.
 */
export function buildMexicoCityISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00-06:00`).toISOString();
}

/**
 * Verifica si una fecha (YYYY-MM-DD) cae en un día habilitado.
 * openDays usa el formato de business_settings: ['mon','tue','wed','thu','fri','sat','sun']
 */
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export function isDayOpen(dateStr: string, openDays: string[]): boolean {
  // Parsear la fecha local evitando desfases de zona horaria
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayIndex = new Date(y, m - 1, d).getDay(); // 0=dom … 6=sab
  return openDays.includes(DAY_KEYS[dayIndex]);
}

/** Nombre legible del día para mensajes de error */
export function dayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long' });
}

export function translateStatus(s: BookingStatus): string {
  return ({
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    no_show: 'No show',
  } as const)[s];
}

export function translateAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email o contraseña incorrectos.';
  if (/email not confirmed/i.test(msg)) return 'Tu email aún no ha sido confirmado.';
  if (/user already registered/i.test(msg)) return 'Ya existe una cuenta con este email.';
  if (/password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/network/i.test(msg)) return 'Error de conexión. Verifica tu internet.';
  return msg;
}
