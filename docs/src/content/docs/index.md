---
title: Why davepi-ui
description: Schema-driven, agent-first admin framework for davepi backends.
template: splash
hero:
  title: Schema-driven admin. Agent-composable.
  tagline: Auto-generated views from your davepi `/_describe` manifest. shadcn-themed. JSON-descriptor-composable.
  actions:
    - text: Get started
      link: /start/getting-started/
      icon: right-arrow
    - text: GitHub
      link: https://github.com/projik/davepi-ui
      icon: external
      variant: minimal
---

## What this gives you

- **Zero boilerplate per resource.** Every schema in your davepi backend gets a list, detail, create, and edit page for free.
- **Relations that work.** A `belongsTo` field renders as a searchable combobox, not a UUID input. A parent's detail page embeds child lists with inline create.
- **Override anything, but only when you need to.** App-wide config + per-resource override files. Inline JSX is the escape hatch.
- **shadcn out of the box.** Tailwind + Radix primitives + dark mode default.
- **AI agents are first-class.** A JSON descriptor schema + an MCP server let agents compose pages programmatically.

## The pain points it solves

| Old Refine-style admin | davepi-ui |
|---|---|
| Field labels show `firstName` | `First Name` via title-case + acronym table + Id-suffix strip |
| Relations require manual UUID entry | Combobox with `__q` search + inline "+ Create new" |
| No way to create a child from parent's page | `<RelatedList>` embeds + `RelatedCreateModal` stamps parent FK |
| Generic look | shadcn defaults + dark mode + Tailwind tokens |
