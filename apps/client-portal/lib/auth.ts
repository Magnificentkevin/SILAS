import { apiFetch, clearCsrfToken, setCsrfToken } from "./api";

export type MembershipRole = "VENDOR" | "CUSTOMER" | "HOST_CLIENT";

export interface Membership {
  accountId: string;
  role: MembershipRole;
}

export interface ClientUser {
  email: string;
  memberships: Membership[];
}

interface LoginResponse {
  user: { id: string; email: string; globalRole: string | null };
  csrfToken: string;
}

interface MeResponse {
  sub: string;
  email: string;
  globalRole: string | null;
  memberships: Membership[];
}

const USER_KEY = "silas_client_user";

export class NotAClientError extends Error {
  constructor() {
    super(
      "This account has no vendor, customer, or host-client access. Staff should sign in at the staff console instead.",
    );
    this.name = "NotAClientError";
  }
}

/**
 * The bounce rule this portal exists to enforce, mirrored from
 * staff-console's opposite check: a credential can be perfectly valid and
 * still not belong on this surface. A staff-only login has zero
 * memberships — that's rejected here even though /auth/login itself
 * succeeded, and nothing is stored client-side.
 *
 * The auth token itself now lives in an httpOnly cookie the server set on
 * this response — unreadable (and unstealable via XSS) from here, so
 * memberships are fetched via /auth/me instead of decoded from the JWT.
 */
export async function clientLogin(email: string, password: string): Promise<ClientUser> {
  const loginResult = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCsrfToken(loginResult.csrfToken);

  const me = await apiFetch<MeResponse>("/auth/me");
  if (me.memberships.length === 0) {
    await signOut();
    throw new NotAClientError();
  }

  const user: ClientUser = { email: me.email, memberships: me.memberships };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
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
    // Storage unavailable — nothing to clean up.
  }
  clearCsrfToken();
}
