import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isEmailAllowed, isPublicPath } from '@/lib/auth';

// Refreshes the Supabase auth session AND enforces the private-app wall:
// every route except the landing gate (/) and /auth/* requires a signed-in
// user whose email is allowed (lib/auth.ts → ALLOWED_EMAILS).
// No-ops gracefully until Supabase env vars are configured.
export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!isPublicPath(path) && !isEmailAllowed(user?.email)) {
    // API routes get a clean 401; pages bounce to the sign-in gate.
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|stockfish|pieces|sounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm|mp3)$).*)'],
};
