import * as SecureStore from "expo-secure-store";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "silas_field_token";

/**
 * SecureStore, not AsyncStorage: this token is a bearer credential, and
 * SecureStore backs onto the OS keychain (iOS Keychain / Android Keystore)
 * instead of a plain unencrypted file the way AsyncStorage does.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Keychain/Keystore unavailable — nothing more to do.
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Keychain/Keystore unavailable — nothing to clean up.
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
 * Turns an apiFetch failure into something a non-technical field worker can
 * read. apiFetch's own error message is deliberately technical (method,
 * path, status, raw body) -- good for logging, not for a screen. NestJS's
 * default error shape is { message, error, statusCode }; message is a
 * plain string for most thrown exceptions, or an array of strings when
 * class-validator rejects a DTO (one message per failed field) -- the
 * first is shown rather than concatenating all of them.
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
