import Link from 'next/link';
import Nav from '@/components/ui/Nav';
import AuthButton from '@/components/ui/AuthButton';
import { getUser, hasSupabase } from '@/lib/supabase/server';
import { isEmailAllowed } from '@/lib/auth';

// Landing page doubles as the sign-in gate. This app is PRIVATE — only an
// allowed, signed-in account may use it. Logged out → sign-in CTA only.
// Signed in but not allowed → friendly "private" notice. Allowed → full landing.
export default async function Home() {
  const user = hasSupabase() ? await getUser() : null;
  const signedIn = !!user;
  const allowed = isEmailAllowed(user?.email);

  // Logged out, or Supabase configured but not allowed → show the gate.
  if (hasSupabase() && !allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="cq-card p-10 max-w-md w-full text-center">
          <div className="text-7xl animate-float mb-4" aria-hidden>
            🏰
          </div>
          <h1 className="text-3xl font-black mb-2">Chess Quest</h1>
          {!signedIn ? (
            <>
              <p className="opacity-75 font-semibold mb-6">
                This is a private chess app. Sign in with Google to play.
              </p>
              <div className="flex justify-center">
                <AuthButton />
              </div>
            </>
          ) : (
            <>
              <p className="opacity-80 font-semibold mb-2">
                Sorry — this app is private and your account doesn&apos;t have access.
              </p>
              <p className="text-sm opacity-60 font-semibold mb-6">
                Signed in as {user?.email}.
              </p>
              <div className="flex justify-center">
                <AuthButton />
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // Allowed (or Supabase not configured → local-only dev) → full landing.
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4">
        <section className="py-14 sm:py-20 text-center">
          <div className="text-7xl sm:text-8xl animate-float mb-4" aria-hidden>
            🏰
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            Learn chess the <span className="text-brand">fun</span> way
          </h1>
          <p className="mt-4 text-lg sm:text-xl max-w-2xl mx-auto opacity-80 font-semibold">
            Bite-size lessons, thousands of puzzles, and friendly robot opponents — from
            &ldquo;how does the horsey move?&rdquo; to checkmating a grandmaster.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/learn" className="cq-btn-gold text-lg">
              🚀 Start learning
            </Link>
            <Link href="/play" className="cq-btn-ghost text-lg">
              ⚔️ Play vs a bot
            </Link>
            <AuthButton />
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-4 pb-16">
          <Link href="/learn" className="cq-card p-6 hover:-translate-y-1 transition block">
            <div className="text-4xl mb-3">📚</div>
            <h2 className="font-black text-xl mb-1">Learn</h2>
            <p className="opacity-75 font-semibold text-sm">
              A Duolingo-style path of 3-minute lessons. Earn stars, keep your streak, and watch
              Rookie the Rook cheer you on.
            </p>
          </Link>
          <Link href="/puzzles" className="cq-card p-6 hover:-translate-y-1 transition block">
            <div className="text-4xl mb-3">🧩</div>
            <h2 className="font-black text-xl mb-1">Puzzles</h2>
            <p className="opacity-75 font-semibold text-sm">
              Thousands of real-game puzzles that adapt to your level — plus Puzzle Rush against
              the clock.
            </p>
          </Link>
          <Link href="/play" className="cq-card p-6 hover:-translate-y-1 transition block">
            <div className="text-4xl mb-3">⚔️</div>
            <h2 className="font-black text-xl mb-1">Play</h2>
            <p className="opacity-75 font-semibold text-sm">
              Eight personality bots from Pip the Pawn (just learned the rules!) to Maximus the
              final boss. Hints and takebacks included.
            </p>
          </Link>
        </section>
      </main>
      <footer className="border-t-2 border-line py-8 text-center text-sm opacity-60 font-semibold">
        Chess Quest · made with ♥ for young champions and their grown-ups · piece art{' '}
        <a href="https://github.com/lichess-org/lila" className="underline">
          cburnett (CC BY-SA)
        </a>
      </footer>
    </>
  );
}
