import { apiFetch, clearCsrfToken, setCsrfToken } from "./api";

export interface StaffUser {
  id: string;
  email: string;
  globalRole: "ADMIN" | "OPERATOR" | "VERIFIER" | null;
}

interface LoginResponse {
  user: StaffUser;
  csrfToken: string;
}

const USER_KEY = "silas_staff_user";

export class NotStaffError extends Error {
  constructor() {
    super("This account isn't a staff account. Sign in at the client portal instead.");
    this.name = "NotStaffError";
  }
}

/**
 * The bounce rule this console exists to enforce: the credential can be
 * perfectly valid and still not belong on this surface. A customer/vendor/
 * host-client login has globalRole === null — that's rejected here even
 * though /auth/login itself succeeded, and nothing is stored client-side.
 *
 * The auth token lives in an httpOnly cookie the server set on this
 * response — unreadable from here, so there's nothing left to store beyond
 * the cached user record used for local UI state.
 */
export async function staffLogin(email: string, password: string): Promise<StaffUser> {
  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCsrfToken(res.csrfToken);

  if (!res.user.globalRole) {
    await signOut();
    throw new NotStaffError();
  }

  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  return res.user;
}

export function getStoredUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StaffUser) : null;
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
    // Storage unavailable (private browsing, etc.) — nothing to clean up.
  }
  clearCsrfToken();
}
