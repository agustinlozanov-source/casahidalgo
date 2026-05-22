// ============================================================
// app/api/bookings/[id]/pdf/route.ts
// Genera un PDF de comprobante para una reserva específica.
// Solo accesible para el dueño de la reserva o admin.
// ============================================================
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import type { Booking } from '@/types/database';
import { formatDate, formatTime, formatMoney, translateStatus } from '@/lib/utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Buscar la reserva (RLS asegura que solo ve la suya o admin ve todas)
  const { data: bookingRaw, error } = await supabase
    .from('bookings')
    .select('*, spaces(name, accent_color, base_unit)')
    .eq('id', id)
    .maybeSingle();

  if (error || !bookingRaw) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }
  const booking = bookingRaw as Booking;

  // ============================================================
  // GENERAR PDF
  // ============================================================
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const serif = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Colores (paleta Casa Hidalgo)
  const INK = rgb(0.11, 0.10, 0.09);
  const INK_SOFT = rgb(0.23, 0.20, 0.18);
  const TERRA = rgb(0.73, 0.29, 0.17);
  const STONE = rgb(0.93, 0.90, 0.85);
  const MOSS = rgb(0.29, 0.36, 0.23);
  const PAPER = rgb(0.98, 0.96, 0.93);

  // Fondo con tinte papel
  page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER });

  // ============================================================
  // HEADER
  // ============================================================
  const headerY = height - 70;

  // Marca "H" cuadrada
  page.drawRectangle({
    x: 50, y: headerY - 8,
    width: 32, height: 32,
    color: INK,
  });
  page.drawText('H', {
    x: 60, y: headerY,
    size: 22,
    font: serif,
    color: PAPER,
  });

  // Casa Hidalgo
  page.drawText('Casa Hidalgo', {
    x: 92, y: headerY + 4,
    size: 22,
    font: serifBold,
    color: INK,
  });
  page.drawText('Centro Historico · Queretaro', {
    x: 92, y: headerY - 12,
    size: 10,
    font: sans,
    color: INK_SOFT,
  });

  // Línea divisoria
  page.drawLine({
    start: { x: 50, y: height - 105 },
    end: { x: width - 50, y: height - 105 },
    thickness: 0.5,
    color: INK_SOFT,
  });

  // ============================================================
  // TÍTULO
  // ============================================================
  const titleY = height - 160;
  page.drawText('COMPROBANTE DE RESERVA', {
    x: 50, y: titleY + 30,
    size: 10,
    font: sansBold,
    color: TERRA,
    rotate: degrees(0),
  });
  page.drawText('Comprobante de', {
    x: 50, y: titleY,
    size: 32,
    font: serifBold,
    color: INK,
  });
  page.drawText('reserva', {
    x: 50, y: titleY - 36,
    size: 32,
    font: serif,
    color: TERRA,
  });

  // ============================================================
  // FOLIO BOX (esquina superior derecha)
  // ============================================================
  const folioBoxX = width - 200;
  const folioBoxY = titleY - 20;
  page.drawRectangle({
    x: folioBoxX, y: folioBoxY,
    width: 150, height: 60,
    color: INK,
  });
  page.drawText('FOLIO', {
    x: folioBoxX + 14, y: folioBoxY + 42,
    size: 8,
    font: sansBold,
    color: PAPER,
  });
  page.drawText(booking.folio, {
    x: folioBoxX + 14, y: folioBoxY + 18,
    size: 18,
    font: mono,
    color: PAPER,
  });

  // ============================================================
  // DATOS DE LA RESERVA (caja gris)
  // ============================================================
  const boxY = height - 320;
  const boxHeight = 220;
  page.drawRectangle({
    x: 50, y: boxY,
    width: width - 100, height: boxHeight,
    color: STONE,
  });

  const rows = [
    ['Espacio', booking.spaces?.name || booking.space_id],
    ['Fecha', formatDate(booking.starts_at)],
    ['Horario', `${formatTime(booking.starts_at)} — ${formatTime(booking.ends_at)}`],
    ['Duracion', `${booking.duration_hours} ${booking.duration_hours === 1 ? 'hora' : 'horas'}`],
    ['Cliente', booking.customer_name],
    ['Email', booking.customer_email],
    ['Telefono', booking.customer_phone || '—'],
  ];

  let rowY = boxY + boxHeight - 28;
  for (const [label, value] of rows) {
    page.drawText(label, {
      x: 70, y: rowY,
      size: 9,
      font: sansBold,
      color: INK_SOFT,
    });
    page.drawText(String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), {
      x: 200, y: rowY,
      size: 11,
      font: sans,
      color: INK,
    });
    rowY -= 26;
  }

  // ============================================================
  // TOTAL Y ESTADO
  // ============================================================
  const totalY = boxY - 50;

  // Estado pill
  let estadoColor = INK_SOFT;
  if (booking.status === 'confirmed') estadoColor = MOSS;
  if (booking.status === 'pending') estadoColor = rgb(0.78, 0.59, 0.28);
  if (booking.status === 'cancelled') estadoColor = TERRA;

  page.drawText('ESTADO', {
    x: 50, y: totalY + 22,
    size: 8,
    font: sansBold,
    color: INK_SOFT,
  });
  page.drawText(translateStatus(booking.status).toUpperCase(), {
    x: 50, y: totalY,
    size: 14,
    font: sansBold,
    color: estadoColor,
  });

  page.drawText('TOTAL', {
    x: width - 200, y: totalY + 22,
    size: 8,
    font: sansBold,
    color: INK_SOFT,
  });
  page.drawText(formatMoney(booking.total_cents).toUpperCase(), {
    x: width - 200, y: totalY,
    size: 20,
    font: serifBold,
    color: INK,
  });

  // ============================================================
  // INSTRUCCIONES
  // ============================================================
  const instY = totalY - 80;
  page.drawLine({
    start: { x: 50, y: instY + 25 },
    end: { x: width - 50, y: instY + 25 },
    thickness: 0.5,
    color: INK_SOFT,
  });

  page.drawText('AL LLEGAR A CASA HIDALGO', {
    x: 50, y: instY,
    size: 9,
    font: sansBold,
    color: TERRA,
  });

  const instructions = [
    'Presenta este comprobante junto con tu identificacion oficial (INE o pasaporte).',
    'En su defecto, puedes mencionar tu numero de folio para validar tu reserva.',
    'Llega 5 minutos antes del horario para una mejor experiencia.',
  ];

  let instLineY = instY - 18;
  for (const line of instructions) {
    page.drawText('•  ' + line, {
      x: 50, y: instLineY,
      size: 10,
      font: sans,
      color: INK_SOFT,
    });
    instLineY -= 16;
  }

  // ============================================================
  // FOOTER
  // ============================================================
  const footerY = 60;
  page.drawLine({
    start: { x: 50, y: footerY + 30 },
    end: { x: width - 50, y: footerY + 30 },
    thickness: 0.5,
    color: INK_SOFT,
  });

  page.drawText('Calle Hidalgo · Centro Historico · Queretaro, Mexico', {
    x: 50, y: footerY + 14,
    size: 9,
    font: sans,
    color: INK_SOFT,
  });
  page.drawText('WhatsApp: 442 285 5151', {
    x: 50, y: footerY,
    size: 9,
    font: sans,
    color: INK_SOFT,
  });

  page.drawText(`Generado ${new Date().toLocaleDateString('es-MX')}`, {
    x: width - 180, y: footerY,
    size: 8,
    font: sans,
    color: INK_SOFT,
  });

  // ============================================================
  // GENERAR Y RETORNAR
  // ============================================================
  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes as BlobPart, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprobante-${booking.folio}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
