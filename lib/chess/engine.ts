'use client';

// UCI client for the Stockfish WASM build in /public/stockfish (single-threaded
// "lite" build — no SharedArrayBuffer / COOP-COEP headers needed). One shared
// worker instance; requests are serialized through a queue.

export interface EngineScore {
  cp?: number; // centipawns, from the side-to-move's perspective
  mate?: number; // moves until mate (negative = getting mated)
}

export interface EngineLine {
  multipv: number;
  move: string; // first move of the pv, UCI (e2e4)
  score: EngineScore;
  pv: string[];
}

export interface EngineGoOpts {
  fen: string;
  moveTimeMs?: number;
  depth?: number;
  skill?: number; // Skill Level 0-20
  elo?: number; // UCI_LimitStrength + UCI_Elo (Stockfish minimum is 1320)
  multiPv?: number;
}

export interface EngineResult {
  bestMove: string; // UCI, e.g. e2e4 / e7e8q
  lines: EngineLine[];
}

type Job = {
  opts: EngineGoOpts;
  resolve: (r: EngineResult) => void;
  reject: (e: Error) => void;
};

class StockfishEngine {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private queue: Job[] = [];
  private busy = false;

  private spawn(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        const w = new Worker('/stockfish/stockfish.js');
        this.worker = w;
        const onMsg = (e: MessageEvent) => {
          const line = String(e.data);
          if (line === 'uciok') {
            w.removeEventListener('message', onMsg);
            resolve();
          }
        };
        w.addEventListener('message', onMsg);
        w.addEventListener('error', (e) => reject(new Error(`Stockfish worker error: ${e.message}`)), { once: true });
        w.postMessage('uci');
      } catch (e) {
        reject(e as Error);
      }
    });
    return this.readyPromise;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  /** Analyse a position. Resolves with bestmove + scored lines (for hints/review). */
  go(opts: EngineGoOpts): Promise<EngineResult> {
    return new Promise<EngineResult>((resolve, reject) => {
      this.queue.push({ opts, resolve, reject });
      void this.pump();
    });
  }

  private async pump() {
    if (this.busy) return;
    const job = this.queue.shift();
    if (!job) return;
    this.busy = true;
    try {
      await this.spawn();
      const w = this.worker!;
      const { opts } = job;
      const lines = new Map<number, EngineLine>();

      const done = new Promise<EngineResult>((resolve, reject) => {
        const onMsg = (e: MessageEvent) => {
          const line = String(e.data);
          if (line.startsWith('info ') && line.includes(' pv ')) {
            const parsed = parseInfoLine(line);
            if (parsed) lines.set(parsed.multipv, parsed);
          } else if (line.startsWith('bestmove')) {
            w.removeEventListener('message', onMsg);
            const bestMove = line.split(/\s+/)[1] || '';
            resolve({ bestMove, lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv) });
          }
        };
        w.addEventListener('message', onMsg);
        setTimeout(() => {
          w.removeEventListener('message', onMsg);
          reject(new Error('Engine timed out'));
        }, Math.max(20_000, (opts.moveTimeMs ?? 0) + 15_000));
      });

      this.send('ucinewgame');
      this.send(`setoption name MultiPV value ${opts.multiPv ?? 1}`);
      this.send(`setoption name Skill Level value ${opts.skill ?? 20}`);
      if (opts.elo) {
        this.send('setoption name UCI_LimitStrength value true');
        this.send(`setoption name UCI_Elo value ${Math.max(1320, Math.min(3190, opts.elo))}`);
      } else {
        this.send('setoption name UCI_LimitStrength value false');
      }
      this.send(`position fen ${opts.fen}`);
      if (opts.depth) this.send(`go depth ${opts.depth}`);
      else this.send(`go movetime ${opts.moveTimeMs ?? 500}`);

      const result = await done;
      job.resolve(result);
    } catch (e) {
      job.reject(e as Error);
    } finally {
      this.busy = false;
      void this.pump();
    }
  }

  /** Eagerly spawn + compile the WASM so the first real move isn't laggy. */
  warmup() {
    void this.spawn();
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.queue = [];
    this.busy = false;
  }
}

function parseInfoLine(line: string): EngineLine | null {
  const tokens = line.split(/\s+/);
  let multipv = 1;
  const score: EngineScore = {};
  let pv: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'multipv') multipv = parseInt(tokens[i + 1], 10) || 1;
    if (tokens[i] === 'score') {
      if (tokens[i + 1] === 'cp') score.cp = parseInt(tokens[i + 2], 10);
      if (tokens[i + 1] === 'mate') score.mate = parseInt(tokens[i + 2], 10);
    }
    if (tokens[i] === 'pv') {
      pv = tokens.slice(i + 1);
      break;
    }
  }
  if (!pv.length) return null;
  return { multipv, move: pv[0], score, pv };
}

let _engine: StockfishEngine | null = null;
export function getEngine(): StockfishEngine {
  if (!_engine) _engine = new StockfishEngine();
  return _engine;
}
