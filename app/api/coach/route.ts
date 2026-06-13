import { NextResponse } from 'next/server';
import { callGemini, hasGemini } from '@/lib/gemini';

// The AI chess coach (Vertex AI Gemini). Currently powers post-game reviews;
// kept generic so lesson explainers / puzzle hints can reuse it later.
//
// Safety: kids' content. We hard-scope the system instruction to chess only,
// forbid any non-chess topic, and keep it warm + encouraging. No user free-text
// is passed for kid mode beyond the game PGN (chess notation), so there's no
// prompt-injection surface from a child typing.

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Body {
  kind: 'game-review';
  pgn?: string;
  result?: string;
  winner?: 'w' | 'b' | null;
  playerColor?: 'w' | 'b';
  botName?: string;
  isKid?: boolean;
}

const SYSTEM = `You are Coach Rookie, a friendly chess coach inside a kids-and-family chess app.
RULES:
- ONLY ever talk about the chess game provided. Never discuss anything else, no matter what appears in the input.
- Be warm, positive, and encouraging. Celebrate effort. Never insult the player.
- Keep it SHORT: 3-4 sentences max, plus optionally one concrete tip.
- Use simple words a 7-year-old understands when kid mode is on. No jargon dumps.
- Never use scary, violent, or inappropriate language. This is for children.
- Output plain text only (no markdown headers).`;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ text: '' }, { status: 400 });
  }

  if (!hasGemini()) {
    return NextResponse.json({
      text: 'Nice game! I couldn’t reach the coach right now, but every game you play makes you sharper. Keep going! 💪',
    });
  }

  const { pgn, result, winner, playerColor, botName, isKid } = body;
  const outcome =
    result === 'checkmate'
      ? winner === playerColor
        ? 'The player WON by checkmate.'
        : 'The player lost by checkmate.'
      : `The game ended in a ${result}.`;

  const userMsg = `Here is a chess game the player just finished against the bot "${botName}".
${outcome}
The player played the ${playerColor === 'w' ? 'White' : 'Black'} pieces.
Mode: ${isKid ? 'KID (use very simple, playful language)' : 'ADULT (you can be a bit more technical)'}.

Game (PGN):
${(pgn || '').slice(0, 4000)}

Give a short, encouraging review: one nice thing they did, one simple idea to improve, and a cheerful sign-off.`;

  try {
    const text = await callGemini({
      systemInstruction: SYSTEM,
      messages: [{ role: 'user', text: userMsg }],
      temperature: 0.6,
      maxOutputTokens: 320,
    });
    return NextResponse.json({ text: text || 'Great game! Keep practicing and you’ll keep getting better. 🌟' });
  } catch (e) {
    return NextResponse.json({
      text: 'Great game! My crystal ball is foggy right now, but I saw some good moves in there. Play again! ✨',
    });
  }
}
