import Link from 'next/link';
import Nav from '@/components/ui/Nav';
import AuthButton from '@/components/ui/AuthButton';

// Landing page — kid-bright, parent-clear.
export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4">
        {/* Hero */}
        <section className="py-14 sm:py-20 text-center">
          <div className="text-7xl sm:text-8xl animate-float mb-4" aria-hidden>
            🏰
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            Learn chess the <span className="text-brand">fun</span> way
          </h1>
          <p className="mt-4 text-lg sm:text-xl max-w-2xl mx-auto opacity-80 font-semibold">
            Bite-size lessons, thousands of puzzles, and friendly robot opponents — from
            &ldquo;how does the horsey move?&rdquo; to checkmating a grandmaster. Free, for kids and grown-ups.
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
          <p className="mt-3 text-sm opacity-60 font-semibold">
            No account needed to play — sign in to save progress across devices.
          </p>
        </section>

        {/* Three pillars */}
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
