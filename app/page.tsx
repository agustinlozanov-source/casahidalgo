// ============================================================
// app/page.tsx — Landing público
// Server Component que carga los espacios desde Supabase
// ============================================================
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import SpaceCard from '@/components/booking/SpaceCard';
import HeroIllustration from '@/components/layout/HeroIllustration';
import type { Space } from '@/types/database';

export const revalidate = 60; // Revalidar cada 60s

export default async function HomePage() {
  const supabase = await createClient();
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return (
    <>
      <NavBar />

      {/* HERO */}
      <section id="inicio" className="max-w-[1280px] mx-auto px-9 py-16 md:py-20 grid md:grid-cols-[1.15fr_1fr] gap-16 items-center max-md:px-5 max-md:gap-10">
        <div>
          <div className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.18em] text-ink-soft mb-7">
            <span className="w-1.5 h-1.5 bg-terra rounded-full animate-pulse-dot" />
            Centro Histórico · Querétaro
          </div>
          <h1 className="font-serif font-light text-[clamp(42px,6vw,86px)] leading-[0.98] tracking-tight mb-7">
            Espacios que <em className="text-terra not-italic font-light" style={{fontStyle:'italic'}}>respiran</em>
            <br />historia.<br />
            Diseñados para <em className="text-terra not-italic font-light" style={{fontStyle:'italic'}}>trabajar</em>.
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-soft max-w-[480px] mb-9">
            En una casona del siglo XIX sobre Calle Hidalgo. Tres espacios pensados
            para reunirte, crear contenido o concentrarte. Reserva por horas, sin contratos.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="#espacios" className="btn btn-primary btn-large">
              Ver espacios
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="flex gap-9 mt-12 pt-7 border-t">
            <div>
              <div className="font-serif text-3xl leading-none">3</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mt-1">Espacios</div>
            </div>
            <div>
              <div className="font-serif text-3xl leading-none">10–17h</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mt-1">Lun a Vie</div>
            </div>
            <div>
              <div className="font-serif text-3xl leading-none">
                $250<span className="text-[13px] text-ink-soft font-sans"> mxn</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mt-1">Desde</div>
            </div>
          </div>
        </div>
        <HeroIllustration />
      </section>

      {/* SPACES */}
      <section id="espacios" className="max-w-[1280px] mx-auto px-9 py-20 max-md:px-5 max-md:py-15">
        <div className="flex justify-between items-end mb-12 gap-10 flex-wrap">
          <h2 className="font-serif font-light text-[clamp(32px,4.5vw,56px)] leading-none tracking-tight max-w-[700px]">
            Tres formas de<br />habitar el{' '}
            <em className="text-terra not-italic" style={{fontStyle:'italic'}}>espacio</em>.
          </h2>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-soft pb-3">/ 01 — Espacios</div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {(spaces as Space[] | null)?.map((space) => (
            <SpaceCard key={space.id} space={space} />
          )) || (
            <p className="text-ink-soft col-span-full text-center py-10">
              No se pudieron cargar los espacios. Verifica la conexión a Supabase.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
