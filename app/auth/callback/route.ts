import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google OAuth redirect lands here; exchange the code for a session, then continue.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const redirectUrl = new URL(next, origin);
  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // New account = user row created within the last 30s (a signup, not a returning login).
    const createdAt = data?.user?.created_at;
    if (createdAt && Date.now() - new Date(createdAt).getTime() < 30_000) {
      redirectUrl.searchParams.set('new', '1');
    }
  }
  return NextResponse.redirect(redirectUrl);
}
