import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function getUserContext() {
  const { supabase, user } = await requireAuth();

  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', membership.organization_id)
    .single();

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .limit(1)
    .single();

  if (!brand) redirect('/onboarding');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return {
    supabase,
    user,
    membership,
    brand,
    orgName: org?.name ?? '',
    profile,
  };
}
