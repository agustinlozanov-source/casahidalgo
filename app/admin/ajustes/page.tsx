// ============================================================
// app/admin/ajustes/page.tsx — Configuración
// ============================================================
import { createClient } from '@/lib/supabase/server';
import type { Space } from '@/types/database';
import SpaceEditor from '@/components/admin/SpaceEditor';
import BusinessSettingsForm from '@/components/admin/BusinessSettingsForm';

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

      <BusinessSettingsForm />
    </div>
  );
}
