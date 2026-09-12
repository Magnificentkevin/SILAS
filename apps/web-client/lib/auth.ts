import { apiFetch, clearCsrfToken, setCsrfToken } from "./api";

export interface ClientUser {
  id: string;
  email: string;
  globalRole: "ADMIN" | "OPERATOR" | "VERIFIER" | null;
}

interface LoginResponse {
  user: ClientUser;
  csrfToken: string;
}

const USER_KEY = "silas_client_user";

export class NotStaffError extends Error {
  constructor() {
    super("This account isn't a staff account.");
    this.name = "NotStaffError";
  }
}

/**
 * NOTE: this dashboard shows cross-account CRM/pipeline data (every
 * account's health score, every opportunity) — that's inherently staff
 * data, not something safe to show a single customer/vendor login
 * regardless of what auth check runs. So despite this app living at the
 * public domain, its bounce rule matches staff-console's, not the
 * customer-scoped rule you'd expect: globalRole must be SET to sign in
 * here. A genuinely customer-scoped portal (their own account only) is
 * separate work this doesn't attempt.
 *
 * The auth token itself lives in an httpOnly cookie the server set on this
 * response — unreadable from here, so there's nothing left to store beyond
 * the cached user record used for local UI state.
 */
export async function clientLogin(email: string, password: string): Promise<ClientUser> {
  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCsrfToken(res.csrfToken);

  if (!res.user.globalRole) {
    await signOut();
    throw new NotStaffError();
  }

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  } catch {
    // Storage unavailable — session just won't survive a reload.
  }
  return res.user;
}

export function getStoredUser(): ClientUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ClientUser) : null;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Best-effort — cookies expire on their own even if this call fails.
  }
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clean up.
  }
  clearCsrfToken();
}
