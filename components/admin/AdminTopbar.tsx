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
        <div className="hidden md:flex items-center gap-2.5 bg-stone rounded-full px-4 py-2 text-sm text-ink-soft w-[280px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            placeholder="Buscar…"
            className="flex-1 bg-transparent border-0 outline-none text-sm"
          />
          <span className="font-mono text-[11px] opacity-50">⌘K</span>
        </div>
      </div>
    </div>
  );
}
