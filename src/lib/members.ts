import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface Member {
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  group_slug: string | null;
  created_at: string;
  last_login_at: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getMember(email: string): Promise<Member | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  if (error) {
    console.error('[members.getMember]', error.message);
    return null;
  }
  return (data as Member | null) ?? null;
}

export async function listMembers(): Promise<Member[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[members.listMembers]', error.message);
    return [];
  }
  return (data as Member[]) ?? [];
}

export async function upsertMember(input: {
  email: string;
  name?: string | null;
  role: 'admin' | 'member';
  group_slug: string | null;
}): Promise<Member | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('members')
    .upsert(
      {
        email: normalizeEmail(input.email),
        name: input.name ?? null,
        role: input.role,
        group_slug: input.group_slug,
        last_login_at: now,
      },
      { onConflict: 'email' },
    )
    .select()
    .single();
  if (error) {
    console.error('[members.upsertMember]', error.message);
    return null;
  }
  return data as Member;
}

export async function touchLastLogin(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('members')
    .update({ last_login_at: new Date().toISOString() })
    .eq('email', normalizeEmail(email));
  if (error) console.error('[members.touchLastLogin]', error.message);
}

export async function removeMember(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('email', normalizeEmail(email));
  if (error) {
    console.error('[members.removeMember]', error.message);
    return false;
  }
  return true;
}
