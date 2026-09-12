import { SetMetadata } from '@nestjs/common';
import type { Role } from '@repo/database';

export const ROLES_KEY = 'roles';

/** Declares which roles may call this route. Enforced by RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
