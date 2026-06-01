---
title: MCP server
description: Wire @davepi/ui-mcp into Claude Code or any MCP client.
---

`@davepi/ui-mcp` exposes the component manifest, descriptor schemas, recipes, and a live resource graph as MCP tools.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `list_components` | — | name + category + package + description per entry |
| `describe_component` | `{ name }` | full manifest entry with props + examples + agentNotes |
| `list_recipes` | — | curated patterns |
| `validate_page_spec` | `{ spec }` | parsed PageSpec or structured zod issues |
| `list_resources` | — | live `/_describe` paths + display info + relations |
| `relation_graph` | — | full edge list across every resource |

## Configuration

`.mcp.json` (or `mcp.json` for project-scoped configs):

```json
{
  "mcpServers": {
    "davepi-ui": {
      "command": "node",
      "args": ["./node_modules/@davepi/ui-mcp/dist/server.js"],
      "env": {
        "DAVEPI_API_URL": "http://localhost:4001",
        "DAVEPI_API_TOKEN": "<optional bearer token>"
      }
    }
  }
}
```

The token is optional — only needed when the backend's `/_describe` requires auth (`DESCRIBE_REQUIRES_AUTH=true`).

## Smoke-testing the server

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node packages/ui-mcp/dist/server.js
```
