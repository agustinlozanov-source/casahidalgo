// ============================================================
// app/page.tsx — Landing público
// Server Component que carga los espacios desde Supabase
// ============================================================
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/layout/NavBar';
import SpaceCard from '@/components/booking/SpaceCard';
import type { Space, BusinessSettings } from '@/types/database';

export const revalidate = 60; // Revalidar cada 60s

export default async function HomePage() {
  const supabase = await createClient();
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const spaceList = (spaces as Space[] | null) ?? [];
  const minOpen  = spaceList.length ? Math.min(...spaceList.map(s => s.open_hour))  : 9;
  const maxClose = spaceList.length ? Math.max(...spaceList.map(s => s.close_hour)) : 18;
  const scheduleLabel = `${minOpen}–${maxClose}h`;
  const minPrice = spaceList.length ? Math.min(...spaceList.map(s => s.base_price)) : 250;

  const { data: bizData } = await supabase.from('business_settings').select('*').eq('id', 1).single();
  const biz = bizData as BusinessSettings | null;

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
              <div className="font-serif text-3xl leading-none">{scheduleLabel}</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mt-1">Lun a Vie</div>
            </div>
            <div>
              <div className="font-serif text-3xl leading-none">
                ${minPrice}<span className="text-[13px] text-ink-soft font-sans"> mxn</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-ink-soft mt-1">Desde</div>
            </div>
          </div>
        </div>
        <div className="relative rounded-[28px] overflow-hidden aspect-[3/4] w-full max-md:max-h-[420px]">
          <Image
            src="/images/poster-estudio.jpeg"
            alt="Estudio de contenido — Casa Hidalgo"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="max-w-[1280px] mx-auto px-9 py-10 max-md:px-5">
        <div className="flex justify-between items-end mb-8 gap-6">
          <h2 className="font-serif font-light text-[clamp(26px,3.5vw,42px)] leading-none tracking-tight">
            El <em className="text-terra not-italic" style={{fontStyle:'italic'}}>lugar</em>.
          </h2>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-soft pb-1">/ 00 — Instalaciones</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[240px]">
          {/* Sala de juntas — poster grande */}
          <div className="relative rounded-2xl overflow-hidden col-span-2 row-span-2">
            <Image src="/images/poster-sala-1.jpeg" alt="Sala de juntas" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            <span className="absolute bottom-4 left-5 text-paper font-serif text-lg">Sala de juntas</span>
          </div>
          {/* Cowork */}
          <div className="relative rounded-2xl overflow-hidden">
            <Image src="/images/cowork-1.jpeg" alt="Cowork" fill className="object-cover" sizes="25vw" />
          </div>
          {/* Estudio */}
          <div className="relative rounded-2xl overflow-hidden">
            <Image src="/images/estudio-1.jpeg" alt="Estudio de contenido" fill className="object-cover" sizes="25vw" />
          </div>
          {/* Cowork 2 */}
          <div className="relative rounded-2xl overflow-hidden">
            <Image src="/images/cowork-2.jpeg" alt="Cowork área de trabajo" fill className="object-cover" sizes="25vw" />
          </div>
          {/* Gear */}
          <div className="relative rounded-2xl overflow-hidden">
            <Image src="/images/estudio-gear-1.jpeg" alt="Equipo estudio" fill className="object-cover" sizes="25vw" />
          </div>
          {/* Sala 2 — ancho completo en mobile */}
          <div className="relative rounded-2xl overflow-hidden col-span-2 md:col-span-1">
            <Image src="/images/sala-2.jpeg" alt="Sala de juntas detalle" fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
          </div>
          {/* Estudio 2 */}
          <div className="relative rounded-2xl overflow-hidden col-span-2 md:col-span-1">
            <Image src="/images/estudio-2.jpeg" alt="Estudio detalle" fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
          </div>
        </div>
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

      {/* UBICACIÓN */}
      <section id="ubicacion" className="max-w-[1280px] mx-auto px-9 pb-24 max-md:px-5 max-md:pb-16">
        <div className="flex justify-between items-end mb-8 gap-6">
          <div>
            <h2 className="font-serif font-light text-[clamp(26px,3.5vw,42px)] leading-none tracking-tight">
              Cómo <em className="text-terra not-italic" style={{fontStyle:'italic'}}>llegar</em>.
            </h2>
            <p className="text-ink-soft text-sm mt-2">Hidalgo 47B · Centro Histórico · Querétaro</p>
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-soft pb-1">/ 02 — Ubicación</div>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-6 items-stretch">
          {/* Mapa embed */}
          <div className="relative rounded-2xl overflow-hidden h-[420px] md:h-auto border">
            <iframe
              src={biz?.maps_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3732.587!2d-100.39194!3d20.58885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d35b48e7d30001%3A0x1!2sHidalgo+47B%2C+Centro%2C+76000+Santiago+de+Quer%C3%A9taro%2C+Qro.!5e0!3m2!1ses-419!2smx!4v1"}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '420px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Casa Hidalgo"
            />
          </div>

          {/* Info lateral */}
          <div className="bg-bone border rounded-2xl p-8 flex flex-col justify-between gap-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-4">Dirección</div>
              <p className="font-serif text-[22px] leading-snug">
                {biz?.address || 'Hidalgo 47B, Centro Histórico, 76000 Querétaro, Qro.'}
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-3">Horarios</div>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">{biz ? biz.open_time + '–' + biz.close_time : scheduleLabel}</span>
                  <span className="font-medium">
                    {biz && biz.open_days.length > 0
                      ? ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
                          .filter((_, i) => biz.open_days.includes(['mon','tue','wed','thu','fri','sat','sun'][i]))
                          .join(', ')
                      : 'Lun – Vie'}
                  </span>
                </div>
              </div>
            </div>
            <a
              href="https://maps.app.goo.gl/BVqsZDCZH82w21sU7"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-full flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
