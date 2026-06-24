import { supabase } from './supabaseClient';

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error: error?.message ?? null };
}

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
  });

  return { error: error?.message ?? null };
}

export async function signOut() {
  await supabase.auth.signOut();
}
