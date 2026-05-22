'use client';

interface Props {
  bookingId: string;
  folio: string;
  variant?: 'primary' | 'ghost' | 'small';
  label?: string;
}

/**
 * Botón que descarga el PDF de comprobante de una reserva.
 * Se puede usar en cualquier pantalla donde el cliente vea su reserva.
 */
export default function DownloadComprobanteButton({
  bookingId,
  folio,
  variant = 'ghost',
  label = 'Descargar comprobante',
}: Props) {
  function handleDownload() {
    const url = `/api/bookings/${bookingId}/pdf`;
    // Abrir en pestaña nueva para que el browser ofrezca descargar o ver
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-${folio}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const className =
    variant === 'primary' ? 'btn btn-primary' :
    variant === 'small' ? 'btn btn-ghost text-xs py-1.5 px-3' :
    'btn btn-ghost';

  return (
    <button onClick={handleDownload} className={className}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {label}
    </button>
  );
}
