// ============================================================
// app/admin/layout.tsx — Layout exclusivo del admin
// Server Component: verifica rol y prepara datos del sidebar
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import type { Profile } from '@/types/database';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-paper">
      <AdminSidebar profile={profile as Profile} email={user.email!} />
      <div className="flex flex-col min-h-screen">
        <AdminTopbar />
        <main className="flex-1 px-8 py-8 max-md:px-5 max-md:py-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
