import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getInitials } from '@/lib/utils';
import type { Profile } from '@/types/database';
import NavBarClient from './NavBarClient';

export default async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <NavBarClient
      email={user?.email ?? null}
      profile={profile}
      displayName={profile?.full_name || user?.email || ''}
      initials={profile?.avatar_initials || getInitials(profile?.full_name || user?.email || '')}
    />
  );
}
