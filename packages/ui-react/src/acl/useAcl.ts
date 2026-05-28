import { useMemo } from 'react';
import type { DescribeField, DescribeSchemaEntry } from '@davepi/ui-core';
import { useAuth } from '../auth/AuthProvider.js';
import { useDescribe } from '../hooks/useDescribe.js';
import { useResourceConfig } from '../config/ConfigProvider.js';

/**
 * Hooks for ACL gating in the UI.
 *
 * The server is the source of truth for access; these hooks just declutter
 * the UI so users don't see actions they can't perform. Two layers compose:
 *
 *   1. Backend ACL exposed via `/_describe` — schema-level `list`/`delete`
 *      and field-level `read`/`create`/`update`.
 *   2. App-side `permissions` block in the consumer's resource config,
 *      checked client-only (handy for hiding features that the backend
 *      doesn't yet have ACL on).
 *
 * The user's roles come from the JWT (decoded by `<AuthProvider>`). When
 * either source is missing or empty, access is open (matches the
 * backend's behaviour when a schema declares no ACL).
 */

export type AclOp = 'list' | 'create' | 'read' | 'update' | 'delete';

export interface AclResult {
  allowed: boolean;
  /** Set of roles the JWT carries. */
  userRoles: ReadonlySet<string>;
  /** Set of roles the backend says are required. Empty means no gate. */
  requiredRoles: ReadonlySet<string>;
}

function rolesOf(user: ReturnType<typeof useAuth>['user']): ReadonlySet<string> {
  return new Set(user?.roles ?? []);
}

function gated(
  required: readonly string[] | undefined,
  userRoles: ReadonlySet<string>
): AclResult {
  if (!required || required.length === 0) {
    return { allowed: true, userRoles, requiredRoles: new Set() };
  }
  const requiredRoles = new Set(required);
  return {
    allowed: required.some((r) => userRoles.has(r)),
    userRoles,
    requiredRoles,
  };
}

function resourceLevel(entry: DescribeSchemaEntry | undefined, op: 'list' | 'delete'): string[] | undefined {
  return entry?.acl?.[op];
}

function fieldLevel(
  field: DescribeField | undefined,
  op: 'read' | 'create' | 'update'
): string[] | undefined {
  return field?.acl?.[op];
}

/**
 * Can the current user perform a resource-level operation?
 * `read`/`create`/`update`/`delete` map to describe's schema-level slots
 * where applicable; `list` follows the backend's `acl.list` slot. Custom
 * `permissions.{op}` from the consumer config layers on top — denial in
 * either layer denies overall.
 */
export function useResourcePerm(path: string, op: AclOp): AclResult {
  const { user } = useAuth();
  const { data: describe } = useDescribe();
  const config = useResourceConfig(path);

  return useMemo(() => {
    const userRoles = rolesOf(user);
    const entry = describe?.registry.get(path);
    const backend =
      op === 'list' ? resourceLevel(entry, 'list') :
      op === 'delete' ? resourceLevel(entry, 'delete') :
      undefined;
    const consumer = config.permissions?.[op as keyof NonNullable<typeof config.permissions>];

    const backendCheck = gated(backend, userRoles);
    const consumerCheck = gated(consumer, userRoles);
    return {
      allowed: backendCheck.allowed && consumerCheck.allowed,
      userRoles,
      requiredRoles: new Set([
        ...(backendCheck.requiredRoles ?? []),
        ...(consumerCheck.requiredRoles ?? []),
      ]),
    };
  }, [config.permissions, describe, op, path, user]);
}

/**
 * Can the current user read/create/update a specific field?
 * Returns `{ allowed: false }` to drive `hidden` on a form widget, or
 * `disabled` on a column. The server still enforces — this is purely
 * for UX.
 */
export function useFieldAcl(
  path: string,
  fieldName: string,
  op: 'read' | 'create' | 'update'
): AclResult {
  const { user } = useAuth();
  const { data: describe } = useDescribe();

  return useMemo(() => {
    const userRoles = rolesOf(user);
    const field = describe?.registry.get(path)?.fields.find((f) => f.name === fieldName);
    const required = fieldLevel(field, op);
    return gated(required, userRoles);
  }, [describe, fieldName, op, path, user]);
}
