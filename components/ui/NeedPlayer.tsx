'use client';

import Link from 'next/link';

// Shown when a feature needs an active player but none is selected.
export default function NeedPlayer() {
  return (
    <div className="cq-card p-8 text-center max-w-md mx-auto mt-10">
      <div className="text-5xl mb-3">🧑‍🚀</div>
      <h2 className="text-2xl font-black mb-2">Choose a player first</h2>
      <p className="opacity-75 font-semibold mb-5">
        Pick or create a player profile to start your chess quest and save your progress.
      </p>
      <Link href="/dashboard" className="cq-btn-brand">
        Go to players →
      </Link>
    </div>
  );
}
