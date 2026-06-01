---
title: ACL & permissions
description: Server-enforced; UI declutters.
---

The davepi backend is always the source of truth for access control. `davepi-ui` reads ACL declarations to **hide or disable** UI surface that the server would reject — so users see what they can do, not just what they're allowed to do.

## Sources

- `describe.acl.list` / `describe.acl.delete` — resource-level (backend).
- `describe.acl.fields[name].{read,create,update}` — field-level (backend).
- `config.resources[path].permissions.{list,read,create,update,delete}` — consumer config layer.

## Hooks

```ts
const list = useResourcePerm('account', 'list');
// { allowed: boolean, userRoles: string[], requiredRoles?: string[] }

const fieldAcl = useFieldAcl('account', 'description', 'update');
// same shape, scoped to one field
```

## Wiring

- `<Sidebar>` hides resources where `useResourcePerm(path, 'list')` returns false.
- `<ResourceTable>` hides "New" / "Delete" when the matching permission fails.
- `<ResourceForm>` strips fields where field `acl.read` fails; disables widgets where create/update fails (mode-aware).
