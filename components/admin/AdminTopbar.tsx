'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, { crumb: string; title: string }> = {
  '/admin': { crumb: 'Casa Hidalgo / Admin', title: 'Dashboard' },
  '/admin/reservas': { crumb: 'Casa Hidalgo / Admin', title: 'Reservas' },
  '/admin/clientes': { crumb: 'Casa Hidalgo / Admin', title: 'Clientes' },
  '/admin/ajustes': { crumb: 'Casa Hidalgo / Admin', title: 'Ajustes' },
};

export default function AdminTopbar() {
  const pathname = usePathname();

  // Default fallback para subrutas (ej. /admin/reservas/abc-123)
  let info = titles[pathname];
  if (!info) {
    if (pathname.startsWith('/admin/reservas/')) info = { crumb: 'Casa Hidalgo / Admin / Reservas', title: 'Detalle de reserva' };
    else info = { crumb: 'Casa Hidalgo / Admin', title: 'Dashboard' };
  }

  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-paper/85 border-b px-8 py-5 flex justify-between items-center max-md:px-5">
      <div>
        <div className="text-[11px] text-ink-soft uppercase tracking-[0.14em] mb-1">
          {info.crumb}
        </div>
        <h1 className="font-serif font-normal text-[28px] tracking-tight leading-none">
          {info.title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
      </div>
    </div>
  );
}
