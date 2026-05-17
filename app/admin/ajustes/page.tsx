// ============================================================
// app/admin/ajustes/page.tsx — Configuración
// ============================================================
import { createClient } from '@/lib/supabase/server';
import type { Space } from '@/types/database';
import SpaceEditor from '@/components/admin/SpaceEditor';

export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*')
    .order('display_order');

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="bg-bone border rounded-2xl p-6">
        <h3 className="font-serif font-medium text-[17px] mb-1">Espacios disponibles</h3>
        <p className="text-[13px] text-ink-soft mb-6">
          Edita precios, capacidad y horarios. Los cambios se aplican de inmediato.
        </p>
        <div className="space-y-4">
          {(spaces as Space[] | null)?.map(space => (
            <SpaceEditor key={space.id} space={space} />
          ))}
        </div>
      </div>

      <div className="bg-bone border rounded-2xl p-6">
        <h3 className="font-serif font-medium text-[17px] mb-1">Datos del negocio</h3>
        <p className="text-[13px] text-ink-soft mb-6">
          Información que aparece en el sitio público y comprobantes.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nombre comercial" defaultValue="Casa Hidalgo" />
          <Field label="Email de contacto" defaultValue="hola@casahidalgo.mx" />
          <Field label="Dirección" defaultValue="Calle Hidalgo, Col. Centro, Querétaro" />
          <Field label="WhatsApp" defaultValue="442 285 5151" />
          <Field label="Horario apertura" defaultValue="10:00" />
          <Field label="Horario cierre" defaultValue="17:00" />
          <Field label="IVA aplicable (%)" defaultValue="16" />
          <Field label="Moneda" defaultValue="MXN — Peso mexicano" />
        </div>
        <div className="flex justify-end gap-2.5 mt-5">
          <button className="btn btn-ghost">Descartar</button>
          <button className="btn btn-primary" disabled>Guardar cambios</button>
        </div>
        <p className="text-[11.5px] text-ink-soft mt-3">
          Próximamente: persistir estos datos en una tabla <code>business_settings</code>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="form-label">{label}</label>
      <input defaultValue={defaultValue} className="form-input" />
    </div>
  );
}
