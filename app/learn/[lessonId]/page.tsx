'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import LessonPlayer from '@/components/chess/LessonPlayer';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { useProgress } from '@/lib/progress/useProgress';
import { findLesson, ALL_LESSONS } from '@/lib/learn/curriculum';
import Link from 'next/link';

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const { lessonId } = params;
  const router = useRouter();
  const { player, loading, pieceSet } = usePlayerSession();
  const { completeLesson } = useProgress(player?.id ?? null);
  const [result, setResult] = useState<{ stars: number; xp: number } | null>(null);

  const found = findLesson(lessonId);

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;
  if (!found) return <Shell><div className="text-center py-20 font-bold">Lesson not found. <Link className="text-brand underline" href="/learn">Back to path</Link></div></Shell>;

  const { lesson } = found;
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lessonId);
  const nextLesson = ALL_LESSONS[idx + 1]?.lesson;

  if (result) {
    return (
      <Shell>
        <div className="cq-card p-8 text-center max-w-md mx-auto mt-6 animate-bounce-in">
          <div className="text-6xl mb-2">🎉</div>
          <h1 className="text-3xl font-black mb-1">Lesson complete!</h1>
          <p className="opacity-70 font-semibold mb-4">{lesson.title}</p>
          <div className="text-5xl mb-2 tracking-widest">
            {'⭐'.repeat(result.stars)}
            <span className="opacity-20">{'⭐'.repeat(3 - result.stars)}</span>
          </div>
          <p className="font-extrabold text-gold-dark text-xl mb-6">+{result.xp} XP</p>
          <div className="flex flex-col gap-2">
            {nextLesson ? (
              <button
                className="cq-btn-brand"
                onClick={() => {
                  setResult(null);
                  router.push(`/learn/${nextLesson.id}`);
                }}
              >
                Next lesson: {nextLesson.title} →
              </button>
            ) : (
              <p className="font-bold text-mint">🏆 You finished the whole path! Legendary.</p>
            )}
            <Link href="/learn" className="cq-btn-ghost">
              Back to path
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <LessonPlayer
        lesson={lesson}
        pieceSet={pieceSet}
        onExit={() => router.push('/learn')}
        onComplete={(stars, xp) => {
          completeLesson(lesson.id, stars);
          setResult({ stars, xp });
        }}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
