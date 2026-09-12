import type { Role } from '@repo/database';

/** What gets signed into the JWT. Membership is embedded so most requests need
 *  no extra DB round-trip — the tradeoff is a membership change (e.g. revoking
 *  a vendor from an account) only takes effect once that user logs in again. */
export interface JwtPayload {
  sub: string;
  email: string;
  globalRole: Role | null;
  memberships: { accountId: string; role: Role }[];
  /** Minted once at login/register, delivered to the client in that
   *  response body (never a second cookie -- see CsrfGuard) and echoed
   *  back as a header on mutating requests for the rest of the session. */
  csrfToken: string;
}
