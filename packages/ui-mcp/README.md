# @davepi/ui-mcp

MCP server exposing the [davepi-ui](https://github.com/projik/davepi-ui) component manifest, JSON page descriptors, recipes, and a live resource graph to AI agents. Pair with a [davepi](https://github.com/projik/davepi) backend so Claude Code (or any MCP client) can compose admin pages programmatically.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `list_components` | — | name + category + package + description per entry |
| `describe_component` | `{ name }` | full manifest entry with props JSON Schema + examples + agent notes |
| `list_recipes` | — | curated patterns (`list-with-search`, `detail-with-children`, `pre-stamped-create`, …) |
| `validate_page_spec` | `{ spec }` | parsed `PageSpec` or structured zod issues |
| `list_resources` | — | live `/_describe` paths + display info + relations (requires `DAVEPI_API_URL`) |
| `relation_graph` | — | full edge list across all resources (requires `DAVEPI_API_URL`) |

## Install

```bash
npm install -g @davepi/ui-mcp
# or use via npx without installing
```

## Configure

`.mcp.json` (or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "davepi-ui": {
      "command": "npx",
      "args": ["-y", "@davepi/ui-mcp"],
      "env": {
        "DAVEPI_API_URL": "http://localhost:4001",
        "DAVEPI_API_TOKEN": "<optional bearer token>"
      }
    }
  }
}
```

`DAVEPI_API_TOKEN` is only needed when the backend has `DESCRIBE_REQUIRES_AUTH=true`.

## Docs

https://github.com/projik/davepi-ui

## License

MIT
