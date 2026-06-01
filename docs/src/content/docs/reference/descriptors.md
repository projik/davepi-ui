---
title: Descriptor JSON schema
description: Page / Table / Form / Field / Action spec for agent-composed pages.
---

All public descriptors live in `@davepi/ui-core/descriptor` and are zod schemas.

## `PageSpec`

```ts
{
  kind: 'page',
  title: string,
  category?: string,
  blocks: BlockSpec[],
}
```

`BlockSpec` is a discriminated union:

- `TableSpec` — `{ kind: 'table', resource, columns?, filters?, search?, pageSize?, rowActions?, bulkActions? }`
- `FormSpec` — `{ kind: 'form', resource, id?, sections?, onSuccessTo? }`
- `DetailSpec` — `{ kind: 'detail', resource, id, embeds? }`
- `HeadingSpec` — `{ kind: 'heading', text, level? }`
- `MarkdownSpec` — `{ kind: 'markdown', body }`

## Validating

```ts
import { descriptor } from '@davepi/ui-core';

const result = descriptor.PageSpec.safeParse(spec);
if (!result.success) throw result.error;
```

Or call `validate_page_spec({ spec })` over the MCP server for the same parse + structured error response.
