import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/** Declares that a route is exempt from CsrfGuard -- for pre-session
 *  endpoints (login/register) that can't carry a session-bound CSRF token
 *  because no session exists yet. */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
