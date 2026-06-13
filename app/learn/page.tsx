'use client';

// The Learn path — a Duolingo-style winding trail of units and lessons.
// Lessons unlock in order; completed lessons show their star score.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { UNITS, ALL_LESSONS, isLessonUnlocked } from '@/lib/learn/curriculum';
import { loadState, levelFromXp } from '@/lib/progress/store';

export default function LearnPage() {
  const { player, loading } = usePlayerSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [stars, setStars] = useState<Record<string, number>>({});
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!player) return;
    const s = loadState(player.id);
    const done = new Set(Object.keys(s.lessons).filter((id) => s.lessons[id].completed));
    setCompleted(done);
    setStars(Object.fromEntries(Object.entries(s.lessons).map(([id, r]) => [id, r.stars])));
    setXp(s.xp);
  }, [player]);

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;

  const level = levelFromXp(xp);
  // Find the first not-yet-completed unlocked lesson (the "current" node).
  const current = ALL_LESSONS.find((x) => !completed.has(x.lesson.id) && isLessonUnlocked(x.lesson.id, completed));

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Learn Chess</h1>
          <p className="opacity-70 font-semibold">
            {player.avatar} {player.name} · Level {level.level} · {completed.size}/{ALL_LESSONS.length} lessons
          </p>
        </div>
        {current && (
          <Link href={`/learn/${current.lesson.id}`} className="cq-btn-gold hidden sm:inline-flex">
            ▶ Continue
          </Link>
        )}
      </div>

      <div className="space-y-10">
        {UNITS.map((unit) => {
          const unitDone = unit.lessons.every((l) => completed.has(l.id));
          return (
            <section key={unit.id}>
              <div className="flex items-center gap-3 mb-4 sticky top-16 z-10 py-2" style={{ background: 'var(--cq-bg)' }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-pop"
                  style={{ background: unit.color, color: 'white' }}
                >
                  {unit.emoji}
                </div>
                <div>
                  <h2 className="font-black text-xl leading-tight">{unit.title}</h2>
                  <p className="text-sm opacity-60 font-semibold">{unit.blurb}</p>
                </div>
                {unitDone && <span className="ml-auto text-2xl" title="Unit complete">🏅</span>}
              </div>

              {/* Lesson trail */}
              <div className="flex flex-col items-center gap-3">
                {unit.lessons.map((lesson, i) => {
                  const unlocked = isLessonUnlocked(lesson.id, completed);
                  const isDone = completed.has(lesson.id);
                  const isCurrent = current?.lesson.id === lesson.id;
                  // zig-zag offset for the trail feel
                  const offset = ['translate-x-0', 'translate-x-16', 'translate-x-0', '-translate-x-16'][i % 4];
                  return (
                    <div key={lesson.id} className={`transition ${offset}`}>
                      <LessonNode
                        href={unlocked ? `/learn/${lesson.id}` : undefined}
                        emoji={lesson.emoji}
                        title={lesson.title}
                        color={unit.color}
                        locked={!unlocked}
                        done={isDone}
                        current={isCurrent}
                        stars={stars[lesson.id] ?? 0}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Shell>
  );
}

function LessonNode({
  href,
  emoji,
  title,
  color,
  locked,
  done,
  current,
  stars,
}: {
  href?: string;
  emoji: string;
  title: string;
  color: string;
  locked: boolean;
  done: boolean;
  current: boolean;
  stars: number;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-1 group">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-4 transition ${
          locked ? 'bg-line/40 grayscale opacity-60' : 'shadow-pop group-hover:-translate-y-1'
        } ${current ? 'animate-float ring-4 ring-gold ring-offset-2' : ''}`}
        style={{
          background: locked ? undefined : done ? color : 'white',
          borderColor: color,
        }}
      >
        {locked ? '🔒' : emoji}
      </div>
      <span className="text-xs font-extrabold text-center max-w-[6rem] leading-tight">{title}</span>
      {done && (
        <div className="text-xs leading-none" aria-label={`${stars} stars`}>
          {'⭐'.repeat(stars)}
          <span className="opacity-25">{'⭐'.repeat(3 - stars)}</span>
        </div>
      )}
    </div>
  );
  if (!href) return <div className="cursor-not-allowed">{inner}</div>;
  return <Link href={href}>{inner}</Link>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-20">{children}</main>
    </>
  );
}
