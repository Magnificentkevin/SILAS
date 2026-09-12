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
