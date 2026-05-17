// ============================================================
// app/api/checkout/create-preference/route.ts
// Crea una preference de MercadoPago para una reserva existente.
// El cliente (BookingFlow) la llama justo antes de redirigir.
// ============================================================
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPreference } from '@/lib/mercadopago';
import type { Booking } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerido' }, { status: 400 });
    }

    // Verificar que el usuario está autenticado y la reserva es suya
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, spaces(name)')
      .eq('id', bookingId)
      .eq('user_id', user.id) // RLS también lo enforza, pero doble check
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const b = booking as Booking;

    if (b.status !== 'pending') {
      return NextResponse.json(
        { error: `Esta reserva ya no está pendiente (estado: ${b.status})` },
        { status: 400 }
      );
    }

    // URL base para los callbacks
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Fecha de expiración del checkout (30 min para pagar)
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Crear la preference en MercadoPago
    const preference = await createPreference({
      items: [
        {
          id: b.space_id,
          title: `Reserva ${b.folio} — ${b.spaces?.name || 'Espacio Casa Hidalgo'}`,
          description: `${b.duration_hours}h · ${new Date(b.starts_at).toLocaleDateString('es-MX')}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: Math.round(b.total_cents / 100), // MP espera precio en MXN, no centavos
          category_id: 'services',
        },
      ],
      payer: {
        name: b.customer_name.split(' ')[0],
        surname: b.customer_name.split(' ').slice(1).join(' '),
        email: b.customer_email,
      },
      back_urls: {
        success: `${siteUrl}/pago/exito?booking=${b.id}`,
        failure: `${siteUrl}/pago/error?booking=${b.id}`,
        pending: `${siteUrl}/pago/pendiente?booking=${b.id}`,
      },
      auto_return: 'approved',
      external_reference: b.folio,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'CASA HIDALGO',
      expires: true,
      expiration_date_to: expirationDate,
      metadata: {
        booking_id: b.id,
        folio: b.folio,
        user_id: b.user_id,
      },
    });

    // Guardar la preference_id en la BD (para idempotencia y debugging)
    await supabase.from('payments').insert({
      booking_id: b.id,
      provider: 'mercadopago',
      mp_preference_id: preference.id,
      mp_external_ref: b.folio,
      amount_cents: b.total_cents,
      status: 'pending',
    });

    return NextResponse.json({
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (error) {
    console.error('[create-preference] Error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
