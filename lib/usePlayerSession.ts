'use client';

// Resolves the active player (local or cloud) and applies their theme.
// kid mode → data-theme="kid" (playful purple board); classic → woody board.
// Returns null player while loading or when none chosen.

import { useEffect, useState } from 'react';
import {
  type Player,
  getActivePlayerId,
  getCloudPlayers,
  getLocalPlayers,
} from '@/lib/players';

export function usePlayerSession() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const id = getActivePlayerId();
      if (!id) {
        setLoading(false);
        return;
      }
      const local = getLocalPlayers().find((p) => p.id === id);
      if (local) {
        if (!cancelled) setPlayer(local);
      } else {
        const cloud = await getCloudPlayers();
        const found = cloud?.find((p) => p.id === id) ?? null;
        if (!cancelled) setPlayer(found);
      }
      if (!cancelled) setLoading(false);
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply theme whenever player changes.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const theme = player?.mode === 'classic' ? 'classic' : 'kid';
    document.documentElement.dataset.theme = theme;
  }, [player]);

  const pieceSet = 'classic'; // both modes use cburnett art (board colors differ)
  return { player, loading, pieceSet, isKid: player?.mode !== 'classic' };
}
