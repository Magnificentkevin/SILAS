export const AUTH_COOKIE_NAME = 'silas_at';

/** Kept in sync with AuthModule's JwtModule signOptions.expiresIn default —
 *  the cookie should expire no later than the token it carries. */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;
