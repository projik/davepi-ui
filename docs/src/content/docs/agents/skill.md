---
title: Claude Code skill
description: Drop-in skill that teaches Claude Code how to author davepi-ui pages.
---

`docs/skill/davepi-ui/SKILL.md` ships a self-contained Claude Code skill. Copy it into a project that consumes davepi-ui to give Claude full context on the framework.

## Install

```bash
mkdir -p .claude/skills/
cp -r node_modules/@davepi/ui-docs/skill/davepi-ui .claude/skills/davepi-ui
```

Or symlink during development:

```bash
ln -s ../../node_modules/@davepi/ui-docs/skill/davepi-ui .claude/skills/davepi-ui
```

## What it gives Claude

- Override merge order — config / per-resource / inline JSX precedence.
- Recipe-by-recipe cookbook (list columns, form sections, sidebar categories, custom widgets, ACL gating).
- File-finding cheat sheet — where each piece of behaviour lives.
- Don't-dos — common traps (don't store access tokens in localStorage, don't fetch `/_describe` more than once, don't bypass merge order).

## Triggers

The skill's `description` frontmatter triggers on:

- "davepi-ui", "admin UI", "ResourceTable", "RelationPicker", "/_describe", "shadcn admin", "agent first admin"
- Presence of `packages/ui-app-react`, `davepi-ui.config.ts`, or `src/resources/` in the project root
- CLAUDE.md mentions of davepi
