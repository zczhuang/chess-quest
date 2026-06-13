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
  const pillars = [
    { href: '/learn', emoji: '📚', title: 'Learn', from: '#7c5cff', to: '#a78bf0', body: 'A Duolingo-style path of 3-minute lessons. Earn stars, keep your streak, and watch Rookie the Rook cheer you on.' },
    { href: '/puzzles', emoji: '🧩', title: 'Puzzles', from: '#2fb877', to: '#56b6ff', body: 'Thousands of real-game puzzles that adapt to your level — plus Puzzle Rush against the clock.' },
    { href: '/play', emoji: '⚔️', title: 'Play', from: '#ff9f43', to: '#ff6b5e', body: 'Eight personality bots from Pip the Pawn to Maximus the final boss. Hints, takebacks & an AI coach.' },
  ];
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4">
        <section className="relative py-16 sm:py-24 text-center overflow-hidden">
          {/* floating chess pieces */}
          <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
            <span className="absolute left-[8%] top-[18%] text-4xl sm:text-5xl opacity-30 animate-float" style={{ animationDelay: '0s' }}>♞</span>
            <span className="absolute right-[10%] top-[12%] text-5xl sm:text-6xl opacity-25 animate-float" style={{ animationDelay: '0.6s' }}>♛</span>
            <span className="absolute left-[14%] bottom-[12%] text-4xl sm:text-5xl opacity-25 animate-float" style={{ animationDelay: '1.1s' }}>♟</span>
            <span className="absolute right-[14%] bottom-[16%] text-4xl sm:text-5xl opacity-30 animate-float" style={{ animationDelay: '1.6s' }}>♝</span>
          </div>

          <div className="relative">
            <span className="cq-chip cq-rise mb-5 text-brand">✨ Free · for kids &amp; grown-ups</span>
            <div className="text-7xl sm:text-8xl mb-2 animate-float cq-glow-pulse inline-block" aria-hidden>
              🏰
            </div>
            <h1 className="cq-rise cq-rise-1 text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
              Learn chess the<br className="hidden sm:block" /> <span className="cq-gradient-text">fun</span> way
            </h1>
            <p className="cq-rise cq-rise-2 mt-5 text-lg sm:text-xl max-w-2xl mx-auto text-[color:var(--cq-muted)] font-semibold">
              Bite-size lessons, thousands of puzzles, and friendly robot opponents — from
              &ldquo;how does the horsey move?&rdquo; to checkmating a grandmaster.
            </p>
            <div className="cq-rise cq-rise-3 mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/learn" className="cq-btn-gold text-lg">
                🚀 Start learning
              </Link>
              <Link href="/play" className="cq-btn-ghost text-lg">
                ⚔️ Play vs a bot
              </Link>
              <AuthButton />
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-5 pb-20">
          {pillars.map((p, i) => (
            <Link key={p.href} href={p.href} className={`cq-card cq-card-interactive cq-rise cq-rise-${i + 1} p-6 block group`}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-pop transition-transform group-hover:scale-110 group-hover:-rotate-6"
                style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
              >
                {p.emoji}
              </div>
              <h2 className="font-black text-xl mb-1">{p.title}</h2>
              <p className="text-[color:var(--cq-muted)] font-semibold text-sm">{p.body}</p>
              <span className="mt-3 inline-block font-extrabold text-brand opacity-0 group-hover:opacity-100 transition">
                Open →
              </span>
            </Link>
          ))}
        </section>
      </main>
      <footer className="border-t border-white/40 py-8 text-center text-sm text-[color:var(--cq-muted)] font-semibold">
        Chess Quest · made with ♥ for young champions and their grown-ups · piece art{' '}
        <a href="https://github.com/lichess-org/lila" className="underline">
          cburnett (CC BY-SA)
        </a>
      </footer>
    </>
  );
}
