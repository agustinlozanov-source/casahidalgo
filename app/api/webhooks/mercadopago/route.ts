// ============================================================
// app/api/webhooks/mercadopago/route.ts
// Webhook que MercadoPago llama cuando algo cambia en un pago.
// CRÍTICO: este endpoint actualiza la BD según el estado real del pago.
// ============================================================
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPayment, mapPaymentStatus, mapBookingStatusFromPayment } from '@/lib/mercadopago';

export async function POST(request: Request) {
  // Capturar el payload tal cual viene
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.error('[mp-webhook] Body inválido');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log('[mp-webhook] Payload recibido:', JSON.stringify(body));

  // El webhook de MP puede mandar varias formas:
  // 1. { topic: 'payment', resource: '12345' }  (notificación antigua)
  // 2. { type: 'payment', data: { id: '12345' } }  (notificación nueva, v2)
  // 3. URL query params (?topic=payment&id=12345)
  const url = new URL(request.url);
  const queryTopic = url.searchParams.get('topic') || url.searchParams.get('type');
  const queryId = url.searchParams.get('id') || url.searchParams.get('data.id');

  const topic = (body.type as string) || (body.topic as string) || queryTopic;
  const data = body.data as { id?: string } | undefined;
  const resource = (body.resource as string) || data?.id || queryId;

  // Por ahora solo nos interesan los de payment
  if (topic !== 'payment') {
    console.log('[mp-webhook] Topic ignorado:', topic);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (!resource) {
    console.error('[mp-webhook] Sin payment_id');
    return NextResponse.json({ received: true, error: 'no_id' }, { status: 200 });
  }

  // Extraer el payment_id (puede venir como URL completa o solo el ID)
  const paymentId = String(resource).replace(/\D/g, '') || String(resource);

  const supabase = createAdminClient();

  // ============================================================
  // IDEMPOTENCIA: guardar el evento crudo, ignorar si ya se procesó
  // ============================================================
  const eventId = `mp-payment-${paymentId}-${(body.action as string) || 'update'}-${(body.date_created as string) || Date.now()}`;

  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEvent?.processed) {
    console.log('[mp-webhook] Evento ya procesado, ignorando:', eventId);
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  if (!existingEvent) {
    await supabase.from('webhook_events').insert({
      provider: 'mercadopago',
      event_id: eventId,
      event_type: topic,
      payload: body,
      processed: false,
    });
  }

  // ============================================================
  // Consultar el pago real en MP
  // ============================================================
  try {
    const payment = await getPayment(paymentId);
    console.log('[mp-webhook] Payment fetched:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    });

    const folio = payment.external_reference;
    if (!folio) {
      throw new Error('Payment sin external_reference');
    }

    // Buscar el booking por folio
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, user_id')
      .eq('folio', folio)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error(`Booking ${folio} no encontrado`);
    }

    const mappedPaymentStatus = mapPaymentStatus(payment.status);
    const mappedBookingStatus = mapBookingStatusFromPayment(payment.status);

    // ============================================================
    // Upsert del pago
    // ============================================================
    const paymentRecord = {
      booking_id: booking.id,
      provider: 'mercadopago' as const,
      mp_payment_id: String(payment.id),
      mp_external_ref: folio,
      mp_payment_method: payment.payment_method_id,
      mp_payment_type: payment.payment_type_id,
      amount_cents: Math.round(payment.transaction_amount * 100),
      net_received_cents: payment.net_received_amount
        ? Math.round(payment.net_received_amount * 100)
        : null,
      fee_cents: payment.fee_details
        ? Math.round(payment.fee_details.reduce((s, f) => s + f.amount, 0) * 100)
        : null,
      status: mappedPaymentStatus,
      status_detail: payment.status_detail,
      paid_at: payment.date_approved,
      raw_response: payment as unknown as Record<string, unknown>,
    };

    // Si ya existía un payment por preference_id, actualizarlo. Si no, insertar.
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('mp_external_ref', folio)
      .maybeSingle();

    if (existingPayment) {
      await supabase
        .from('payments')
        .update(paymentRecord)
        .eq('id', existingPayment.id);
    } else {
      await supabase.from('payments').insert(paymentRecord);
    }

    // ============================================================
    // Actualizar booking status (solo si cambia algo significativo)
    // ============================================================
    if (booking.status !== mappedBookingStatus && booking.status !== 'cancelled') {
      const updateData: Record<string, unknown> = { status: mappedBookingStatus };
      if (mappedBookingStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_reason = `Pago ${payment.status}: ${payment.status_detail}`;
      }
      await supabase.from('bookings').update(updateData).eq('id', booking.id);
      console.log(`[mp-webhook] Booking ${folio} actualizado: ${booking.status} → ${mappedBookingStatus}`);
    }

    // Marcar evento como procesado
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('[mp-webhook] Error procesando:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';

    // Marcar el evento con error pero responder 200 para que MP NO reintente infinitamente
    // (si responde 500, MP reintenta hasta 7 veces y agota retries)
    await supabase
      .from('webhook_events')
      .update({ error: message })
      .eq('event_id', eventId);

    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}

// MercadoPago también puede hacer GET al webhook para verificarlo
export async function GET() {
  return NextResponse.json({ ok: true, message: 'MercadoPago webhook endpoint' });
}
