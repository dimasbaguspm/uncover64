import { maskUrl } from "./mask";

const SESSION_KEY = "uncover64:session";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export interface SessionInfo {
  sessionId: string;
  referrer: string;
  utm: Record<string, string>;
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function loadSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    /* storage unavailable */
  }
  const id = randomId();
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* storage unavailable */
  }
  return id;
}

function parseUtm(): Record<string, string> {
  if (typeof location === "undefined") return {};
  const params = new URLSearchParams(location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 120);
  }
  return utm;
}

let info: SessionInfo | null = null;

/**
 * Per-tab-session identity plus acquisition context (referrer + UTM params),
 * captured once per page load. UUIDs in the referrer are masked.
 */
export function getSession(): SessionInfo {
  if (!info) {
    info = {
      sessionId: loadSessionId(),
      referrer: typeof document !== "undefined" ? maskUrl(document.referrer) : "",
      utm: parseUtm(),
    };
  }
  return info;
}
