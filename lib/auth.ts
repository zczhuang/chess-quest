// Access control: this app is private. Only signed-in users whose email is in
// ALLOWED_EMAILS may use it. The wall is enforced server-side in middleware.ts
// (and mirrored in the landing page UI). Edge-safe: reads only process.env.

export function allowlist(): string[] {
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** A signed-in email is allowed when it's on the list. If the list is EMPTY,
 * the app falls back to "any signed-in account" (still walled, just not
 * restricted) — set ALLOWED_EMAILS to lock it to specific people. */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = allowlist();
  if (list.length === 0) return true;
  return list.includes(email.toLowerCase());
}

/** Paths anyone can reach (the sign-in gate + the OAuth callback). */
export function isPublicPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/auth');
}
