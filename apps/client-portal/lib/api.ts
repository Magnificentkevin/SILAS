export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_TOKEN_KEY = "silas_csrf_token";

/**
 * The CSRF token is minted once per login/register and embedded in the
 * session JWT itself (see apps/api's CsrfGuard) — delivered here in that
 * response's JSON body, never a second cookie, since a cookie set on the
 * API's own domain is unreadable by this app's JS once they're on different
 * origins (client-portal on Vercel, API on Cloud Run). It doesn't rotate
 * per-request, so caching it across a reload is safe for as long as the
 * httpOnly session cookie itself remains valid.
 */
export function setCsrfToken(token: string): void {
  try {
    localStorage.setItem(CSRF_TOKEN_KEY, token);
  } catch {
    // Storage unavailable — mutating requests will fail CSRF until next login, not silently insecure.
  }
}

export function clearCsrfToken(): void {
  try {
    localStorage.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Nothing to clean up.
  }
}

function readCsrfToken(): string | null {
  try {
    return localStorage.getItem(CSRF_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const csrfToken = MUTATING_METHODS.has(method) ? readCsrfToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Turns an apiFetch failure into something a non-technical user can read.
 * apiFetch's own error message is deliberately technical (method, path,
 * status, raw body) — good for a console.error, not for a form's error
 * text. NestJS's default error shape is { message, error, statusCode };
 * message is a plain string for most thrown exceptions, or an array of
 * strings when class-validator rejects a DTO (one message per failed
 * field) -- the first is shown rather than concatenating all of them.
 */
export function describeError(err: unknown): string {
  const fallback = "Something went wrong — please try again.";
  if (!(err instanceof Error)) return fallback;

  const match = err.message.match(/^API .+ failed \(\d+\): ([\s\S]*)$/);
  if (!match) return fallback;

  try {
    const parsed = JSON.parse(match[1]) as { message?: string | string[] };
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    if (Array.isArray(parsed.message) && parsed.message.length > 0) return parsed.message[0];
  } catch {
    // Body wasn't JSON (e.g. a proxy error page) — fall through.
  }
  return fallback;
}
