import type { JWTPayload } from "./auth";

export type Permission =
  | "dataset:create"
  | "dataset:read"
  | "dataset:update"
  | "dataset:delete"
  | "dataset:compare"
  | "report:create"
  | "report:read"
  | "report:delete"
  | "search:save"
  | "notification:read"
  | "settings:read"
  | "settings:update"
  | "admin:users"
  | "admin:all";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  student: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  ml_engineer: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  data_scientist: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  researcher: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  analyst: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  educator: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
  ],
  admin: [
    "dataset:create",
    "dataset:read",
    "dataset:update",
    "dataset:delete",
    "dataset:compare",
    "report:create",
    "report:read",
    "report:delete",
    "search:save",
    "notification:read",
    "settings:read",
    "settings:update",
    "admin:users",
    "admin:all",
  ],
};

export function hasPermission(
  session: JWTPayload,
  permission: Permission
): boolean {
  const rolePerms = ROLE_PERMISSIONS[session.role] ?? ROLE_PERMISSIONS.student;
  return rolePerms.includes(permission);
}

export function requirePermission(
  session: JWTPayload | null,
  permission: Permission
): { allowed: boolean; error?: string } {
  if (!session) {
    return { allowed: false, error: "Not authenticated." };
  }
  if (!hasPermission(session, permission)) {
    return {
      allowed: false,
      error: `Insufficient permissions. Required: ${permission}`,
    };
  }
  return { allowed: true };
}

export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.student;
}
