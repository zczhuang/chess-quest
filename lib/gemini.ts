import 'server-only';
import { GoogleAuth } from 'google-auth-library';

// Vertex AI Gemini text client. Auth: Workload Identity Federation on Vercel
// (Vercel OIDC → STS → service-account impersonation), with inline-JSON /
// ambient-ADC fallback for local dev. No API key needed.
// (Same pattern as mandarin-quest's lib/gemini.ts.)

const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';
// Chat Gemini models are served from the GLOBAL endpoint.
const LOCATION = process.env.GEMINI_CHAT_LOCATION || 'global';

export const hasGemini = () => Boolean(PROJECT);

function useWif(): boolean {
  return Boolean(process.env.GCP_WIF_PROVIDER && (process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN));
}

let _client: any = null;
async function buildClient(): Promise<any> {
  if (useWif()) {
    const { ExternalAccountClient } = await import('google-auth-library');
    const { getVercelOidcToken } = await import('@vercel/functions/oidc');
    const audience = `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.GCP_WIF_POOL}/providers/${process.env.GCP_WIF_PROVIDER}`;
    return ExternalAccountClient.fromJSON(
      {
        type: 'external_account',
        audience,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        token_url: 'https://sts.googleapis.com/v1/token',
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SA_EMAIL}:generateAccessToken`,
        subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
      },
      { scopes: [SCOPE] } as any
    );
  }
  const opts: any = { scopes: SCOPE };
  const inline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      opts.credentials = JSON.parse(inline);
    } catch {
      /* ignore malformed inline creds */
    }
  }
  return new GoogleAuth(opts);
}

async function getAccessToken(): Promise<string | null | undefined> {
  if (!_client) _client = await buildClient();
  const t = await _client.getAccessToken();
  return typeof t === 'string' ? t : t?.token;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiCallOpts {
  model?: string;
  systemInstruction: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  /** Gemini 2.5 models "think" by default, which can eat the whole output budget
   * on short tasks. 0 disables it (the default here — our prompts are simple). */
  thinkingBudget?: number;
}

const DEFAULT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite';

// Call Vertex AI Gemini generateContent and return the text reply.
export async function callGemini(opts: GeminiCallOpts): Promise<string> {
  if (!PROJECT) throw new Error('GOOGLE_CLOUD_PROJECT is not set');
  const token = await getAccessToken();
  if (!token) throw new Error('Could not obtain a Vertex access token');

  const model = opts.model || DEFAULT_MODEL;
  const host = LOCATION === 'global' ? 'aiplatform.googleapis.com' : `${LOCATION}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;

  const body = {
    systemInstruction: { role: 'system', parts: [{ text: opts.systemInstruction }] },
    contents: opts.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: opts.temperature ?? 0.5,
      maxOutputTokens: opts.maxOutputTokens ?? 600,
      thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 0 },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 400)}`);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ?? '').trim();
}
