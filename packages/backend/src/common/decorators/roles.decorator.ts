import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@mawell/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);