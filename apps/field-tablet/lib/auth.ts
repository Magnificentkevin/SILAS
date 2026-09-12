import * as SecureStore from "expo-secure-store";
import { apiFetch, setToken, clearToken } from "./api";

export interface FieldUser {
  id: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; globalRole: string | null };
}

const USER_KEY = "silas_field_user";

export async function fieldLogin(email: string, password: string): Promise<FieldUser> {
  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const user: FieldUser = { id: res.user.id, email: res.user.email };
  await setToken(res.accessToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function getStoredUser(): Promise<FieldUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as FieldUser) : null;
  } catch {
    return null;
  }
}

export async function signOut() {
  await clearToken();
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // Keychain/Keystore unavailable — nothing to clean up.
  }
}
